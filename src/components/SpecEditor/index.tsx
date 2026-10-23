import { useState } from 'react'
import { Input, ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import {
  deleteSpecGroup,
  replaceSpecGroups,
  specGroupUsage,
  useAppState
} from '@/store'
import type { SpecGroup, SpecOption } from '@/data/types'
import './index.scss'

interface Props {
  onClose: () => void
}

export default function SpecEditor({ onClose }: Props) {
  const s = useAppState()
  const groups = s.menu.specGroups
  // 价格输入框保留原始文本，避免输入 "3." 被格式化掉
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({})

  const patchGroup = (id: string, patch: Partial<SpecGroup>) => {
    replaceSpecGroups(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }

  const patchOption = (gid: string, oid: string, patch: Partial<SpecOption>) => {
    replaceSpecGroups(
      groups.map((g) =>
        g.id === gid
          ? { ...g, options: g.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)) }
          : g
      )
    )
  }

  const addOption = (gid: string) => {
    const n = Date.now()
    replaceSpecGroups(
      groups.map((g) =>
        g.id === gid
          ? {
              ...g,
              options: [
                ...g.options,
                { id: `o_${n}_${g.options.length}`, name: '新选项', priceDelta: 0 }
              ]
            }
          : g
      )
    )
  }

  const removeOption = (gid: string, oid: string) => {
    replaceSpecGroups(
      groups.map((g) =>
        g.id === gid ? { ...g, options: g.options.filter((o) => o.id !== oid) } : g
      )
    )
  }

  const addGroup = () => {
    const n = Date.now()
    const group: SpecGroup = {
      id: `g_${n}`,
      name: '新规格',
      required: false,
      multiple: false,
      options: [{ id: `o_${n}_0`, name: '选项一', priceDelta: 0 }]
    }
    replaceSpecGroups([...groups, group])
  }

  const removeGroup = (g: SpecGroup) => {
    const used = specGroupUsage(g.id)
    Taro.showModal({
      title: '删除规格',
      content:
        used > 0
          ? `有 ${used} 个商品在用「${g.name}」。删除后这些商品将不再显示这组规格，确定吗？`
          : `确定删除「${g.name}」吗？`,
      confirmText: '删除',
      confirmColor: '#c0563f',
      success: (r) => {
        if (r.confirm) deleteSpecGroup(g.id)
      }
    })
  }

  const priceValue = (o: SpecOption) => {
    const d = priceDraft[o.id]
    if (d !== undefined) return d
    return o.priceDelta === 0 ? '0' : String(o.priceDelta / 100)
  }

  const onPriceInput = (gid: string, o: SpecOption, v: string) => {
    setPriceDraft((prev) => ({ ...prev, [o.id]: v }))
    const n = Number(v)
    patchOption(gid, o.id, { priceDelta: Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0 })
  }

  const onPriceBlur = (o: SpecOption) => {
    setPriceDraft((prev) => {
      const next = { ...prev }
      delete next[o.id]
      return next
    })
  }

  return (
    <View className='se-mask' onClick={onClose}>
      <View className='se-sheet' onClick={(e) => e.stopPropagation()}>
        <View className='se-head'>
          <View className='grow'>
            <View className='se-title'>规格管理</View>
            <View className='se-sub'>顾客下单时要选的选项，比如杯型、温度、加料</View>
          </View>
          <View className='se-close' onClick={onClose}>
            ✕
          </View>
        </View>

        <ScrollView scrollY className='se-body'>
          {groups.map((g) => (
            <View className='se-card' key={g.id}>
              <View className='se-card-head'>
                <Input
                  className='se-name'
                  value={g.name}
                  maxlength={8}
                  onInput={(e) => patchGroup(g.id, { name: e.detail.value })}
                />
                <Text className='se-usage'>{specGroupUsage(g.id)} 个商品在用</Text>
                <View className='se-del' onClick={() => removeGroup(g)}>
                  删
                </View>
              </View>

              <View className='se-flags'>
                <View
                  className={`se-flag ${g.required ? 'on' : ''}`}
                  onClick={() => patchGroup(g.id, { required: !g.required })}
                >
                  {g.required ? '必选' : '可选'}
                </View>
                <View
                  className={`se-flag ${g.multiple ? 'on' : ''}`}
                  onClick={() => patchGroup(g.id, { multiple: !g.multiple })}
                >
                  {g.multiple ? '可多选' : '单选'}
                </View>
              </View>

              <View className='se-options'>
                {g.options.map((o) => (
                  <View className='se-option' key={o.id}>
                    <Input
                      className='se-opt-name'
                      value={o.name}
                      maxlength={8}
                      onInput={(e) => patchOption(g.id, o.id, { name: e.detail.value })}
                    />
                    <View className='se-opt-price'>
                      <Text className='se-opt-plus'>+</Text>
                      <Input
                        className='se-opt-input'
                        type='digit'
                        value={priceValue(o)}
                        onInput={(e) => onPriceInput(g.id, o, e.detail.value)}
                        onBlur={() => onPriceBlur(o)}
                      />
                      <Text className='se-opt-unit'>元</Text>
                    </View>
                    <View className='se-opt-del' onClick={() => removeOption(g.id, o.id)}>
                      ×
                    </View>
                  </View>
                ))}
                <View className='se-add-opt' onClick={() => addOption(g.id)}>
                  ＋ 加选项
                </View>
              </View>
            </View>
          ))}

          <View className='se-add-group' onClick={addGroup}>
            ＋ 新增规格组
          </View>

          <View className='se-hint'>
            改这里的名字和加价，顾客端立刻生效。
            删除整个规格组时，用到它的商品会自动去掉这组规格。
          </View>
          <View className='se-bottom' />
        </ScrollView>
      </View>
    </View>
  )
}
