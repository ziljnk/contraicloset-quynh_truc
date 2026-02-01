import { db } from "@/utils/firebase";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";

export async function trackUserPreference(
    userId: string, 
    outfitData: any, 
    action: 'view' | 'save'
) {
    if (!userId || !outfitData) return;
    
    const points = action === 'save' ? 3 : 1;
    const userRef = doc(db, 'user_preferences', userId);
    
    const updates: any = {};
    const attributes = ['aesthetic', 'occasion', 'colors', 'formality', 'season'];

    attributes.forEach(attr => {
        if (outfitData[attr]) {
            // Handle both array and single string values
            const values = Array.isArray(outfitData[attr]) 
                ? outfitData[attr] 
                : [outfitData[attr]];
            
            values.forEach((val: any) => {
                if (typeof val === 'string') {
                    // Firestore dot notation for nested fields: aesthetic.Minimal
                    // Keys must be safe (no special chars usually). 
                    // If values contain '.', likely fine in dot notation if properly handled?
                    // Actually, if a value has a dot, dot notation interprets it as separator.
                    // Assuming values like "Minimal", "Streetwear" are safe.
                    const key = `${attr}.${val}`; 
                    updates[key] = increment(points);
                }
            });
        }
    });

    if (Object.keys(updates).length === 0) return;

    try {
        // Use setDoc with merge: true to create if not exists
        await setDoc(userRef, updates, { merge: true });
    } catch (error) {
        console.error("Error updating user preferences:", error);
    }
}

export function calculateOutfitScore(outfit: any, userPreferences: any): number {
    if (!userPreferences) return 0;
    
    let score = 0;
    const attributes = ['aesthetic', 'occasion', 'colors', 'formality', 'season'];
    
    attributes.forEach(attr => {
        // Ensure we handle case sensitivity if needed. Typically tags are consistent.
        if (outfit[attr] && userPreferences[attr]) {
            const values = Array.isArray(outfit[attr]) 
                ? outfit[attr] 
                : [outfit[attr]];
            
            values.forEach((val: any) => {
                if (typeof val === 'string' && userPreferences[attr][val]) {
                    score += (userPreferences[attr][val] || 0);
                }
            });
        }
    });
    
    return score;
}
