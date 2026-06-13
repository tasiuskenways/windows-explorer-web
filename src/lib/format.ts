export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} ${units[i]}`;
};
