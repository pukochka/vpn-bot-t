export default function cycleRestrict(length: number, index: number): number {
  return index - Math.floor(index / length) * length;
}
