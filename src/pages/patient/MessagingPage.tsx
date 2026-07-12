import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "../../api/messages";
import { consultationsApi } from "../../api/consultations";
import { t } from "../../utils/i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Textarea } from "../../components/common/Textarea";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { useAuth } from "../../auth";

const POLL_MS = Number(import.meta.env.VITE_MESSAGE_POLL_INTERVAL_MS) || 10000;

export function MessagingPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [sendError, setSendError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const { data: consultation } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => consultationsApi.getById(consultationId!),
    enabled: !!consultationId,
  });

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["messages", consultationId],
    queryFn: () => messagesApi.list(consultationId!),
    enabled: !!consultationId,
    refetchInterval: POLL_MS,
  });

  const sendMutation = useMutation({
    mutationFn: () => messagesApi.send(consultationId!, content),
    onSuccess: () => {
      setContent("");
      setSendError("");
      queryClient.invalidateQueries({ queryKey: ["messages", consultationId] });
    },
    onError: (err: Error) => {
      setSendError(err.message);
    },
  });

  // Mark unread messages as read
  useEffect(() => {
    if (!messages || !user) return;
    const unreadIds = messages
      .filter(
        (m) =>
          m.sender !== user.id &&
          !m.read_by?.some((r) => r.user_id === user.id)
      )
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      messagesApi.markRead(consultationId!, unreadIds);
    }
  }, [messages, user, consultationId]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setAutoScroll(nearBottom);
    },
    []
  );

  const isBlocked = consultation
    ? [
        "completed",
        "cancelled",
        "emergency_escalated",
      ].includes(consultation.status)
    : false;

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState />;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {t("message.title")}
      </h1>

      <Card className="flex-1 flex flex-col mb-4" padding={false}>
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          onScroll={handleScroll}
        >
          {messages && messages.length === 0 ? (
            <EmptyState message={t("message.empty")} />
          ) : (
            messages?.map((msg) => {
              const isMine = msg.sender === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
                      isMine
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {!isMine && (
                      <p className="text-xs text-gray-500 mb-1">
                        {msg.sender_name}
                      </p>
                    )}
                    <p>{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isMine ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {new Date(msg.sent_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {isBlocked ? (
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              {t("message.blocked")}
            </p>
          </div>
        ) : (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Textarea
                placeholder={t("message.placeholder")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button
                onClick={() => {
                  if (content.trim()) sendMutation.mutate();
                }}
                loading={sendMutation.isPending}
                disabled={!content.trim()}
              >
                {t("message.send")}
              </Button>
            </div>
            {sendError && (
              <p className="text-sm text-red-600 mt-1">{sendError}</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
