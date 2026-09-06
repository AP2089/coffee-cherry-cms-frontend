export interface ToastItem {
  id: number
  message: string
}

const TOAST_DURATION = 3500

export function useToast() {
  const toasts = useState<ToastItem[]>('cms-toasts', () => [])
  const nextId = useState('cms-toast-next-id', () => 0)

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((item) => item.id !== id)
  }

  function show(message: string) {
    const id = ++nextId.value

    toasts.value = [...toasts.value, { id, message }]

    if (import.meta.client) {
      setTimeout(() => {
        dismiss(id)
      }, TOAST_DURATION)
    }
  }

  function success(message: string) {
    show(message)
  }

  return {
    toasts,
    success,
    show,
    dismiss,
  }
}
