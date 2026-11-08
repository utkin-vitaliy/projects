export function moveRecipeLine<T>(lines: T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset;
  if (index < 0 || index >= lines.length || target < 0 || target >= lines.length) return lines;
  const next = [...lines];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
