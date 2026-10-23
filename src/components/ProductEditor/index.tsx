import { useState } from 'react'
import { Input, ScrollView, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import ImageField from '@/components/ImageField'
import type { Category, Product, SpecGroup } from '@/data/types'
import { yuan } from '@/utils/format'
import './index.scss'

export interface ProductForm {
  name: string
  desc: string
  /** 单位：分 */
  price: number
  tags: string[]
  image?: string
  emoji: string
  categoryId: string
  specGroupIds: string[]
}

interface Props {
  /** null 表示新增 */
  product: Product | null
  categories: Category[]
  specGroups: SpecGroup[]
  onClose: () => void
  onSave: (data: ProductForm) => void
  onDelete?: () => void
}

const EMOJI_CHOICES = [
  '☕', '🥛', '🍵', '🍫', '🧊', '🍰',
  '🥐', '🧁', '🍪', '🍊', '🌼', '🍯',
  '🥤', '🍋', '🫖', '🌀', '🥜', '🍓'
]

export default function ProductEditor({
  product,
  categories,
  specGroups,
  onClose,
  onSave,
  onDelete
}: Props) {
  const isNew = !product

  const [name, setName] = useState(product?.name ?? '')
  const [desc, setDesc] = useState(product?.desc ?? '')
  const [priceText, setPriceText] = useState(product ? String(product.price / 100) : '')
  const [tagsText, setTagsText] = useState((product?.tags ?? []).join(','))
  const [image, setImage] = useState(product?.image ?? '')
  const [emoji, setEmoji] = useState(product?.emoji ?? '☕')
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? ''
  )
  const [specIds, setSpecIds] = useState<string[]>(product?.specGroupIds ?? [])

  const priceFen = Math.round(Number(priceText) * 100 || 0)

  const submit = () => {
    if (!name.trim()) {
      Taro.showToast({ title: '给它起个名字', icon: 'none' })
      return
    }
    if (!Number.isFinite(priceFen) || priceFen < 0) {
      Taro.showToast({ title: '价格填错了', icon: 'none' })
      return
    }
    if (!categoryId) {
      Taro.showToast({ title: '先选一个分类', icon: 'none' })
      return
    }
    onSave({
      name: name.trim(),
      desc: desc.trim(),
      price: priceFen,
      tags: tagsText
        .split(/[,，、\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
      image: image || undefined,
      emoji,
      categoryId,
      specGroupIds: specIds
    })
  }

  const confirmDelete = () => {
    if (!product || !onDelete) return
    Taro.showModal({
      title: '删除商品',
      content: `确定删除「${product.name}」吗？删掉后菜单里就没了，历史订单不受影响。`,
      confirmText: '删除',
      confirmColor: '#c0563f',
      success: (r) => {
        if (r.confirm) onDelete()
      }
    })
  }

  const toggleSpec = (id: string) => {
    setSpecIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <View className='pe-mask' onClick={onClose}>
      <View className='pe-sheet' onClick={(e) => e.stopPropagation()}>
        <View className='pe-head'>
          <Text className='pe-title'>{isNew ? '新增商品' : '编辑商品'}</Text>
          <View className='pe-close' onClick={onClose}>
            ✕
          </View>
        </View>

        <ScrollView scrollY className='pe-body'>
          <ImageField
            label='商品图片'
            hint='方图最好，不传就用下面的图案'
            variant='square'
            placeholder={emoji}
            value={image}
            maxSize={480}
            quality={0.68}
            onChange={setImage}
          />

          <View className='pe-row'>
            <Text className='pe-label'>名称</Text>
            <Input
              className='pe-input'
              placeholder='比如：青柠气泡美式'
              value={name}
              maxlength={16}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>

          <View className='pe-row'>
            <Text className='pe-label'>价格（元）</Text>
            <Input
              className='pe-input'
              type='digit'
              placeholder='0.00'
              value={priceText}
              onInput={(e) => setPriceText(e.detail.value)}
            />
          </View>

          <View className='pe-block'>
            <Text className='pe-label'>分类</Text>
            <View className='pe-chips'>
              {categories.map((c) => (
                <View
                  key={c.id}
                  className={`pe-chip ${categoryId === c.id ? 'active' : ''}`}
                  onClick={() => setCategoryId(c.id)}
                >
                  {c.emoji} {c.name}
                </View>
              ))}
            </View>
          </View>

          <View className='pe-row'>
            <Text className='pe-label'>标签</Text>
            <Input
              className='pe-input'
              placeholder='逗号分隔，如：新品,热销'
              value={tagsText}
              onInput={(e) => setTagsText(e.detail.value)}
            />
          </View>

          <View className='pe-block'>
            <Text className='pe-label'>占位图案</Text>
            <View className='pe-chips'>
              {EMOJI_CHOICES.map((e) => (
                <View
                  key={e}
                  className={`pe-emoji ${emoji === e ? 'active' : ''}`}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </View>
              ))}
            </View>
          </View>

          <View className='pe-block'>
            <View className='pe-label-row'>
              <Text className='pe-label'>可选规格</Text>
              <Text className='pe-tip'>{specIds.length > 0 ? '顾客下单时要选' : '顾客可直接加购'}</Text>
            </View>
            <View className='pe-chips'>
              {specGroups.map((g) => (
                <View
                  key={g.id}
                  className={`pe-chip ${specIds.includes(g.id) ? 'active' : ''}`}
                  onClick={() => toggleSpec(g.id)}
                >
                  {g.name}
                </View>
              ))}
            </View>
          </View>

          <View className='pe-block'>
            <Text className='pe-label'>描述</Text>
            <Textarea
              className='pe-textarea'
              placeholder='一句话说明这杯是什么，比如：手作桂花糖浆 · 双份浓缩 · 鲜牛奶'
              value={desc}
              maxlength={40}
              onInput={(e) => setDesc(e.detail.value)}
            />
          </View>
        </ScrollView>

        <View className='pe-foot'>
          {!isNew && onDelete ? (
            <View className='pe-btn danger' onClick={confirmDelete}>
              删除
            </View>
          ) : null}
          <View className='pe-btn ghost' onClick={onClose}>
            取消
          </View>
          <View className='pe-btn primary' onClick={submit}>
            {isNew ? '添加' : '保存'}
            {priceFen > 0 ? ` · ¥${yuan(priceFen)}` : ''}
          </View>
        </View>
      </View>
    </View>
  )
}
