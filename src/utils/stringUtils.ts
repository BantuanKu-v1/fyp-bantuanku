export function humanize(value: string): string {
  return value
      .split("_")
      .map(
          (word) =>
              word.charAt(0).toUpperCase() +
              word.slice(1)
      )
      .join(" ");
}

export function hasValue(
    value: string | null | undefined
): boolean {
  return !!value?.trim();
}
