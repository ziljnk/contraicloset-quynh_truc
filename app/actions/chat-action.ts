"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/utils/firebase";
import { collection, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import {
	AESTHETIC_KEYWORDS,
	OCCASION_KEYWORDS,
	SEASON_KEYWORDS,
	COLOR_KEYWORDS,
	FORMALITY_KEYWORDS,
} from "@/utils/chat-dictionaries";

const GEN_AI_API_KEY = process.env.GOOGLE_API_KEY || "";
const GEMINI_MODEL_NAME = process.env.GOOGLE_GEMINI_MODEL || "gemini-2.5-flash"; // Default fallback

interface OutfitData {
	id: string;
	title: string;
	description?: string;
	aesthetic_vibe?: string;
	occasion?: string;
	season?: string;
	color_palette?: string;
	formality?: string;
	images?: string[];
	mainComponents?: string[];
	score?: number;
}

interface ChatResponse {
	text: string;
	outfits: OutfitData[];
}

// Helper to extract keywords from user query
function extractFeatures(query: string) {
	const lowerQuery = query.toLowerCase();

	const aesthetics: string[] = [];
	const occasions: string[] = [];
	const seasons: string[] = [];
	const colors: string[] = [];
	const formalities: string[] = [];

	// Check dictionaries
	for (const [key, value] of Object.entries(AESTHETIC_KEYWORDS)) {
		if (lowerQuery.includes(key)) aesthetics.push(value);
	}
	for (const [key, value] of Object.entries(OCCASION_KEYWORDS)) {
		if (lowerQuery.includes(key)) occasions.push(value);
	}
	for (const [key, value] of Object.entries(SEASON_KEYWORDS)) {
		if (lowerQuery.includes(key)) seasons.push(value);
	}
	for (const [key, value] of Object.entries(COLOR_KEYWORDS)) {
		if (lowerQuery.includes(key)) colors.push(value);
	}
	for (const [key, value] of Object.entries(FORMALITY_KEYWORDS)) {
		if (lowerQuery.includes(key)) formalities.push(value);
	}

	return {
		aesthetics: Array.from(new Set(aesthetics)),
		occasions: Array.from(new Set(occasions)),
		seasons: Array.from(new Set(seasons)),
		colors: Array.from(new Set(colors)),
		formalities: Array.from(new Set(formalities)),
	};
}

function calculateScore(
	outfit: OutfitData,
	features: ReturnType<typeof extractFeatures>,
	query: string,
): number {
	let score = 0;

	// Scoring weights
	const WEIGHTS = {
		exactMatch: 30,
		textMatch: 15,
	};

	// Helper to check match in string (handles underscore joined strings like "vintage_minimal")
	const checkMatch = (
		outfitValue: string | undefined,
		targetValues: string[],
	) => {
		if (!outfitValue) return 0;
		let matches = 0;
		for (const val of targetValues) {
			if (outfitValue.includes(val)) matches++;
		}
		return matches;
	};

	const aestheticMatches = checkMatch(
		outfit.aesthetic_vibe,
		features.aesthetics,
	);
	score += aestheticMatches * WEIGHTS.exactMatch;

	const occasionMatches = checkMatch(outfit.occasion, features.occasions);
	score += occasionMatches * WEIGHTS.exactMatch;

	const seasonMatches = checkMatch(outfit.season, features.seasons);
	score += seasonMatches * WEIGHTS.exactMatch;

	const colorMatches = checkMatch(outfit.color_palette, features.colors);
	score += colorMatches * WEIGHTS.exactMatch;

	const formalityMatches = checkMatch(outfit.formality, features.formalities);
	score += formalityMatches * WEIGHTS.exactMatch;

	// Text Search in Title
	if (
		outfit.title &&
		outfit.title.toLowerCase().includes(query.toLowerCase())
	) {
		score += WEIGHTS.textMatch;
	}

	return score;
}

export async function getChatResponse(message: string): Promise<ChatResponse> {
	try {
		const collectionName =
			process.env.NEXT_PUBLIC_FIREBASE_OUTFITS_COLLECTION_NAME ||
			"outfits2";
		const outfitsRef = collection(db, collectionName);
		const snapshot = await getDocs(outfitsRef);

		const outfits: OutfitData[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				title: data.title || "",
				description: data.description,
				aesthetic_vibe: data.aesthetic_vibe,
				occasion: data.occasion,
				season: data.season,
				color_palette: data.color_palette,
				formality: data.formality,
				images: data.images,
				mainComponents: data.category_composition,
				score: 0,
			} as OutfitData;
		});

		const features = extractFeatures(message);

		// 1. Local Scoring
		const scoredOutfits = outfits.map((outfit) => ({
			...outfit,
			score: calculateScore(outfit, features, message),
		}));

		// Sort by score desc
		scoredOutfits.sort((a, b) => (b.score || 0) - (a.score || 0));

		const topOutfits = scoredOutfits.filter((o) => (o.score || 0) > 0);
		const maxScore = topOutfits.length > 0 ? topOutfits[0].score || 0 : 0;

		// 2. Threshold Logic
		if (maxScore >= 100) {
			return {
				text: "Dưới đây là những outfit phù hợp nhất với yêu cầu của bạn:",
				outfits: topOutfits.slice(0, 5),
			};
		}

		// 3. AI RAG Strategy
		// Select top 15 outfits
		const candidates = scoredOutfits.slice(0, 15);

		if (candidates.length === 0) {
			return {
				text: "Xin lỗi, tôi không tìm thấy outfit nào phù hợp với yêu cầu này. Bạn thử tìm từ khóa khác xem sao nhé!",
				outfits: [],
			};
		}

		// Initialize Gemini
		const genAI = new GoogleGenerativeAI(GEN_AI_API_KEY);
		const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

		const prompt = `
        Bạn là một trợ lý thời trang thông minh. Người dùng đang tìm kiếm outfit với yêu cầu: "${message}".
        
        Dưới đây là danh sách 15 outfits tiềm năng từ database của chúng tôi (được định dạng JSON):
        ${JSON.stringify(
			candidates.map((c) => ({
				id: c.id,
				title: c.title,
				aesthetic: c.aesthetic_vibe,
				occasion: c.occasion,
				season: c.season,
				color: c.color_palette,
				components: c.mainComponents,
				description: c.description,
			})),
		)}

        Nhiệm vụ của bạn:
        1. Chọn ra NHIỀU NHẤT 5 outfit phù hợp nhất với yêu cầu của người dùng.
        2. Nếu không có outfit nào thực sự phù hợp, hãy chọn những cái gần đúng nhất và giải thích cách mix-match thêm.
        3. Giải thích ngắn gọn tại sao bạn chọn các outfit đó (tối đa 2-3 câu). Không giải thích vấn đề kĩ thuật ở đây như là database không có dữ liệu,...
        CÁCH TRẢ LỜI:
            - Bắt đầu với: "Dựa trên outfit có sẵn..."
            - Gợi ý 2-3 outfit từ danh sách
            - Mỗi outfit: [TÊN ĐÚNG] + tại sao phù hợp + cách phối (sử dụng \n để xuống dòng giữa các outfit)
            - Kết thúc với: tips accessories
            - Hãy trình bày câu trả lời thoáng, dễ đọc bằng cách sử dụng ký tự \n để xuống dòng.
        4. Trả về câu trả lời dưới dạng JSON object với cấu trúc:
        {
            "selected_ids": ["id_1", "id_2"],
            "message": "Lời khuyên của bạn ở đây... (có chứa \n), trả lời dưới dạng markdown, không được chứa HTML."
        }
        CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC.
        `;

		const result = await model.generateContent(prompt);
		const responseHelper = result.response;
		let responseText = responseHelper.text();

		// Clean markdown code blocks if present
		responseText = responseText
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();

		try {
			const aiResponse = JSON.parse(responseText);
			const selectedIds = aiResponse.selected_ids || [];
			let aiMessage =
				aiResponse.message || "Dưới đây là các gợi ý cho bạn.";

			// Final Ranking: Prioritize outfits mentioned by AI (+50 points)
			// Re-sort the candidates based on AI selection
			const finalOutfits = candidates.map((outfit) => {
				if (selectedIds.includes(outfit.id)) {
					return { ...outfit, score: (outfit.score || 0) + 50 };
				}
				return outfit;
			});

			finalOutfits.sort((a, b) => (b.score || 0) - (a.score || 0));

			return {
				text: aiMessage,
				outfits: finalOutfits.slice(0, 5),
			};
		} catch (e) {
			console.error("Error parsing AI response", e);
			// Fallback to top scored if AI fails
			return {
				text: "Dưới đây là một số gợi ý dựa trên từ khóa bạn cung cấp:",
				outfits: candidates.slice(0, 5),
			};
		}
	} catch (error) {
		console.error("Chat Error:", error);
		return {
			text: "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn.",
			outfits: [],
		};
	}
}
