"use client"

import * as React from "react"
import { MessageSquare, X, Send, Loader2, Shirt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getChatResponse } from "@/app/actions/chat-action"
import Link from "next/link"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"

type OutfitData = {
    id: string;
    title: string;
    images?: string[];
    [key: string]: any;
};

type Message = {
    id: number;
    text: string;
    sender: "bot" | "user";
    outfits?: OutfitData[];
};

export function ChatBot() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 1,
      text: "Xin chào! 👋 Tôi là trợ lý phối đồ của bạn. Hãy hỏi tôi về outfit bạn muốn tìm!",
      sender: "bot"
    }
  ])
  const [inputValue, setInputValue] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen, isLoading])

  const suggestions = [
    "Tôi muốn đi biển",
    "Outfit đi làm",
    "Đi cafe cuối tuần",
    "Du lịch mùa hè",
    "Đi chơi với bạn",
    "Set đồ tối giản"
  ]

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }])
    setInputValue("")
    setIsLoading(true)
    
    try {
        const result = await getChatResponse(text);
        setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            text: result.text, 
            sender: "bot",
            outfits: result.outfits
        }])
    } catch (error) {
        console.error("Chat error:", error);
         setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            text: "Xin lỗi, tôi gặp chút rắc rối khi tìm kiếm. Bạn thử lại sau nhé!", 
            sender: "bot" 
        }])
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <>
      <div className={cn("fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8", isOpen ? "hidden" : "block")}>
        <Button 
            onClick={() => setIsOpen(true)}
            size="icon" 
            className="h-14 w-14 rounded-full shadow-lg bg-[#3E3228] hover:bg-[#3E3228]/90 text-white animate-in zoom-in duration-300"
        >
          <MessageSquare className="h-7 w-7" />
        </Button>
      </div>

      <div className={cn(
        "fixed bottom-20 right-4 z-50 w-[350px] md:bottom-8 md:right-8 transition-all duration-300 ease-in-out origin-bottom-right",
        isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
      )}>
        <Card className="border-none pt-0 shadow-2xl overflow-hidden flex flex-col h-[500px] w-full bg-white rounded-2xl">
          <CardHeader className="bg-[#3E3228] text-white p-4 flex flex-row items-center justify-between space-y-0 shrink-0">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              Trợ lý phối đồ
            </CardTitle>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:text-white/80 hover:bg-white/10 rounded-full"
                onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scrollbar-hide">
             {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                    <div 
                        className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm w-fit",
                            msg.sender === "bot" 
                                ? "bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-100" 
                                : "bg-[#3E3228] text-white ml-auto rounded-tr-sm"
                        )}
                    >
                        <ReactMarkdown 
                            remarkPlugins={[remarkBreaks]}
                            components={{
                                p: ({node: _node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                ul: ({node: _node, ...props}) => <ul className="list-disc ml-4 mb-2 last:mb-0" {...props} />,
                                ol: ({node: _node, ...props}) => <ol className="list-decimal ml-4 mb-2 last:mb-0" {...props} />,
                                li: ({node: _node, ...props}) => <li className="mb-1" {...props} />,
                                a: ({node: _node, ...props}) => <a className="underline hover:opacity-80" {...props} />,
                                strong: ({node: _node, ...props}) => <span className="font-bold" {...props} />,
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                    </div>
                    
                    {/* Render Outfits if available */}
                    {msg.outfits && msg.outfits.length > 0 && (
                        <div className="flex flex-col gap-2 mt-1 w-full max-w-[90%]">
                            {msg.outfits.map((outfit) => (
                                <Link 
                                    key={outfit.id} 
                                    href={`/outfit/${encodeURIComponent(outfit.id)}`}
                                    className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all hover:border-[#3E3228]/20 group"
                                >
                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-100">
                                        <Image
                                            src={outfit.images?.[0] || outfit.imageSource || "https://placehold.co/100"}
                                            alt={outfit.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="48px"
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 line-clamp-1">
                                        {outfit.title}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
             ))}

             {isLoading && (
                 <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100 px-4 py-3 w-fit">
                     <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                 </div>
             )}

             {messages.length === 1 && (
                 <div className="grid grid-cols-2 gap-2 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     {suggestions.map((suggestion, index) => (
                         <button
                             key={index}
                             onClick={() => handleSendMessage(suggestion)}
                             className="text-xs font-medium text-left bg-[#F8F1E5] text-[#5C4D40] px-3 py-2.5 rounded-xl hover:bg-[#EBDCC2] transition-colors border border-[#EBDCC2]/30"
                         >
                             {suggestion}
                         </button>
                     ))}
                 </div>
             )}
             <div ref={messagesEndRef} />
          </CardContent>
          
          <CardFooter className="p-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex w-full items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 focus-within:ring-1 focus-within:ring-[#3E3228] focus-within:border-[#3E3228] transition-all bg-gray-50/50">
                <input 
                    className="flex-1 border-none outline-none bg-transparent text-sm h-9 placeholder:text-gray-400"
                    placeholder="Hỏi gì đó..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendMessage(inputValue)
                    }}
                    disabled={isLoading}
                />
                <Button 
                    size="icon" 
                    className={cn(
                        "h-8 w-8 rounded-full bg-[#3E3228] hover:bg-[#3E3228]/90 shrink-0 transition-opacity",
                        inputValue.trim() && !isLoading ? "opacity-100" : "opacity-50"
                    )}
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
