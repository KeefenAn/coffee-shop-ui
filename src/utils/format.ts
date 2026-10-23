/** 分 → 展示用金额字符串。整数不带小数位：3200 → "32"，3250 → "32.5" */
export function yuan(fen: number): string {
  const v = fen / 100
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0$/, '')
}

/** 分 → 带两位小数：3200 → "32.00" */
export function yuanFixed(fen: number): string {
  return (fen / 100).toFixed(2)
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function todayStr(ts = Date.now()): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
