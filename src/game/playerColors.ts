const PLAYER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#7C5CFC',
  '#FF8A5C',
  '#34D399',
  '#F472B6',
  '#38BDF8',
  '#FB923C',
  '#A78BFA',
  '#FBBF24',
  '#2DD4BF',
  '#F87171',
  '#60A5FA',
  '#E879F9',
  '#6EE7B7',
]

export function getPlayerColor(playerId: string, index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}

export function getPlayerColorHex(playerId: string, index: number): string {
  return getPlayerColor(playerId, index).replace('#', '')
}
