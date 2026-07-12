import { ErrorState } from "./ErrorState";
import { getErrorMessage } from "../../utils/errors";

interface Props {
  error: unknown;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: Props) {
  return <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />;
}
