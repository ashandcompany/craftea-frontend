"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  messaging as messagingApi,
  type Conversation,
  type ConversationMessage,
} from "@/lib/api";
import { AccountPageHeader } from "@/components/account/page-header";
import {
  MessageSquare,
  Send,
  Loader,
  ChevronLeft,
  Inbox,
} from "lucide-react";

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0)
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function formatFull(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConversationItem({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-stone-100 transition-colors hover:bg-stone-50 ${
        active ? "bg-stone-100 border-l-2 border-l-stone-800" : "border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-stone-300 bg-stone-100 text-xs uppercase text-stone-600">
          {conv.other_user_name?.[0] ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-800 truncate">
              {conv.other_user_name ?? "Utilisateur inconnu"}
            </span>
            {conv.last_message_at && (
              <span className="shrink-0 text-[10px] text-stone-400">
                {formatTime(conv.last_message_at)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {conv.last_message_mine && (
              <span className="text-[10px] text-stone-400">Vous :</span>
            )}
            <p className="text-[11px] text-stone-500 truncate">
              {conv.last_message ?? "Aucun message"}
            </p>
          </div>
        </div>
        {conv.unread_count > 0 && (
          <span className="shrink-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-stone-800 px-1 text-[9px] text-white">
            {conv.unread_count}
          </span>
        )}
      </div>
    </button>
  );
}

function MessageBubble({
  msg,
  mine,
}: {
  msg: ConversationMessage;
  mine: boolean;
}) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] px-3 py-2 text-sm leading-relaxed ${
          mine
            ? "bg-stone-800 text-white"
            : "bg-stone-100 text-stone-800 border border-stone-200"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        <p
          className={`mt-1 text-[10px] text-right ${
            mine ? "text-stone-400" : "text-stone-400"
          }`}
        >
          {formatFull(msg.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("c")
    ? parseInt(searchParams.get("c")!)
    : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);

  const [selectedId, setSelectedId] = useState<number | null>(initialConvId);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [otherName, setOtherName] = useState<string | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Mobile: show list or thread
  const [mobileView, setMobileView] = useState<"list" | "thread">(
    initialConvId ? "thread" : "list",
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Load conversation list ──────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await messagingApi.listConversations();
      setConversations(data);
    } catch {
      /* silent */
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Load messages when conversation selected ───────────────────────────
  const loadMessages = useCallback(
    async (convId: number) => {
      setLoadingMsgs(true);
      setMessages([]);
      try {
        const detail = await messagingApi.getMessages(convId);
        setMessages(detail.data);
        setOtherName(detail.conversation.other_user_name);
        await messagingApi.markRead(convId);
        // Update unread count in local state
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c)),
        );
      } catch {
        /* silent */
      } finally {
        setLoadingMsgs(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  // ── Auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length) {
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    }
  }, [messages]);

  // ── Select conversation ────────────────────────────────────────────────
  const selectConversation = (id: number) => {
    setSelectedId(id);
    setMobileView("thread");
    router.replace(`/account/messages?c=${id}`, { scroll: false });
  };

  // ── Send message ───────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!selectedId || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const msg = await messagingApi.send(selectedId, content);
      setMessages((prev) => [...prev, msg]);
      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                last_message: content,
                last_message_at: msg.created_at,
                last_message_mine: true,
              }
            : c,
        ),
      );
    } catch {
      setInput(content); // Restore on error
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  return (
    <div>
      <AccountPageHeader
        icon={MessageSquare}
        title="> Messagerie"
        description="— échangez avec les artisans"
      />

      <div className="mt-6 border border-stone-200 overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: 420 }}>
        <div className="flex h-full">
          {/* ── Conversation list ──────────────────────────────────────── */}
          <div
            className={`flex flex-col border-r border-stone-200 w-full md:w-64 shrink-0 ${
              mobileView === "thread" ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="border-b border-stone-200 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-stone-500">
                conversations
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size={16} className="animate-spin text-stone-400" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Inbox size={24} className="text-stone-300 mb-2" />
                  <p className="text-xs text-stone-400">
                    Aucune conversation
                  </p>
                  <p className="text-[10px] text-stone-300 mt-1">
                    Contactez un artisan depuis sa page profil
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    active={selectedId === conv.id}
                    onClick={() => selectConversation(conv.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Message thread ─────────────────────────────────────────── */}
          <div
            className={`flex flex-col flex-1 min-w-0 ${
              mobileView === "list" ? "hidden md:flex" : "flex"
            }`}
          >
            {selectedId ? (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
                  <button
                    className="md:hidden text-stone-500 hover:text-stone-800"
                    onClick={() => setMobileView("list")}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex h-7 w-7 items-center justify-center border border-stone-300 bg-stone-100 text-xs uppercase text-stone-600">
                    {otherName?.[0] ?? "?"}
                  </div>
                  <span className="text-sm font-medium text-stone-800">
                    {otherName ?? "…"}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader size={16} className="animate-spin text-stone-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-xs text-stone-400">
                        Envoyez votre premier message
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          mine={msg.sender_id === user.id}
                        />
                      ))}
                      <div ref={bottomRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-stone-200 px-4 py-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      placeholder="Votre message… (Entrée pour envoyer)"
                      className="flex-1 resize-none border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:border-stone-400 focus:outline-none"
                      style={{ maxHeight: 120 }}
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="flex h-9 w-9 items-center justify-center bg-stone-800 text-white transition-opacity disabled:opacity-40 hover:bg-stone-700"
                    >
                      {sending ? (
                        <Loader size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-stone-400">
                    Shift+Entrée pour un saut de ligne
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={32} className="mx-auto text-stone-200 mb-3" />
                  <p className="text-sm text-stone-400">
                    Sélectionnez une conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
