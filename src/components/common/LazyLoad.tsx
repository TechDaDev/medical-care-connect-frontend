import { Suspense } from "react";
import { Spinner } from "./Spinner";

export function LazyLoad({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spinner />}>{children}</Suspense>;
}
