"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  ShoppingBag,
  RotateCcw,
  Crown,
  Check,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import { ProductCardProps } from "@/components/catalog/product-card";
import { SommelierService, SommelierResponse } from "@/services/sommelier.service";

interface ChatMessage {
  id: string;
  sender: "sommelier" | "user";
  text: string;
  suggestedProducts?: ProductCardProps[];
  timestamp: string;
}

export function SommelierConcierge() {
  const { addItem, openDrawer } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([
    "Why are Kashmiri Mamra Almonds special?",
    "Compare Medjool vs Ajwa Dates",
    "Diabetic-friendly & Low GI options",
    "Build a custom luxury gift casket",
  ]);
  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});
  const [addingItemMap, setAddingItemMap] = useState<Record<string, boolean>>({});
  const [cartError, setCartError] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<"catalog_rule_engine" | "live_ai">("catalog_rule_engine");

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const welcome = SommelierService.consult("");
    return [
      {
        id: "msg-welcome",
        sender: "sommelier",
        text: welcome.reply,
        suggestedProducts: welcome.suggestedProducts,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-sommelier", handleOpen);
    return () => window.removeEventListener("open-sommelier", handleOpen);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setCartError(null);

    try {
      let response: SommelierResponse;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch("/api/v1/ai/sommelier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: textToSend }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const json = await res.json();
        if (json.success && json.data) {
          response = json.data;
        } else {
          response = SommelierService.consult(textToSend);
        }
      } catch {
        response = SommelierService.consult(textToSend);
      }

      if (response.provider) {
        setActiveProvider(response.provider);
      }

      const assistantMsg: ChatMessage = {
        id: `sommelier-${Date.now()}`,
        sender: "sommelier",
        text: response.reply,
        suggestedProducts: response.suggestedProducts,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (response.quickPrompts && response.quickPrompts.length > 0) {
        setQuickPrompts(response.quickPrompts);
      }
    } catch (err) {
      console.error("Sommelier consultation failed", err);
      const fallbackMsg: ChatMessage = {
        id: `sommelier-err-${Date.now()}`,
        sender: "sommelier",
        text: "I encountered a momentary connection issue. Please explore our verified catalogue sections directly or try asking again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCart = async (product: ProductCardProps) => {
    if (product.stockStatus === "OUT_OF_STOCK") return;
    if (!product.variants || product.variants.length === 0) return;
    const defaultVariant = product.variants[0];
    if (addingItemMap[product.id]) return;

    setAddingItemMap((prev) => ({ ...prev, [product.id]: true }));
    setCartError(null);
    try {
      await addItem(defaultVariant.id, 1);
      setAddedItemMap((prev) => ({ ...prev, [product.id]: true }));
      openDrawer();
      setTimeout(() => {
        setAddedItemMap((prev) => ({ ...prev, [product.id]: false }));
      }, 2500);
    } catch (err: unknown) {
      console.error("Failed to add from Sommelier", err);
      const msg = err instanceof Error ? err.message : "Could not add item to cart. Please try again.";
      setCartError(msg);
      setTimeout(() => setCartError(null), 4000);
    } finally {
      setAddingItemMap((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const handleReset = () => {
    setIsTyping(false);
    setInput("");
    setCartError(null);
    const welcome = SommelierService.consult("");
    setActiveProvider(welcome.provider);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: "sommelier",
        text: welcome.reply,
        suggestedProducts: welcome.suggestedProducts,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setQuickPrompts(welcome.quickPrompts);
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#173D2C] text-[#FAF7F0] rounded-full shadow-2xl border-2 border-[#B89453]/60 hover:bg-[#102C21] hover:scale-105 transition-all duration-300 group cursor-pointer"
          aria-label="Open Royal Sommelier Assistant"
        >
          <div className="w-6 h-6 rounded-full bg-[#B89453]/20 flex items-center justify-center text-[#B89453]">
            <Crown className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#FAF7F0] flex items-center gap-1">
              <span>Ask Sommelier</span>
              <Sparkles className="w-3 h-3 text-[#B89453]" />
            </span>
            <span className="text-[9px] text-[#DDD2BF] hidden sm:inline">
              Luxury Advisory &amp; Pairings
            </span>
          </div>
        </button>
      )}

      {/* Sommelier Dialog Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Royal Gourmet Sommelier AI Concierge"
          className="fixed inset-x-3 bottom-3 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[440px] z-[60] flex flex-col h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-[#B89453]/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#173D2C] text-[#FAF7F0] flex items-center justify-between border-b border-[#B89453]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#B89453]/20 flex items-center justify-center border border-[#B89453]/50 text-[#B89453]">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-[#FAF7F0] flex items-center gap-1.5">
                  <span>Royal Gourmet Sommelier</span>
                  <span className="px-1.5 py-0.2 bg-[#B89453]/30 text-[#E5DEC9] text-[9px] font-sans font-semibold rounded uppercase tracking-wider">
                    {activeProvider === "live_ai" ? "Live AI Concierge" : "Catalogue Advisory"}
                  </span>
                </h4>
                <p className="text-[10px] text-[#DDD2BF]">
                  {activeProvider === "live_ai"
                    ? "Connected to Live AI Model"
                    : "Grounded in verified catalogue data (Offline Rule Engine)"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Restart Advisory"
                aria-label="Restart Advisory Conversation"
                className="p-1.5 text-[#DDD2BF] hover:text-[#FAF7F0] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close Assistant Panel"
                className="p-1.5 text-[#DDD2BF] hover:text-[#FAF7F0] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF7F0]" role="log" aria-live="polite">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#173D2C] text-[#FAF7F0] rounded-br-xs"
                      : "bg-white text-[#242824] border border-[#E5DEC9] shadow-xs rounded-bl-xs"
                  }`}
                >
                  <p>{m.text}</p>
                </div>

                {/* Suggested Products Inline Shelf */}
                {m.suggestedProducts && m.suggestedProducts.length > 0 && (
                  <div className="mt-2.5 space-y-2 w-full max-w-[94%]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#987B3E]">
                      Recommended Harvests:
                    </p>
                    <div className="space-y-1.5">
                      {m.suggestedProducts.map((p) => {
                        const defaultVariant = p.variants?.[0];
                        const isAdded = addedItemMap[p.id];
                        const isAdding = addingItemMap[p.id];
                        const isOutOfStock = p.stockStatus === "OUT_OF_STOCK";

                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-[#E5DEC9] hover:border-[#B89453] transition-all"
                          >
                            <Link
                              href={`/product/${p.slug}`}
                              className="flex items-center gap-2.5 flex-1 min-w-0"
                            >
                              <div className="relative w-10 h-10 rounded-lg bg-[#FAF7F0] shrink-0 overflow-hidden border border-[#E5DEC9]">
                                {p.primaryImage?.imageUrl ? (
                                  <Image
                                    src={p.primaryImage.imageUrl}
                                    alt={p.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#987B3E] font-serif font-bold text-xs">
                                    F&amp;N
                                  </div>
                                )}
                              </div>
                              <div className="truncate">
                                <h6 className="font-bold text-xs text-[#173D2C] truncate hover:text-[#B89453] transition-colors">
                                  {p.name}
                                </h6>
                                <p className="text-[10px] text-[#5F6D65]">
                                  {defaultVariant
                                    ? formatPrice(defaultVariant.sellingPrice)
                                    : p.priceRange
                                    ? formatPrice(p.priceRange.minSellingPrice)
                                    : ""}
                                  {defaultVariant && ` • ${defaultVariant.weightGrams}${defaultVariant.unit === "KILOGRAMS" ? "kg" : "g"}`}
                                </p>
                              </div>
                            </Link>

                            {isOutOfStock ? (
                              <span className="px-2.5 py-1.5 bg-neutral-200 text-neutral-500 text-[10px] font-semibold rounded-lg shrink-0">
                                Out of Stock
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAddToCart(p)}
                                disabled={isAdding || isAdded}
                                className="px-2.5 py-1.5 bg-[#173D2C] hover:bg-[#102C21] disabled:bg-neutral-200 disabled:text-neutral-500 text-[#FAF7F0] text-[10px] font-bold rounded-lg shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                              >
                                {isAdding ? (
                                  <div className="w-3 h-3 border-2 border-[#B89453] border-t-transparent rounded-full animate-spin" />
                                ) : isAdded ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-300" />
                                    <span>Added</span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag className="w-3 h-3 text-[#B89453]" />
                                    <span>Add</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <span className="text-[9px] text-[#5F6D65]/70 mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-[#5F6D65] text-xs p-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B89453] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B89453] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B89453] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[10px] italic">Consulting verified catalogue intelligence...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Cart Error Notice */}
          {cartError && (
            <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 text-rose-700 text-[11px] font-medium flex items-center justify-between">
              <span>{cartError}</span>
              <button
                type="button"
                onClick={() => setCartError(null)}
                className="text-rose-900 font-bold ml-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* Quick Prompts Row */}
          {quickPrompts.length > 0 && (
            <div className="px-3 py-2 bg-white border-t border-[#E5DEC9] overflow-x-auto flex gap-1.5 scrollbar-none">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isTyping}
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 text-[10px] font-medium bg-[#FAF7F0] hover:bg-[#173D2C] text-[#173D2C] hover:text-[#FAF7F0] disabled:opacity-40 border border-[#E5DEC9] rounded-full whitespace-nowrap transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-[#E5DEC9] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              disabled={isTyping}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Ask the Sommelier about gourmet harvests, origins, and pairings"
              placeholder={isTyping ? "Consulting..." : "Ask about nuts, dates, teas, or gifting..."}
              className="flex-1 text-xs px-3.5 py-2 bg-[#FAF7F0] border border-[#E5DEC9] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-[#173D2C] hover:bg-[#102C21] text-[#FAF7F0] rounded-xl disabled:opacity-40 transition-all cursor-pointer min-w-[36px] flex items-center justify-center"
              aria-label={isTyping ? "Consulting Sommelier..." : "Send question"}
            >
              {isTyping ? (
                <div className="w-4 h-4 border-2 border-[#B89453] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-[#B89453]" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
