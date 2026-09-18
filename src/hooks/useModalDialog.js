import { useEffect, useRef } from 'react'

/**
 * Native <dialog showModal()>. The element is the card; ::backdrop is the dim.
 * Escape comes through the dialog's cancel event. Light-dismiss via
 * closedby="any", with a click fallback when HTMLDialogElement.closedBy is
 * missing (Safari as of 2026).
 */
export function useModalDialog(onClose) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!el.open) {
      try { el.showModal() } catch { /* already open / incomplete impl */ }
    }

    const onClosed = () => onCloseRef.current?.()
    el.addEventListener('close', onClosed)

    const onCancel = (event) => {
      event.preventDefault()
      if (el.open) el.close()
    }
    el.addEventListener('cancel', onCancel)

    let onClick
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      onClick = (event) => {
        if (event.target !== el) return
        const rect = el.getBoundingClientRect()
        const inside =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        if (inside) return
        el.close()
      }
      el.addEventListener('click', onClick)
    }

    return () => {
      el.removeEventListener('close', onClosed)
      el.removeEventListener('cancel', onCancel)
      if (onClick) el.removeEventListener('click', onClick)
    }
  }, [])

  return ref
}
