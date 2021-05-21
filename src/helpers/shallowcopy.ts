export function shallowCopyArrayObjects<T>(array: T[]): T[] {
  return array.map((element) => ({ ...element }));
}
