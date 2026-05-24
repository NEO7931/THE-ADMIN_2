import { useRef, useCallback, useEffect } from "react";
import { attemptCrowbar, crowbarMeta } from "./api";

export function useSecretSequence(onCrowbar: () => void) {
  const buffer = useRef<string[]>([]);
  const len = useRef(8);
  const timer = useRef<any>(null);

  useEffect(() => { crowbarMeta().then(m => { if (m?.length) len.current = m.length; }); }, []);

  const press = useCallback(async (bookTitle: string) => {
    buffer.current.push(bookTitle.toLowerCase().trim());
    if (buffer.current.length > len.current) buffer.current.shift();

    // reset the buffer if they go idle for 20s (keeps it from lingering)
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { buffer.current = []; }, 20_000);

    if (buffer.current.length === len.current) {
      const res = await attemptCrowbar(buffer.current);
      if (res?.awarded && !res?.alreadyHad) { buffer.current = []; onCrowbar(); }
    }
  }, [onCrowbar]);

  return press;
}