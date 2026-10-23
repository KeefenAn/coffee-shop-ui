import { useState } from 'react'
import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { dataUrlBytes, formatBytes, pickImage } from '@/utils/image'
import './index.scss'

interface Props {
  label: string
  hint?: string
  value?: string
  onChange: (v: string) => void
  /** wide：16:9 横幅；square：方图 */
  variant?: 'wide' | 'square'
  /** 无图时显示的占位图案 */
  placeholder?: string
  maxSize?: number
  quality?: number
}

export default function ImageField({
  label,
  hint,
  value,
  onChange,
  variant = 'square',
  placeholder = '＋',
  maxSize = 640,
  quality = 0.7
}: Props) {
  const [busy, setBusy] = useState(false)

  const pick = async () => {
    if (busy) return
    setBusy(true)
    try {
      const data = await pickImage({ maxSize, quality })
      if (data) {
        const bytes = dataUrlBytes(data)
        if (bytes > 380 * 1024) {
          Taro.showToast({
            title: `图片偏大（${formatBytes(bytes)}），建议换一张`,
            icon: 'none',
            duration: 2400
          })
        }
        onChange(data)
      }
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '图片处理失败', icon: 'none' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <View className={`ifield ifield-${variant}`}>
      <View className='ifield-head'>
        <Text className='ifield-label'>{label}</Text>
        {hint ? <Text className='ifield-hint'>{hint}</Text> : null}
      </View>

      <View className='ifield-body'>
        <View
          className={`ifield-preview ${variant}`}
          style={value ? { backgroundImage: `url("${value}")` } : undefined}
        >
          {value ? null : <Text className='ifield-ph'>{placeholder}</Text>}
        </View>

        <View className='ifield-actions'>
          <View className={`ifield-btn primary ${busy ? 'busy' : ''}`} onClick={pick}>
            {busy ? '处理中…' : value ? '更换图片' : '上传图片'}
          </View>
          {value ? (
            <View className='ifield-btn ghost' onClick={() => onChange('')}>
              移除
            </View>
          ) : null}
          {value ? (
            <Text className='ifield-size'>约 {formatBytes(dataUrlBytes(value))}</Text>
          ) : (
            <Text className='ifield-size'>不传就用默认配色</Text>
          )}
        </View>
      </View>
    </View>
  )
}
