import { useEffect, useRef } from 'react'
import { createInputHandler } from '../engine/inputHandler.js'

/**
 * Attaches keyboard listeners on mount, detaches on unmount.
 * Returns a stable ref whose `.current` holds the latest input state.
 */
export function useInput() {
  const handlerRef = useRef(null)

  if (handlerRef.current === null) {
    handlerRef.current = createInputHandler()
  }

  useEffect(() => {
    handlerRef.current.attach()
    return () => handlerRef.current.detach()
  }, [])

  return handlerRef.current.getState
}
