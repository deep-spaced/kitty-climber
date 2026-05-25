const HIGH_SCORE_KEY = 'kittyClimber_highScore'

export function getHighScore() {
  try {
    const val = localStorage.getItem(HIGH_SCORE_KEY)
    return val !== null ? parseInt(val, 10) : 0
  } catch (_) {
    return 0
  }
}

export function saveHighScore(score) {
  try {
    if (score > getHighScore()) localStorage.setItem(HIGH_SCORE_KEY, String(score))
  } catch (_) {}
}
