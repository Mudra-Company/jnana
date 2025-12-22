import { useToast } from "../../hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            rounded-lg px-4 py-3 shadow-lg border
            animate-in slide-in-from-right-full duration-300
            ${toast.variant === "destructive" 
              ? "bg-destructive text-destructive-foreground border-destructive" 
              : "bg-background text-foreground border-border"
            }
          `}
        >
          {toast.title && (
            <div className="font-semibold text-sm">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  )
}
