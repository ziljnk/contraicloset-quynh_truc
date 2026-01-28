"use client"

import * as React from "react"
import { MessageSquare, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ChatBot() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState([
    {
      id: 1,
      text: "Xin chào! 👋 Tôi là trợ lý phối đồ của bạn. Hãy hỏi tôi về outfit bạn muốn tìm!",
      sender: "bot"
    }
  ])
  const [inputValue, setInputValue] = React.useState("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const suggestions = [
    "Tôi muốn đi biển",
    "Outfit đi làm",
    "Đi cafe cuối tuần",
    "Du lịch mùa hè",
    "Đi chơi với bạn",
    "Set đồ tối giản"
  ]

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }])
    setInputValue("")
    
    // Simulate bot response (fake data)
    setTimeout(() => {
        setMessages(prev => [...prev, { 
            id: Date.now() + 1, 
            text: "Cảm ơn bạn đã quan tâm! Đây là tính năng đang phát triển. Tôi sẽ sớm có thể gợi ý outfit cho bạn.", 
            sender: "bot" 
        }])
    }, 1000)
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
        <Card className="border-none shadow-2xl overflow-hidden flex flex-col h-[500px] w-full bg-white rounded-2xl">
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
                <div 
                    key={msg.id} 
                    className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                        msg.sender === "bot" 
                            ? "bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-100" 
                            : "bg-[#3E3228] text-white ml-auto rounded-tr-sm"
                    )}
                >
                    {msg.text}
                </div>
             ))}

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
                />
                <Button 
                    size="icon" 
                    className={cn(
                        "h-8 w-8 rounded-full bg-[#3E3228] hover:bg-[#3E3228]/90 shrink-0 transition-opacity",
                        inputValue.trim() ? "opacity-100" : "opacity-50"
                    )}
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim()}
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
