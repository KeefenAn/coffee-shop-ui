import Taro from '@tarojs/taro'

export const IS_H5 = process.env.TARO_ENV === 'h5'

export interface PickImageOptions {
  /** 长边压缩到多少像素，默认 640 */
  maxSize?: number
  /** JPEG 质量 0-1，默认 0.7 */
  quality?: number
}

/** 压缩后的 dataURL 大致字节数（base64 约为原字符数） */
export function dataUrlBytes(dataUrl: string): number {
  return dataUrl.length
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// ------------------------------------------------------------------ H5

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

async function compressInBrowser(src: string, maxSize: number, quality: number): Promise<string> {
  const img = await loadImageEl(src)
  const w0 = img.naturalWidth || img.width
  const h0 = img.naturalHeight || img.height
  if (!w0 || !h0) throw new Error('图片尺寸异常')
  const scale = Math.min(1, maxSize / Math.max(w0, h0))
  const w = Math.max(1, Math.round(w0 * scale))
  const h = Math.max(1, Math.round(h0 * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前环境不支持图片处理')
  // 白底，避免透明 PNG 转 JPEG 后发黑
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
}

function pickFileInBrowser(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.display = 'none'
    document.body.appendChild(input)

    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input)
    }

    input.onchange = () => {
      const file = input.files && input.files[0]
      if (!file) {
        cleanup()
        resolve(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        cleanup()
        resolve(String(reader.result))
      }
      reader.onerror = () => {
        cleanup()
        resolve(null)
      }
      reader.readAsDataURL(file)
    }
    // 用户点了取消（部分浏览器支持）
    ;(input as any).oncancel = () => {
      cleanup()
      resolve(null)
    }
    input.click()
  })
}

// ------------------------------------------------------------------ 微信小程序

async function readFileAsDataUrl(path: string): Promise<string> {
  const fs = (Taro as any).getFileSystemManager()
  if (!fs) throw new Error('当前环境不支持读取文件')
  const base64: string = await new Promise((resolve, reject) => {
    fs.readFile({
      filePath: path,
      encoding: 'base64',
      success: (r: any) => resolve(r.data),
      fail: (e: any) => reject(e)
    })
  })
  return `data:image/jpeg;base64,${base64}`
}

async function pickAndCompressInMini(maxSize: number, quality: number): Promise<string | null> {
  const res = await Taro.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera']
  }).catch(() => null)
  const path = res?.tempFilePaths?.[0]
  if (!path) return null

  // 先尝试用系统压缩，再读成 base64
  let finalPath = path
  try {
    const compressed = await Taro.compressImage({
      src: path,
      quality: Math.round(quality * 100)
    } as any)
    if (compressed?.tempFilePath) finalPath = compressed.tempFilePath
  } catch (e) {
    // 压缩失败就用原图
  }
  const dataUrl = await readFileAsDataUrl(finalPath)
  // 小程序端不做画布缩放，直接给出结果（通常已在几百 KB 内）
  if (dataUrl.length > maxSize * 4000) {
    throw new Error('图片太大，换一张试试')
  }
  return dataUrl
}

// ------------------------------------------------------------------ 对外

/**
 * 让店主选一张图并压缩成可本地保存的 dataURL。
 * 用户取消返回 null；失败抛错（调用方负责提示）。
 */
export async function pickImage(options: PickImageOptions = {}): Promise<string | null> {
  const maxSize = options.maxSize ?? 640
  const quality = options.quality ?? 0.7

  if (IS_H5) {
    const raw = await pickFileInBrowser()
    if (!raw) return null
    return compressInBrowser(raw, maxSize, quality)
  }
  return pickAndCompressInMini(maxSize, quality)
}

/** 估算本地存储已用空间（只统计本项目自己的 key） */
export function localUsage(): number {
  try {
    const raw = Taro.getStorageSync('coffee-shop-state-v1')
    const str = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '')
    return str.length
  } catch (e) {
    return 0
  }
}
