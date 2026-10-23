import { useEffect, useMemo, useState } from 'react'
import { ScrollView, Text, View } from '@tarojs/components'
import type { CartItem, CartSpec, MenuData, Product } from '@/data/types'
import type { SpecGroup } from '@/data/types'
import { buildCartKey } from '@/store'
import { yuan } from '@/utils/format'
import './index.scss'

interface Props {
  product: Product | null
  menu: MenuData
  onClose: () => void
  onConfirm: (item: CartItem) => void
}

function defaultSelections(product: Product, groups: SpecGroup[]): Record<string, string[]> {
  const sel: Record<string, string[]> = {}
  groups.forEach((g) => {
    sel[g.id] = g.required && !g.multiple && g.options.length > 0 ? [g.options[0].id] : []
  })
  return sel
}

export default function SpecPopup({ product, menu, onClose, onConfirm }: Props) {
  const groups = useMemo<SpecGroup[]>(() => {
    if (!product) return []
    return product.specGroupIds
      .map((id) => menu.specGroups.find((g) => g.id === id))
      .filter((g): g is SpecGroup => !!g)
  }, [product, menu.specGroups])

  const [sel, setSel] = useState<Record<string, string[]>>({})
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (product) {
      setSel(defaultSelections(product, groups))
      setQty(1)
    }
    // 只在切换商品时重置
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id])

  const pickedSpecs = useMemo<CartSpec[]>(() => {
    if (!product) return []
    const list: CartSpec[] = []
    groups.forEach((g) => {
      const chosen = sel[g.id] ?? []
      g.options.forEach((o) => {
        if (chosen.includes(o.id)) {
          list.push({
            groupId: g.id,
            groupName: g.name,
            optionId: o.id,
            optionName: o.name,
            priceDelta: o.priceDelta
          })
        }
      })
    })
    return list
  }, [sel, groups, product])

  const unitPrice = useMemo(() => {
    if (!product) return 0
    return product.price + pickedSpecs.reduce((s, x) => s + x.priceDelta, 0)
  }, [product, pickedSpecs])

  const missing = useMemo(
    () => groups.filter((g) => g.required && (sel[g.id] ?? []).length === 0).map((g) => g.name),
    [groups, sel]
  )

  if (!product) return null

  const toggle = (g: SpecGroup, optionId: string) => {
    setSel((prev) => {
      const cur = prev[g.id] ?? []
      if (g.multiple) {
        const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId]
        return { ...prev, [g.id]: next }
      }
      if (cur.includes(optionId)) {
        return { ...prev, [g.id]: g.required ? cur : [] }
      }
      return { ...prev, [g.id]: [optionId] }
    })
  }

  const handleConfirm = () => {
    if (missing.length > 0) return
    const item: CartItem = {
      key: buildCartKey(product.id, pickedSpecs),
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      image: product.image,
      unitPrice,
      qty,
      specs: pickedSpecs,
      note: ''
    }
    onConfirm(item)
  }

  return (
    <View className='sp-mask' onClick={onClose}>
      <View className='sp-sheet' onClick={(e) => e.stopPropagation()}>
        <View className='sp-head'>
          <View
            className='sp-thumb'
            style={product.image ? { backgroundImage: `url("${product.image}")` } : undefined}
          >
            {product.image ? null : product.emoji}
          </View>
          <View className='grow'>
            <View className='sp-name'>{product.name}</View>
            <View className='sp-desc ellipsis-2'>{product.desc}</View>
            <View className='sp-price'>
              <Text className='cny'>¥</Text>
              {yuan(unitPrice)}
            </View>
          </View>
          <View className='sp-close' onClick={onClose}>
            ✕
          </View>
        </View>

        <ScrollView scrollY className='sp-body'>
          {groups.map((g) => (
            <View className='sp-group' key={g.id}>
              <View className='sp-group-title'>
                <Text className='sp-group-name'>{g.name}</Text>
                <Text className='sp-group-tip'>
                  {g.required ? (g.multiple ? '必选 · 可多选' : '必选') : g.multiple ? '可选 · 多选' : '可选'}
                </Text>
              </View>
              <View className='sp-options'>
                {g.options.map((o) => {
                  const active = (sel[g.id] ?? []).includes(o.id)
                  return (
                    <View
                      key={o.id}
                      className={`sp-chip ${active ? 'active' : ''}`}
                      onClick={() => toggle(g, o.id)}
                    >
                      {o.name}
                      {o.priceDelta > 0 ? <Text className='sp-delta'>+{yuan(o.priceDelta)}</Text> : null}
                    </View>
                  )
                })}
              </View>
            </View>
          ))}

          <View className='sp-group'>
            <View className='sp-group-title'>
              <Text className='sp-group-name'>数量</Text>
            </View>
            <View className='stepper'>
              <View className='stepper-btn' onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </View>
              <Text className='stepper-num'>{qty}</Text>
              <View className='stepper-btn' onClick={() => setQty((q) => Math.min(99, q + 1))}>
                +
              </View>
            </View>
          </View>
        </ScrollView>

        <View className='sp-foot'>
          <View className='sp-total'>
            <Text className='faint'>合计 </Text>
            <Text className='sp-total-num'>¥{yuan(unitPrice * qty)}</Text>
          </View>
          <View
            className={`sp-submit ${missing.length > 0 ? 'disabled' : ''}`}
            onClick={handleConfirm}
          >
            {missing.length > 0 ? `请选择${missing[0]}` : '加入购物车'}
          </View>
        </View>
      </View>
    </View>
  )
}
