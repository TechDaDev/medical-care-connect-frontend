import { AlertTriangle, Check, Circle, Clock } from "lucide-react";
import { useI18n } from "../../i18n";
import { ConsultationTimelineItem } from "../../types";

export function ConsultationTimeline({ items }: { items: ConsultationTimelineItem[] }) {
  const { t } = useI18n();
  return (
    <ol className="space-y-4" aria-label={t("phaseC.timeline")}>
      {items.map((item) => {
        const Icon = item.status === "completed" ? Check
          : item.status === "terminal" ? AlertTriangle
          : item.status === "current" ? Clock : Circle;
        return (
          <li key={`${item.key}-${item.status}`} className="flex gap-3">
            <span className={`mt-0.5 rounded-full p-2 ${
              item.status === "terminal" ? "bg-red-100 text-red-700"
                : item.status === "current" ? "bg-blue-100 text-blue-700"
                : item.status === "completed" ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
            <div>
              <p className="font-medium">{t(item.title_key)}</p>
              <p className="text-sm text-slate-500">{t(item.description_key)}</p>
              {item.occurred_at && <time className="text-xs text-slate-400" dateTime={item.occurred_at}>
                {new Date(item.occurred_at).toLocaleString()}
              </time>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
