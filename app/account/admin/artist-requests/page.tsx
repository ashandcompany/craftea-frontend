"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  artistRequests as artistRequestsApi,
  type ArtistRequest,
  type ArtistRequestMessage,
} from "@/lib/api";
import {
  Palette, Hourglass, Send, Loader, CheckCircle, XCircle, MessageSquare, ChevronLeft,
} from "lucide-react";
import { AccountPageHeader } from "@/components/account/page-header";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:        { label: "en attente",          className: "border-amber-200 bg-amber-50 text-amber-700" },
  info_requested: { label: "précisions demandées", className: "border-blue-200 bg-blue-50 text-blue-700" },
  approved:       { label: "approuvée",            className: "border-green-200 bg-green-50 text-green-700" },
  rejected:       { label: "refusée",              className: "border-stone-200 bg-stone-50 text-stone-500" },
};

export default function AdminArtistRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<ArtistRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ArtistRequest | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageSending, setMessageSending] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadRequests();
  }, [user]);

  useEffect(() => {
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [selected?.messages]);

  if (!user || user.role !== "admin") {
    router.push("/account");
    return null;
  }

  const loadRequests = () => {
    setLoading(true);
    artistRequestsApi.adminList()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const selectRequest = async (req: ArtistRequest) => {
    setSelected(null);
    setSelectedLoading(true);
    try {
      const full = await artistRequestsApi.adminGet(req.id);
      setSelected(full);
    } finally {
      setSelectedLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selected || !messageText.trim()) return;
    setMessageSending(true);
    try {
      const msg = await artistRequestsApi.adminAddMessage(selected.id, messageText.trim());
      setSelected((prev) => prev ? {
        ...prev,
        status: "info_requested",
        messages: [...(prev.messages || []), msg as ArtistRequestMessage],
      } : prev);
      setRequests((prev) => prev.map((r) => r.id === selected.id ? { ...r, status: "info_requested" } : r));
      setMessageText("");
    } catch { } finally {
      setMessageSending(false);
    }
  };

  const decide = async (action: "approve" | "reject") => {
    if (!selected) return;
    setDeciding(true);
    try {
      const result = await artistRequestsApi.adminDecide(selected.id, action);
      const newStatus = result.status as ArtistRequest["status"];
      setSelected((prev) => prev ? { ...prev, status: newStatus } : prev);
      setRequests((prev) => prev.map((r) => r.id === selected.id ? { ...r, status: newStatus } : r));
    } catch { } finally {
      setDeciding(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  const formatTime = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const active = requests.filter((r) => r.status === "pending" || r.status === "info_requested");
  const closed = requests.filter((r) => r.status === "approved" || r.status === "rejected");

  return (
    <div>
      <AccountPageHeader icon={Palette} title="> Demandes artistes" description="— examiner et répondre aux candidatures" />

      {loading ? (
        <div className="py-16 text-center text-stone-400">
          <div className="inline-block h-5 w-5 animate-pulse"><Hourglass /></div>
          <p className="mt-2 text-sm">chargement...</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Left — request list */}
          <div className="w-64 shrink-0 space-y-4">
            {active.length === 0 && closed.length === 0 && (
              <p className="py-8 text-center text-xs text-stone-400 italic">— aucune demande —</p>
            )}

            {active.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-stone-400">en cours ({active.length})</p>
                <div className="space-y-1">
                  {active.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => selectRequest(r)}
                      className={`w-full text-left border p-3 transition-colors ${
                        selected?.id === r.id ? "border-stone-800 bg-stone-50" : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-stone-800 truncate font-medium">
                            {r.user ? `${r.user.firstname} ${r.user.lastname}` : `#${r.user_id}`}
                          </p>
                          <p className="text-[10px] text-stone-400 truncate">{r.user?.email}</p>
                        </div>
                        <span className={`shrink-0 inline-block border px-1.5 py-0.5 text-[9px] ${STATUS_CONFIG[r.status]?.className}`}>
                          {STATUS_CONFIG[r.status]?.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-stone-400">{formatDate(r.created_at)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {closed.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-stone-400">clôturées ({closed.length})</p>
                <div className="space-y-1">
                  {closed.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => selectRequest(r)}
                      className={`w-full text-left border p-3 transition-colors ${
                        selected?.id === r.id ? "border-stone-800 bg-stone-50" : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-stone-800 truncate font-medium">
                            {r.user ? `${r.user.firstname} ${r.user.lastname}` : `#${r.user_id}`}
                          </p>
                          <p className="text-[10px] text-stone-400 truncate">{r.user?.email}</p>
                        </div>
                        <span className={`shrink-0 inline-block border px-1.5 py-0.5 text-[9px] ${STATUS_CONFIG[r.status]?.className}`}>
                          {STATUS_CONFIG[r.status]?.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-stone-400">{formatDate(r.created_at)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — thread */}
          <div className="flex-1 border border-stone-200">
            {selectedLoading ? (
              <div className="flex h-64 items-center justify-center text-stone-400">
                <Loader size={18} className="animate-spin" />
              </div>
            ) : !selected ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-stone-400">
                <MessageSquare size={24} className="text-stone-300" />
                <p className="text-xs">Sélectionnez une demande</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Thread header */}
                <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {selected.user ? `${selected.user.firstname} ${selected.user.lastname}` : `Demande #${selected.id}`}
                    </p>
                    {selected.user && <p className="text-[10px] text-stone-400">{selected.user.email}</p>}
                  </div>
                  <span className={`inline-block border px-2 py-0.5 text-[10px] ${STATUS_CONFIG[selected.status]?.className}`}>
                    {STATUS_CONFIG[selected.status]?.label}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
                  {(selected.messages || []).map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender_role === "admin" ? "flex-row-reverse" : ""}`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center border text-[10px] uppercase ${
                        msg.sender_role === "user" ? "border-stone-300 bg-stone-100 text-stone-500" : "border-stone-800 bg-stone-800 text-stone-50"
                      }`}>
                        {msg.sender_role === "user" ? (selected.user?.firstname?.[0] || "U") : "A"}
                      </div>
                      <div className={`max-w-[80%] space-y-1 flex flex-col ${msg.sender_role === "admin" ? "items-end" : "items-start"}`}>
                        <div className={`border px-3 py-2 text-sm ${
                          msg.sender_role === "user" ? "border-stone-200 bg-white text-stone-700" : "border-stone-800 bg-stone-800 text-stone-50"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-stone-400">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Actions */}
                {(selected.status === "pending" || selected.status === "info_requested") && (
                  <div className="border-t border-stone-200 p-4 space-y-3">
                    {/* Approve / Reject buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide("approve")}
                        disabled={deciding}
                        className="flex flex-1 items-center justify-center gap-1.5 border border-green-600 bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {deciding ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Approuver
                      </button>
                      <button
                        onClick={() => decide("reject")}
                        disabled={deciding}
                        className="flex flex-1 items-center justify-center gap-1.5 border border-red-300 bg-white px-3 py-2 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deciding ? <Loader size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Refuser
                      </button>
                    </div>

                    {/* Message input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Demander des précisions..."
                        className="flex-1 border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-600"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={messageSending || !messageText.trim()}
                        className="flex items-center gap-1.5 border border-stone-800 bg-stone-800 px-3 py-2 text-xs text-stone-50 hover:bg-stone-700 disabled:opacity-50"
                      >
                        {messageSending ? <Loader size={12} className="animate-spin" /> : <Send size={12} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400">Envoyer un message changera le statut en &quot;précisions demandées&quot;.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
