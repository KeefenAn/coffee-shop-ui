import { useMemo, useState } from 'react'
import { Input, ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import {
  createCategory,
  deleteCategory,
  moveCategory,
  updateCategory,
  useAppState
} from '@/store'
import './index.scss'

interface Props {
  onClose: () => void
}

const EMOJI_CHOICES = [
  '🍽', '✨', '☕', '🥛', '🍵', '🧊',
  '🍰', '🥐', '🧁', '🍪', '🍊', '🍋',
  '🥤', '🍯', '🫖', '🌼'
]

export default function CategoryEditor({ onClose }: Props) {
  const s = useAppState()
  const [emojiFor, setEmojiFor] = useState<string | null>(null)

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    s.menu.products.forEach((p) => {
      map[p.categoryId] = (map[p.categoryId] ?? 0) + 1
    })
    return map
  }, [s.menu.products])

  const remove = (id: string, name: string, count: number) => {
    Taro.showModal({
      title: '删除分类',
      content:
        count > 0
          ? `「${name}」下还有 ${count} 个商品，先把它们改到别的分类才能删。`
          : `确定删除分类「${name}」吗？`,
      confirmText: count > 0 ? '知道了' : '删除',
      confirmColor: '#c0563f',
      showCancel: count === 0,
      success: (r) => {
        if (count > 0 || !r.confirm) return
        const res = deleteCategory(id)
        if (!res.ok) Taro.showToast({ title: res.reason ?? '删不掉', icon: 'none' })
      }
    })
  }

  return (
    <View className='ce-mask' onClick={onClose}>
      <View className='ce-sheet' onClick={(e) => e.stopPropagation()}>
        <View className='ce-head'>
          <Text className='ce-title'>分类管理</Text>
          <View className='ce-close' onClick={onClose}>
            ✕
          </View>
        </View>

        <ScrollView scrollY className='ce-body'>
          {s.menu.categories.map((c, i) => (
            <View className='ce-item' key={c.id}>
              <View className='ce-main'>
                <View
                  className='ce-emoji'
                  onClick={() => setEmojiFor(emojiFor === c.id ? null : c.id)}
                >
                  {c.emoji}
                </View>
                <Input
                  className='ce-name'
                  value={c.name}
                  maxlength={8}
                  onInput={(e) => updateCategory(c.id, { name: e.detail.value })}
                />
                <View className='ce-order'>
                  <View
                    className={`ce-arrow ${i === 0 ? 'disabled' : ''}`}
                    onClick={() => {
                      if (i > 0) moveCategory(c.id, -1)
                    }}
                  >
                    ↑
                  </View>
                  <View
                    className={`ce-arrow ${
                      i === s.menu.categories.length - 1 ? 'disabled' : ''
                    }`}
                    onClick={() => {
                      if (i < s.menu.categories.length - 1) moveCategory(c.id, 1)
                    }}
                  >
                    ↓
                  </View>
                </View>
                <Text className='ce-count'>{counts[c.id] ?? 0} 个</Text>
                <View
                  className='ce-del'
                  onClick={() => remove(c.id, c.name, counts[c.id] ?? 0)}
                >
                  删
                </View>
              </View>

              {emojiFor === c.id ? (
                <View className='ce-emoji-grid'>
                  {EMOJI_CHOICES.map((e) => (
                    <View
                      key={e}
                      className='ce-emoji-cell'
                      onClick={() => {
                        updateCategory(c.id, { emoji: e })
                        setEmojiFor(null)
                      }}
                    >
                      {e}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}

          <View
            className='ce-add'
            onClick={() => {
              const c = createCategory()
              setEmojiFor(c.id)
            }}
          >
            ＋ 新增分类
          </View>

          <View className='ce-hint'>
            点左边的图标可以换分类图案；改名字直接在上面输入框里改，立刻生效。
          </View>
          <View className='ce-bottom' />
        </ScrollView>
      </View>
    </View>
  )
}
