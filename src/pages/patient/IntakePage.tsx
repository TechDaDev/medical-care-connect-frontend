import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { intakeApi } from "../../api/intake";
import { consultationsApi } from "../../api/consultations";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Textarea } from "../../components/common/Textarea";
import { Spinner } from "../../components/common/Spinner";
import { Alert } from "../../components/common/Alert";
import { ApiRequestError } from "../../utils/errors";

export function IntakePage() {
  const { t } = useI18n();
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => consultationsApi.getById(consultationId!),
    enabled: !!consultationId,
  });

  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ["intake-session", sessionId],
    queryFn: () => intakeApi.getSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const startMutation = useMutation({
    mutationFn: () => intakeApi.start(consultationId!),
    onSuccess: (data) => {
      setSessionId(data.id);
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 503) {
        setError(t("intake.unavailable"));
      } else {
        setError(t("common.error"));
      }
    },
  });

  const answerMutation = useMutation({
    mutationFn: (ans: string) => intakeApi.answer(sessionId!, ans),
    onSuccess: (data) => {
      setAnswer("");
      refetchSession();
      if (data.ready_for_review) {
        // Intake complete - navigate to medical records
        navigate(`/app/patient/consultations/${consultationId}`);
      }
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 400) {
        setError(err.message);
      } else {
        setError(t("common.error"));
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages]);

  if (!sessionId && !startMutation.isPending && !error) {
    startMutation.mutate();
  }

  if (startMutation.isPending) return <Spinner />;
  if (error && !session) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="warning">{error}</Alert>
        <Link
          to={`/app/patient/consultations/${consultationId}`}
          className="text-blue-600 mt-4 block"
        >
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const isEmergency = session?.emergency_detected;
  const isComplete = session?.ready_for_review;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("intake.title")}
      </h1>

      {isEmergency && (
        <Alert variant="error">
          {session?.emergency_instruction || t("intake.emergencyMsg")}
        </Alert>
      )}

      {isComplete && (
        <Alert variant="success">
          {t("intake.complete")}
        </Alert>
      )}

      <Card className="mb-4">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {session?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "patient" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                  msg.role === "patient"
                    ? "bg-blue-600 text-white"
                    : msg.role === "system"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {answerMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500">
                ...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {session && (
        <p className="text-sm text-gray-500 mb-2">
          {t("intake.progress", {
            current: session.messages.length,
            total: session.question_count || "?",
          })}
        </p>
      )}

      {!isEmergency && !isComplete && (
        <div className="flex gap-2">
          <Textarea
            placeholder={t("intake.answer")}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => {
              if (answer.trim()) {
                setError("");
                answerMutation.mutate(answer);
              }
            }}
            loading={answerMutation.isPending}
            disabled={!answer.trim()}
          >
            {t("intake.submit")}
          </Button>
        </div>
      )}

      {isComplete && (
        <Link to={`/app/patient/consultations/${consultationId}`}>
          <Button variant="secondary" className="w-full mt-4">
            {t("common.back")}
          </Button>
        </Link>
      )}
    </div>
  );
}
