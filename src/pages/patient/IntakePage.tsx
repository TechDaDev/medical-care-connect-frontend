import { useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { intakeApi } from "../../api/intake";
import { useI18n } from "../../i18n";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Textarea } from "../../components/common/Textarea";
import { Spinner } from "../../components/common/Spinner";
import { Alert } from "../../components/common/Alert";
import { ApiRequestError } from "../../utils/errors";

const MAX_ANSWER_LENGTH = 2000;
const REVIEW_STATES = new Set([
  "awaiting_patient_review",
  "correction_in_progress",
  "confirmed",
]);

type Phase = "intro" | "chat" | "review" | "confirmed" | "done" | "emergency" | "unavailable";

function phaseFromStatus(status: string | undefined, reviewReady: boolean): Phase {
  if (!status) return "intro";
  if (status === "submitted_to_doctor") return "done";
  if (status === "emergency_stopped") return "emergency";
  if (status === "temporarily_unavailable" || status === "failed") return "unavailable";
  if (status === "confirmed") return reviewReady ? "confirmed" : "review";
  if (REVIEW_STATES.has(status)) return "review";
  return "chat";
}

export function IntakePage() {
  const { t, formatDateTime, locale } = useI18n();
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [introduced, setIntroduced] = useState(false);
  const [error, setError] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ["intake-session", sessionId],
    queryFn: () => intakeApi.getSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const { data: review, refetch: refetchReview } = useQuery({
    queryKey: ["intake-review", sessionId],
    queryFn: () => intakeApi.review(sessionId!),
    enabled: !!sessionId && REVIEW_STATES.has(session?.status ?? ""),
  });

  const startMutation = useMutation({
    mutationFn: () => intakeApi.start(consultationId!, locale),
    onSuccess: (data) => {
      setSessionId(data.session_id);
      setIntroduced(true);
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 503) {
        setError(t("intake.unavailable"));
      } else if (err instanceof ApiRequestError && err.status === 409) {
        setError(t("intake.conflict"));
      } else {
        setError(t("intake.error"));
      }
      setIntroduced(true);
    },
  });

  const answerMutation = useMutation({
    mutationFn: (text: string) =>
      intakeApi.answer(sessionId!, text, crypto.randomUUID()),
    onSuccess: () => {
      setAnswer("");
      setError("");
      refetchSession();
      queryClient.invalidateQueries({ queryKey: ["consultation", consultationId] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError(t("intake.conflict"));
      } else {
        setError(t("intake.error"));
      }
      refetchSession();
    },
  });

  const correctionMutation = useMutation({
    mutationFn: (corrections: Record<string, { value?: unknown; status?: string }>) =>
      intakeApi.corrections(sessionId!, corrections, session!.updated_at, crypto.randomUUID()),
    onSuccess: () => {
      setEditingField(null);
      setEditValue("");
      setError("");
      refetchSession();
      refetchReview();
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError(t("intake.stale"));
        refetchSession();
      } else {
        setError(t("intake.error"));
      }
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      intakeApi.confirm(sessionId!, session!.updated_at, crypto.randomUUID()),
    onSuccess: () => {
      setError("");
      refetchSession();
      queryClient.invalidateQueries({ queryKey: ["consultation", consultationId] });
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError(t("intake.confirmBlocked"));
        refetchSession();
      } else {
        setError(t("intake.error"));
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      intakeApi.submit(sessionId!, session!.updated_at, crypto.randomUUID()),
    onSuccess: () => {
      setError("");
      refetchSession();
      queryClient.invalidateQueries({ queryKey: ["consultation", consultationId] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
    },
    onError: (err) => {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError(t("intake.stale"));
        refetchSession();
      } else {
        setError(t("intake.error"));
      }
    },
  });

  const phase = useMemo(
    () => phaseFromStatus(session?.status, review?.can_confirm ?? false),
    [session?.status, review?.can_confirm]
  );

  if (!introduced && !sessionId) {
    return (
      <Introduction
        onBegin={() => startMutation.mutate()}
        loading={startMutation.isPending}
      />
    );
  }

  if (startMutation.isPending && !sessionId) return <Spinner />;

  if (error && !session) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="warning">{error}</Alert>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => { setError(""); startMutation.mutate(); }}>
            {t("intake.retry")}
          </Button>
          <Link
            to={`/app/patient/consultations/${consultationId}`}
            className="text-blue-600 mt-2 block"
          >
            {t("common.back")}
          </Link>
        </div>
      </div>
    );
  }

  if (!session) return <Spinner />;

  if (phase === "done") {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("intake.title")}</h1>
        <Alert variant="success">{t("intake.submitted")}</Alert>
        {session.submitted_at && (
          <p className="text-sm text-gray-500 mt-3">
            {t("intake.submittedAt", { date: formatDateTime(session.submitted_at) })}
          </p>
        )}
        <Link to={`/app/patient/consultations/${consultationId}`} className="mt-4 block">
          <Button variant="secondary" className="w-full">{t("common.back")}</Button>
        </Link>
      </div>
    );
  }

  if (phase === "emergency") {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("intake.title")}</h1>
        <Alert variant="error" className="mb-4">
          <p className="font-semibold">{t("intake.emergencyTitle")}</p>
          <p className="mt-1">{t("intake.emergencySeekCare")}</p>
        </Alert>
        <p className="text-sm text-gray-600">{t("intake.emergencyBlocked")}</p>
        <Link to={`/app/patient/consultations/${consultationId}`} className="mt-4 block">
          <Button variant="secondary" className="w-full">{t("common.back")}</Button>
        </Link>
      </div>
    );
  }

  if (phase === "unavailable") {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("intake.title")}</h1>
        <Alert variant="warning">{t("intake.unavailable")}</Alert>
        <p className="text-sm text-gray-600 mt-3">{t("intake.unavailableRetry")}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => { setError(""); refetchSession(); }}>
            {t("intake.retry")}
          </Button>
          <Link
            to={`/app/patient/consultations/${consultationId}`}
            className="text-blue-600 mt-2 block"
          >
            {t("common.back")}
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "review" || phase === "confirmed") {
    return (
      <ReviewView
        review={review}
        session={session}
        phase={phase}
        error={error}
        editingField={editingField}
        setEditingField={setEditingField}
        editValue={editValue}
        setEditValue={setEditValue}
        onSaveCorrection={(field) =>
          correctionMutation.mutate({ [field]: { value: editValue, status: "answered" } })
        }
        onMarkUnknown={(field) =>
          correctionMutation.mutate({ [field]: { status: "unknown" } })
        }
        onDecline={(field) =>
          correctionMutation.mutate({ [field]: { status: "declined" } })
        }
        onContinueQuestions={() => {
          // Backend transitions back to in_progress on the next answer.
          setError("");
        }}
        onConfirm={() => confirmMutation.mutate()}
        onSubmit={() => submitMutation.mutate()}
        confirmPending={confirmMutation.isPending}
        submitPending={submitMutation.isPending}
        correctionPending={correctionMutation.isPending}
        onBack={() => navigate(`/app/patient/consultations/${consultationId}`)}
      />
    );
  }

  // ── Chat ──────────────────────────────────────────────────────────────
  const sending = answerMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("intake.title")}</h1>
      <p className="text-sm text-gray-500 mb-4">{t("intake.assistantNotice")}</p>

      <Card className="mb-4">
        <div
          className="space-y-4 max-h-[480px] overflow-y-auto p-4"
          role="log"
          aria-label={t("intake.conversationLabel")}
        >
          {session.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "patient" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "patient"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start" aria-live="polite">
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500">
                {t("intake.sending")}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      <div aria-live="polite" className="mb-3">
        {error && <Alert variant="warning">{error}</Alert>}
      </div>

      <div className="flex gap-2">
        <Textarea
          placeholder={t("intake.answerPlaceholder")}
          value={answer}
          disabled={sending}
          onChange={(e) => {
            setAnswer(e.target.value.slice(0, MAX_ANSWER_LENGTH));
            setError("");
          }}
          className="flex-1"
          aria-label={t("intake.answer")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (answer.trim() && !sending) {
                answerMutation.mutate(answer.trim());
              }
            }
          }}
        />
        <Button
          onClick={() => answerMutation.mutate(answer.trim())}
          disabled={!answer.trim() || sending}
          loading={sending}
        >
          {t("intake.send")}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={sending}
          onClick={() => answerMutation.mutate(t("intake.unknownPhrase"))}
        >
          {t("intake.dontKnow")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={sending}
          onClick={() => answerMutation.mutate(t("intake.declinePhrase"))}
        >
          {t("intake.preferNot")}
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {answer.length}/{MAX_ANSWER_LENGTH}
      </p>
    </div>
  );
}

