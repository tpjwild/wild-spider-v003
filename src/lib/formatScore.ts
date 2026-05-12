/** Display score rounded to one decimal place (product spec). */
export function formatScore(total: number): string {
  return (Math.round(total * 10) / 10).toFixed(1);
}
