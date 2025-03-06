"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { Send, User, PlusCircle, Activity, Timer, BarChart, MessageSquare, HelpCircle, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Define types for our chat history
type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

type Chat = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
}

export default function ChatPage() {
  // Chat state management
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Change the initial state of sidebarOpen to false
  const [isMobile, setIsMobile] = useState(false)

  // Initialize useChat with the current chat's messages
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, setMessages } = useChat({
    id: activeChatId || undefined,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chats from localStorage on initial render
  useEffect(() => {
    const savedChats = localStorage.getItem("chats")
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
      }))
      setChats(parsedChats)

      // Set active chat to the most recent one if it exists
      if (parsedChats.length > 0) {
        const mostRecentChat = parsedChats.sort(
          (a: Chat, b: Chat) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0]
        setActiveChatId(mostRecentChat.id)
        setMessages(mostRecentChat.messages)
      } else {
        createNewChat()
      }
    } else {
      createNewChat()
    }
  }, [setMessages])

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("chats", JSON.stringify(chats))
    }
  }, [chats])

  // Update the current chat's messages when messages change
  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                messages: messages,
                title: getChatTitle(messages),
              }
            : chat,
        ),
      )
    }
  }, [messages, activeChatId])

  // Function to create a chat title from messages
  const getChatTitle = (msgs: ChatMessage[]): string => {
    // Get the first user message as the title, or use a default
    const firstUserMessage = msgs.find((msg) => msg.role === "user")
    if (firstUserMessage) {
      // Truncate to first 30 characters
      return firstUserMessage.content.length > 30
        ? firstUserMessage.content.substring(0, 30) + "..."
        : firstUserMessage.content
    }
    return "New Chat"
  }

  // Function to create a new chat
  const createNewChat = () => {
    const newChatId = Date.now().toString()
    const newChat: Chat = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
    }

    setChats((prevChats) => [newChat, ...prevChats])
    setActiveChatId(newChatId)
    setMessages([])
    setInput("")

    // Close sidebar on mobile after creating a new chat
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  // Function to switch to a different chat
  const switchChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId)
    if (chat) {
      setActiveChatId(chatId)
      setMessages(chat.messages)
      setInput("")

      // Close sidebar on mobile after switching chats
      if (isMobile) {
        setSidebarOpen(false)
      }
    }
  }

  // Function to delete a chat
  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent onClick

    const updatedChats = chats.filter((chat) => chat.id !== chatId)
    setChats(updatedChats)

    // If we're deleting the active chat, switch to the most recent one
    if (chatId === activeChatId && updatedChats.length > 0) {
      const mostRecentChat = updatedChats[0]
      setActiveChatId(mostRecentChat.id)
      setMessages(mostRecentChat.messages)
    } else if (updatedChats.length === 0) {
      // If no chats left, create a new one
      createNewChat()
    }
  }

  // Example sports performance prompts
  const examplePrompts = [
    {
      title: "Running Analysis",
      description: "Analyze my 5K running performance",
      prompt:
        "I've been running 5K three times a week. My times are 25:30, 24:45, and 26:10. How can I improve my performance?",
      icon: <Timer className="h-8 w-8" />,
    },
    {
      title: "Workout Plan",
      description: "Create a personalized workout routine",
      prompt:
        "I'm a 35-year-old intermediate athlete looking to improve my overall strength and endurance. Can you create a 4-day workout plan for me?",
      icon: <Activity className="h-8 w-8" />,
    },
    {
      title: "Performance Stats",
      description: "Interpret my fitness metrics",
      prompt:
        "My resting heart rate is 65 bpm, I can do 30 push-ups in one set, and I can run a mile in 8 minutes. How do these stats compare to average fitness levels?",
      icon: <BarChart className="h-8 w-8" />,
    },
  ]

  // Function to handle example prompt selection
  const handleExampleSelect = (prompt: string) => {
    setInput(prompt)
  }

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Get current chat title
  const currentChat = chats.find((chat) => chat.id === activeChatId)
  const currentChatTitle = currentChat?.title || "New Chat"

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen) {
        // Update the click outside handler to work on all devices, not just mobile
        const sidebar = document.getElementById("sidebar")
        const toggleButton = document.getElementById("sidebar-toggle")

        if (
          sidebar &&
          !sidebar.contains(event.target as Node) &&
          toggleButton &&
          !toggleButton.contains(event.target as Node)
        ) {
          setSidebarOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [sidebarOpen]) // Update dependency array

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        id="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "w-64", // Update the sidebar div to be closed by default on all devices
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b">
          {" "}
          {/* Update the sidebar header to include a close button on all devices */}
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="font-semibold">Chat History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            {" "}
            {/* Update the sidebar header to include a close button on all devices */}
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-3">
          <Button
            variant="outline"
            size="sm"
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 mb-4"
          >
            <PlusCircle className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="px-3 py-2 space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => switchChat(chat.id)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer",
                  chat.id === activeChatId ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{chat.title}</span>
                </div>
                {chats.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => deleteChat(chat.id, e)}
                    className={cn(
                      "h-6 w-6 opacity-60 hover:opacity-100",
                      chat.id === activeChatId ? "text-primary-foreground hover:bg-primary/80" : "",
                    )}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              {" "}
              {/* Update the header to make the menu button visible on all devices */}
              <Button id="sidebar-toggle" variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">{currentChatTitle}</h1>
            </div>

            <Button variant="outline" size="sm" onClick={createNewChat} className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              {!isMobile && "New Chat"}
            </Button>
          </div>
        </header>

        <main className="flex-1 container py-4 overflow-auto">
          <Card className="h-[calc(100vh-8rem)]">
            <CardContent className="p-0 flex flex-col h-full">
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <HelpCircle className="h-12 w-12 mb-4" />
                    <p className="mb-2 text-lg font-medium">Welcome to AI Chat!</p>
                    <p className="text-muted-foreground mb-8">
                      Start a conversation by typing a message below or try one of these examples:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                      {examplePrompts.map((example, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleExampleSelect(example.prompt)}
                        >
                          <CardContent className="p-4 flex flex-col items-center text-center">
                            <div className="rounded-full bg-primary/10 p-3 mb-3 text-primary">{example.icon}</div>
                            <CardTitle className="text-base mb-1">{example.title}</CardTitle>
                            <CardDescription>{example.description}</CardDescription>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex items-start gap-2 max-w-[80%] ${
                            message.role === "user" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border ${
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            {message.role === "user" ? (
                              <User className="h-5 w-5" />
                            ) : (
                              <MessageSquare className="h-5 w-5" />
                            )}
                          </div>
                          <div
                            className={`rounded-lg px-3 py-2 text-sm ${
                              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button type="submit" size={isMobile ? "icon" : "default"} disabled={isLoading || !input.trim()}>
                    {isMobile ? (
                      <Send className="h-4 w-4" />
                    ) : (
                      <>
                        Send
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

