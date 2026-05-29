import {
  PLAYER_STATES,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  CROUCH_HEIGHT,
  MOVE_SPEED,
  JUMP_FORCE,
  JUMP_CUT_VY,
  JUMP_BOOST_FORCE,
  JUMP_BOOST_MAX_TIME,
  MAX_HEALTH,
  ATTACK_DURATION,
  HURT_DURATION,
  PLAYER_KNOCKBACK_SPEED,
  PLAYER_KNOCKBACK_UP,
} from '../constants.js'
import { stepPhysics } from '../engine/physics.js'

export function createPlayer(startX, startY) {
  return {
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    facing: 1,          // 1 = right, -1 = left
    state: PLAYER_STATES.IDLE,
    health: MAX_HEALTH,
    stateTimer: 0,
    onGround: false,
    jumpConsumed: false,
    jumpHeld: false,
    jumpBoostTimer: 0,
  }
}

/**
 * Advance player state machine by one fixed timestep.
 * Returns a new player object (immutable update pattern).
 */
export function updatePlayer(player, input, tilemap, dt) {
  let { x, y, vx, vy, facing, state, health, stateTimer, onGround, jumpConsumed, jumpHeld = false, jumpBoostTimer = 0, width, height } = player

  stateTimer = Math.max(0, stateTimer - dt)

  const attacking = state === PLAYER_STATES.ATTACK_SCRATCH || state === PLAYER_STATES.ATTACK_BITE
  const hurting = state === PLAYER_STATES.HURT
  const locked = attacking || hurting

  // --- Attack triggers (only when not already locked) ---
  if (!locked) {
    if (input.scratch) {
      state = PLAYER_STATES.ATTACK_SCRATCH
      stateTimer = ATTACK_DURATION
      vx = 0
    } else if (input.bite) {
      state = PLAYER_STATES.ATTACK_BITE
      stateTimer = ATTACK_DURATION
      vx = 0
    }
  }

  const nowAttacking = state === PLAYER_STATES.ATTACK_SCRATCH || state === PLAYER_STATES.ATTACK_BITE

  // --- Movement (suppressed during attacks/hurt) ---
  if (!nowAttacking && !hurting) {
    if (input.crouch && onGround) {
      vx = 0
      // Anchor feet: shift y down so bottom stays at same world position
      y += height - CROUCH_HEIGHT
      height = CROUCH_HEIGHT
      state = PLAYER_STATES.CROUCH
    } else {
      height = PLAYER_HEIGHT

      if (input.left) {
        vx = -MOVE_SPEED
        facing = -1
      } else if (input.right) {
        vx = MOVE_SPEED
        facing = 1
      } else {
        vx = 0
      }

      // Jump
      if (input.jump && onGround && !jumpConsumed) {
        vy = JUMP_FORCE
        onGround = false
        jumpConsumed = true
        jumpHeld = true
        jumpBoostTimer = JUMP_BOOST_MAX_TIME
      }
    }
  }

  // Reset jump latch when key released
  if (!input.jump) jumpConsumed = false

  // Variable jump height: apply upward boost while jump is held and boost time remains
  if (jumpHeld && input.jump && vy < 0 && jumpBoostTimer > 0) {
    vy += JUMP_BOOST_FORCE * dt
    jumpBoostTimer = Math.max(0, jumpBoostTimer - dt)
  }

  // Variable jump height: releasing button early cuts upward velocity
  if (jumpHeld && !input.jump && vy < 0) {
    vy = Math.max(vy, JUMP_CUT_VY)
    jumpHeld = false
    jumpBoostTimer = 0
  }

  // --- Physics step ---
  const next = stepPhysics({ x, y, vx, vy, width, height }, tilemap, dt)
  x = next.x
  y = next.y
  vx = next.vx
  vy = next.vy
  onGround = next.onGround
  if (onGround) { jumpHeld = false; jumpBoostTimer = 0 }  // always clear when landed

  // --- Derive state from motion (when not locked) ---
  if (!nowAttacking && !hurting) {
    if (!onGround) {
      state = vy < 0 ? PLAYER_STATES.JUMP : PLAYER_STATES.FALL
    } else if (input.crouch) {
      state = PLAYER_STATES.CROUCH
    } else if (vx !== 0) {
      state = PLAYER_STATES.RUN
    } else {
      state = PLAYER_STATES.IDLE
    }
  }

  // Clear timed states when timer expires
  if (stateTimer === 0 && (nowAttacking || hurting)) {
    state = PLAYER_STATES.IDLE
  }

  return { ...player, x, y, vx, vy, facing, state, health, stateTimer, onGround, jumpConsumed, jumpHeld, jumpBoostTimer, width, height }
}

/**
 * Apply damage to the player. Returns updated player.
 */
export function hurtPlayer(player, knockbackDir = 0) {
  if (player.state === PLAYER_STATES.HURT) return player  // already in hurt state
  const health = player.health - 1
  return {
    ...player,
    health,
    state: health > 0 ? PLAYER_STATES.HURT : PLAYER_STATES.IDLE,
    stateTimer: health > 0 ? HURT_DURATION : 0,
    vx: knockbackDir * PLAYER_KNOCKBACK_SPEED,
    vy: -PLAYER_KNOCKBACK_UP,
  }
}

/**
 * Restore 1 HP, capped at MAX_HEALTH.
 */
export function healPlayer(player) {
  return { ...player, health: Math.min(player.health + 1, MAX_HEALTH) }
}

/**
 * Returns the attack hitbox for the current frame, or null if not attacking.
 */
export function getAttackHitbox(player) {
  const { state, x, y, facing, width, height } = player
  if (state !== PLAYER_STATES.ATTACK_SCRATCH && state !== PLAYER_STATES.ATTACK_BITE) return null

  const REACH = 36
  return {
    x: facing === 1 ? x + width : x - REACH,
    y: y + 4,
    width: REACH,
    height: height - 8,
  }
}
