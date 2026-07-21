const PLAYER_COLORS = [
  '#e05a5a', // Muted Red
  '#3fb0a8', // Muted Teal
  '#e6c135', // Muted Amber
  '#6347d9', // Muted Indigo/Violet
  '#e37244', // Muted Orange
  '#2cb580', // Muted Emerald
  '#db589b', // Muted Pink
  '#2ba6de', // Muted Sky Blue
  '#e07a2b', // Muted Bronze
  '#9275e6', // Muted Lavender
  '#e3aa1b', // Muted Gold
  '#21bca8', // Muted Mint
  '#e05353', // Muted Coral
  '#4c8fe3', // Muted Royal Blue
  '#cf5ee0', // Muted Magenta
  '#5cbda2', // Muted Sage Green
]

export function getPlayerColor(playerId: string, index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}

export function getPlayerColorHex(playerId: string, index: number): string {
  return getPlayerColor(playerId, index).replace('#', '')
}
