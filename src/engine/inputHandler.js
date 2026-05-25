import { KEYS } from '../constants.js'

export function createInputHandler() {
  const held = new Set()

  function onKeyDown(e) {
    held.add(e.key)
  }

  function onKeyUp(e) {
    held.delete(e.key)
  }

  function attach() {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  }

  function detach() {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    held.clear()
  }

  function getState() {
    return {
      left: held.has(KEYS.LEFT),
      right: held.has(KEYS.RIGHT),
      jump: held.has(KEYS.JUMP),
      scratch: held.has(KEYS.SCRATCH),
      bite: held.has(KEYS.BITE),
      crouch: held.has(KEYS.CROUCH),
      map: held.has(KEYS.MAP),
    }
  }

  return { attach, detach, getState }
}
