// Minimal Toaster - replace with full shadcn/ui Toaster
import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg shadow-lg p-4 text-sm text-white ${
            t.variant === "destructive" ? "bg-red-600" : "bg-gray-800"
          }`}
        >
          {t.title && <p className="font-semibold">{t.title}</p>}
          {t.description && <p className="mt-1 opacity-90">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}
