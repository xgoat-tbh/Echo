const PLAYER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFD93D',
  '#6C5CE7',
  '#FF8A5C',
  '#A8E6CF',
  '#FFB7B2',
  '#95E1D3',
  '#F38181',
  '#AA96DA',
  '#FCBAD3',
  '#B5EAD7',
]

export function getPlayerColor(playerId: string, index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}

export function getPlayerColorHex(playerId: string, index: number): string {
  return getPlayerColor(playerId, index).replace('#', '')
}