function Introduction({ onBegin, loading }: { onBegin: () => void; loading: boolean }) {
  const { t } = useI18n();
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("intake.introTitle")}</h1>
      <Card className="mb-4">
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>{t("intake.introAutomated")}</li>
          <li>{t("intake.introNotDoctor")}</li>
          <li>{t("intake.introNotEmergency")}</li>
          <li>{t("intake.introSharedWithDoctor")}</li>
          <li>{t("intake.introReview")}</li>
          <li>{t("intake.introUrgentHelp")}</li>
        </ul>
      </Card>
      <div className="flex gap-2">
        <Button onClick={onBegin} loading={loading}>
          {t("intake.introStart")}
        </Button>
      </div>
    </div>
  );
}

function ReviewView(props: {
  review?: import("../../types").IntakeReview;
  session: import("../../types").AIIntakeSession;
  phase: Phase;
  error: string;
  editingField: string | null;
  setEditingField: (f: string | null) => void;
  editValue: string;
  setEditValue: (v: string) => void;
  onSaveCorrection: (field: string) => void;
  onMarkUnknown: (field: string) => void;
  onDecline: (field: string) => void;
  onContinueQuestions: () => void;
  onConfirm: () => void;
  onSubmit: () => void;
  confirmPending: boolean;
  submitPending: boolean;
  correctionPending: boolean;
  onBack: () => void;
}) {
  const { t, formatDateTime } = useI18n();
  const {
    review, session, phase, error,
    editingField, setEditingField, editValue, setEditValue,
    onSaveCorrection, onMarkUnknown, onDecline,
    onContinueQuestions, onConfirm, onSubmit,
    confirmPending, submitPending, correctionPending, onBack,
  } = props;

  const sections = review?.review?.sections ?? {};
  const missing = review?.missing_blocking_fields ?? session.missing_blocking_fields ?? [];
  const aiSummary = review?.review?.ai_generated_summary ?? null;
  const canConfirm = (review?.can_confirm ?? false) && missing.length === 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("intake.reviewTitle")}</h1>
      <p className="text-sm text-gray-500 mb-4">{t("intake.reviewIntro")}</p>

      {aiSummary && (
        <Alert variant="info" className="mb-4">
          <p className="font-semibold">{t("intake.reviewAiSummary")}</p>
          <p className="mt-1 text-sm">{aiSummary}</p>
          <p className="mt-1 text-xs font-semibold">{t("intake.notClinicallyVerified")}</p>
        </Alert>
      )}

      {error && (
        <div aria-live="polite" className="mb-4">
          <Alert variant="warning">{error}</Alert>
        </div>
      )}

      {missing.length > 0 && (
        <Alert variant="warning" className="mb-4">
          {t("intake.missingRequired")}: {missing.join(", ")}
        </Alert>
      )}

      <Card className="mb-4">
        <div className="divide-y divide-gray-100">
          {Object.entries(sections).length === 0 && (
            <p className="text-sm text-gray-500 p-4">{t("intake.reviewEmpty")}</p>
          )}
          {Object.entries(sections).map(([field, entry]) => {
            const label = t(`intake.fields.${field}`);
            const isEditing = editingField === field;
            const valueStr =
              entry.value === null || entry.value === undefined
                ? ""
                : Array.isArray(entry.value)
                ? entry.value.join(", ")
                : String(entry.value);
            return (
              <div key={field} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {valueStr || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t(`intake.status.${entry.status}`)}
                      {entry.source === "patient_correction" && ` · ${t("intake.patientCorrected")}`}
                      {entry.source === "intake_extraction" && ` · ${t("intake.extractedFromAnswer")}`}
                    </p>
                  </div>
                  {phase !== "confirmed" && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingField(isEditing ? null : field);
                          setEditValue(valueStr);
                        }}
                      >
                        {t("intake.correct")}
                      </Button>
                      {entry.status !== "unknown" && (
                        <Button variant="ghost" size="sm" onClick={() => onMarkUnknown(field)}>
                          {t("intake.markUnknown")}
                        </Button>
                      )}
                      {entry.status !== "declined" && (
                        <Button variant="ghost" size="sm" onClick={() => onDecline(field)}>
                          {t("intake.declineField")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {isEditing && phase !== "confirmed" && (
                  <div className="mt-3">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full"
                      aria-label={t("intake.correctValue")}
                    />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => onSaveCorrection(field)} loading={correctionPending}>
                        {t("intake.saveCorrections")}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingField(null)}>
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {session.submitted_at && (
        <p className="text-sm text-gray-500 mb-3">
          {t("intake.submittedAt", { date: formatDateTime(session.submitted_at) })}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {phase === "confirmed" ? (
          <Button onClick={onSubmit} loading={submitPending}>
            {t("intake.submitToDoctor")}
          </Button>
        ) : (
          <>
            <Button onClick={onContinueQuestions} variant="secondary">
              {t("intake.continueQuestions")}
            </Button>
            <Button onClick={onConfirm} loading={confirmPending} disabled={!canConfirm}>
              {t("intake.confirmInfo")}
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={onBack}>
          {t("common.back")}
        </Button>
      </div>
    </div>
  );
}
