import { useEffect, useRef } from 'react'
import { createGameLoop } from '../engine/gameLoop.js'

/**
 * Starts a game loop tied to the component lifecycle.
 * `update` and `render` callbacks are called from refs so they always
 * see the latest closure values without restarting the loop.
 */
export function useGameLoop({ update, render }) {
  const updateRef = useRef(update)
  const renderRef = useRef(render)

  useEffect(() => { updateRef.current = update })
  useEffect(() => { renderRef.current = render })

  useEffect(() => {
    const loop = createGameLoop({
      update: (dt) => updateRef.current(dt),
      render: () => renderRef.current(),
    })
    loop.start()
    return () => loop.stop()
  }, [])
}
