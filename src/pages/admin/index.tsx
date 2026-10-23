import { useMemo, useState } from 'react'
import { Input, ScrollView, Switch, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import CategoryEditor from '@/components/CategoryEditor'
import ImageField from '@/components/ImageField'
import ProductEditor from '@/components/ProductEditor'
import type { ProductForm } from '@/components/ProductEditor'
import SpecEditor from '@/components/SpecEditor'
import { ORDER_STATUS_TEXT } from '@/data/types'
import type { Order, Product } from '@/data/types'
import {
  createProduct,
  deleteProduct,
  moveProduct,
  resetAll,
  resetMenu,
  setAdminUnlocked,
  setOrderPaid,
  setOrderStatus,
  toggleSoldOut,
  updateProduct,
  updateShop,
  useAppState
} from '@/store'
import { formatTime, todayStr, yuan } from '@/utils/format'
import { formatBytes, localUsage } from '@/utils/image'
import './index.scss'

type Tab = 'orders' | 'menu' | 'shop'
type OrderFilter = 'todo' | 'doing' | 'closed'

const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: 'todo', label: '待接单' },
  { key: 'doing', label: '进行中' },
  { key: 'closed', label: '已完成' }
]

export default function AdminPage() {
  const s = useAppState()
  const [pin, setPin] = useState('')
  const [tab, setTab] = useState<Tab>('orders')
  const [filter, setFilter] = useState<OrderFilter>('todo')
  const [keyword, setKeyword] = useState('')
  const [editor, setEditor] = useState<{ product: Product | null } | null>(null)
  const [catOpen, setCatOpen] = useState(false)
  const [specOpen, setSpecOpen] = useState(false)
  const [sortMode, setSortMode] = useState(false)

  const today = todayStr()
  const todayOrders = useMemo(
    () => s.orders.filter((o) => todayStr(o.createdAt) === today && o.status !== 'cancelled'),
    [s.orders, today]
  )
  const revenue = todayOrders.reduce((a, o) => a + o.total, 0)

  const orderList = useMemo(() => {
    const map: Record<OrderFilter, Order['status'][]> = {
      todo: ['pending'],
      doing: ['making', 'ready'],
      closed: ['done', 'cancelled']
    }
    return s.orders.filter((o) => map[filter].includes(o.status))
  }, [s.orders, filter])

  const productList = useMemo(() => {
    const k = keyword.trim()
    if (!k) return s.menu.products
    return s.menu.products.filter((p) => p.name.includes(k) || p.desc.includes(k))
  }, [s.menu.products, keyword])

  // ------------------------------------------------------------ 未解锁
  if (!s.adminUnlocked) {
    const submit = () => {
      if (pin === s.shop.adminPin) {
        setAdminUnlocked(true)
        Taro.showToast({ title: '欢迎回来', icon: 'none' })
      } else {
        Taro.showToast({ title: '密码不对', icon: 'none' })
      }
    }
    return (
      <View className='apage lock'>
        <View className='lock-box'>
          <View className='lock-emoji'>🔐</View>
          <View className='lock-title'>店主后台</View>
          <View className='lock-sub'>输入密码进入，默认 8888，进去后可改</View>
          <Input
            className='lock-input'
            password
            type='number'
            value={pin}
            placeholder='请输入密码'
            onInput={(e) => setPin(e.detail.value)}
          />
          <View className='lock-btn' onClick={submit}>
            进入后台
          </View>
          <View
            className='lock-back'
            onClick={() => Taro.redirectTo({ url: '/pages/menu/index' })}
          >
            回到点单页
          </View>
        </View>
      </View>
    )
  }

  const openEdit = (p: Product) => {
    setEditor({ product: p })
  }

  const openNew = () => {
    setEditor({ product: null })
  }

  const productEditorSave = (data: ProductForm) => {
    if (editor?.product) {
      updateProduct(editor.product.id, data)
      Taro.showToast({ title: '已保存', icon: 'none' })
    } else {
      createProduct({ ...data, soldOut: false, onSale: true })
      Taro.showToast({ title: '已添加，顾客端立即可见', icon: 'none' })
    }
    setEditor(null)
  }

  const productEditorDelete = () => {
    if (!editor?.product) return
    deleteProduct(editor.product.id)
    setEditor(null)
    Taro.showToast({ title: '已删除', icon: 'none' })
  }

  const nextStatus = (o: Order): { label: string; status: Order['status'] } | null => {
    if (o.status === 'pending') return { label: '接单', status: 'making' }
    if (o.status === 'making') return { label: '做好了', status: 'ready' }
    if (o.status === 'ready') return { label: '已完成', status: 'done' }
    return null
  }

  return (
    <View className='apage'>
      <View className='admin-head'>
        <View className='grow'>
          <View className='admin-title'>店主后台</View>
          <View className='admin-sub'>
            今日 {todayOrders.length} 单 · ¥{yuan(revenue)}
          </View>
        </View>
        <View
          className={`open-switch ${s.shop.isOpen ? 'on' : ''}`}
          onClick={() => {
            updateShop({ isOpen: !s.shop.isOpen })
            Taro.showToast({
              title: s.shop.isOpen ? '已设为打烊' : '已开始营业',
              icon: 'none'
            })
          }}
        >
          {s.shop.isOpen ? '营业中' : '打烊中'}
        </View>
      </View>

      <View className='tabs'>
        {(['orders', 'menu', 'shop'] as Tab[]).map((t) => (
          <View
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'orders' ? '订单' : t === 'menu' ? '菜单' : '店铺'}
          </View>
        ))}
      </View>

      {tab === 'orders' ? (
        <>
          <View className='chips'>
            {FILTERS.map((f) => {
              const n =
                f.key === 'todo'
                  ? s.orders.filter((o) => o.status === 'pending').length
                  : f.key === 'doing'
                    ? s.orders.filter((o) => o.status === 'making' || o.status === 'ready').length
                    : 0
              return (
                <View
                  key={f.key}
                  className={`chip ${filter === f.key ? 'active' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  {n > 0 ? <Text className='chip-badge'>{n}</Text> : null}
                </View>
              )
            })}
          </View>

          <ScrollView scrollY className='alist'>
            {orderList.length === 0 ? (
              <View className='alist-empty'>这里还没有单</View>
            ) : (
              orderList.map((o) => {
                const nx = nextStatus(o)
                return (
                  <View className='ocard' key={o.id}>
                    <View className='ocard-top'>
                      <Text className='ono'>{o.no}</Text>
                      <Text className='otime'>{formatTime(o.createdAt)}</Text>
                      <Text className='ostatus'>{ORDER_STATUS_TEXT[o.status]}</Text>
                    </View>
                    {o.items.map((it) => (
                      <View className='oline' key={it.key}>
                        <Text className='oname'>
                          {it.name}
                          <Text className='oqty'> ×{it.qty}</Text>
                        </Text>
                        {it.specs.length > 0 ? (
                          <Text className='ospec'>{it.specs.map((x) => x.optionName).join('/')}</Text>
                        ) : null}
                      </View>
                    ))}
                    {o.remark ? <View className='oremark'>备注：{o.remark}</View> : null}
                    {o.customerName ? (
                      <View className='oremark'>称呼：{o.customerName}</View>
                    ) : null}
                    <View className='ocard-foot'>
                      <View className='ocard-meta'>
                        <Text className='ototal'>¥{yuan(o.total)}</Text>
                        <Text className={`opay ${o.payStatus === 'paid' ? 'paid' : ''}`}>
                          {o.payStatus === 'paid' ? '已付款' : '未付款'}
                        </Text>
                      </View>
                      <View className='ocard-actions'>
                        {o.status === 'pending' || o.status === 'making' ? (
                          <View
                            className='btn ghost'
                            onClick={() => {
                              setOrderStatus(o.id, 'cancelled')
                              Taro.showToast({ title: '已取消', icon: 'none' })
                            }}
                          >
                            取消
                          </View>
                        ) : null}
                        {o.payStatus === 'unpaid' ? (
                          <View className='btn ghost' onClick={() => setOrderPaid(o.id)}>
                            收了钱
                          </View>
                        ) : null}
                        {nx ? (
                          <View className='btn primary' onClick={() => setOrderStatus(o.id, nx.status)}>
                            {nx.label}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                )
              })
            )}
            <View className='abottom-space' />
          </ScrollView>
        </>
      ) : null}

      {tab === 'menu' ? (
        <>
          <View className='menu-tools'>
            <Input
              className='search'
              placeholder='搜商品名'
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
            />
            <View className='tool-btn primary' onClick={openNew}>
              ＋ 新品
            </View>
          </View>

          <View className='menu-subtools'>
            <View className='sub-btn' onClick={() => setCatOpen(true)}>
              分类管理
            </View>
            <View className='sub-btn' onClick={() => setSpecOpen(true)}>
              规格管理
            </View>
            <View
              className={`sub-btn ${sortMode ? 'active' : ''}`}
              onClick={() => {
                setSortMode(!sortMode)
                setKeyword('')
              }}
            >
              {sortMode ? '完成排序' : '调整顺序'}
            </View>
          </View>

          {sortMode ? (
            <View className='sort-hint'>用 ↑ ↓ 调整同一分类里的上下顺序</View>
          ) : null}

          <ScrollView scrollY className='alist'>
            {s.menu.categories.map((c) => {
              const items = productList
                .filter((p) => p.categoryId === c.id)
                .sort((a, b) => a.sort - b.sort)
              if (items.length === 0) {
                return keyword.trim() ? null : (
                  <View key={c.id} className='mgroup'>
                    <View className='mgroup-title'>
                      {c.emoji} {c.name}
                    </View>
                    <View className='mgroup-empty' onClick={openNew}>
                      这个分类还是空的，点这里加一个
                    </View>
                  </View>
                )
              }
              return (
                <View key={c.id} className='mgroup'>
                  <View className='mgroup-title'>
                    {c.emoji} {c.name}
                  </View>
                  {items.map((p, idx) =>
                    sortMode ? (
                      <View className='mrow sort-row' key={p.id}>
                        <View className='sort-index'>{idx + 1}</View>
                        <View
                          className='memoj'
                          style={
                            p.image ? { backgroundImage: `url("${p.image}")` } : undefined
                          }
                        >
                          {p.image ? null : p.emoji}
                        </View>
                        <View className='grow'>
                          <View className='mname'>{p.name}</View>
                          <View className='mprice'>¥{yuan(p.price)}</View>
                        </View>
                        <View className='sort-arrows'>
                          <View
                            className={`sort-arrow ${idx === 0 ? 'disabled' : ''}`}
                            onClick={() => {
                              if (idx > 0) moveProduct(p.id, -1)
                            }}
                          >
                            ↑
                          </View>
                          <View
                            className={`sort-arrow ${
                              idx === items.length - 1 ? 'disabled' : ''
                            }`}
                            onClick={() => {
                              if (idx < items.length - 1) moveProduct(p.id, 1)
                            }}
                          >
                            ↓
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View className='mrow' key={p.id}>
                        <View className='m-top'>
                          <View
                            className='memoj'
                            style={
                              p.image ? { backgroundImage: `url("${p.image}")` } : undefined
                            }
                          >
                            {p.image ? null : p.emoji}
                          </View>
                          <View className='grow' onClick={() => openEdit(p)}>
                            <View className='mname'>{p.name}</View>
                            <View className='mprice'>¥{yuan(p.price)}</View>
                          </View>
                          <View className='medit' onClick={() => openEdit(p)}>
                            改
                          </View>
                        </View>
                        <View className='m-tags'>
                          <View
                            className={`mtag ${p.soldOut ? 'danger' : 'ok'}`}
                            onClick={() => toggleSoldOut(p.id)}
                          >
                            {p.soldOut ? '已售罄' : '有货'}
                          </View>
                          <View
                            className={`mtag ${p.onSale ? 'ok' : 'muted'}`}
                            onClick={() => updateProduct(p.id, { onSale: !p.onSale })}
                          >
                            {p.onSale ? '已上架' : '已下架'}
                          </View>
                        </View>
                      </View>
                    )
                  )}
                </View>
              )
            })}
            <View className='abottom-space' />
          </ScrollView>
        </>
      ) : null}

      {tab === 'shop' ? (
        <ScrollView scrollY className='alist'>
          <View className='sgroup'>
            <View className='sgroup-title'>品牌外观</View>
            <View className='srow'>
              <Text className='slabel'>店名</Text>
              <Input
                className='sinput'
                value={s.shop.name}
                onInput={(e) => updateShop({ name: e.detail.value })}
              />
            </View>
            <View className='srow'>
              <Text className='slabel'>一句话介绍</Text>
              <Input
                className='sinput'
                value={s.shop.slogan}
                onInput={(e) => updateShop({ slogan: e.detail.value })}
              />
            </View>
            <ImageField
              label='首页背景图'
              hint='横图更好看，会自动压暗保证文字清楚'
              variant='wide'
              placeholder='🏞'
              value={s.shop.coverImage}
              maxSize={900}
              quality={0.72}
              onChange={(v) => updateShop({ coverImage: v })}
            />
          </View>

          <View className='sgroup'>
            <View className='sgroup-title'>营业信息</View>
            <View className='srow col'>
              <Text className='slabel'>今日公告</Text>
              <Textarea
                className='stextarea'
                value={s.shop.notice}
                maxlength={60}
                onInput={(e) => updateShop({ notice: e.detail.value })}
              />
            </View>
            <View className='srow'>
              <Text className='slabel'>预计出杯（分钟）</Text>
              <Input
                className='sinput'
                type='number'
                value={String(s.shop.estimatedMinutes)}
                onInput={(e) =>
                  updateShop({ estimatedMinutes: Math.max(1, Number(e.detail.value) || 1) })
                }
              />
            </View>
            <View className='srow'>
              <Text className='slabel'>门店电话</Text>
              <Input
                className='sinput'
                value={s.shop.phone}
                onInput={(e) => updateShop({ phone: e.detail.value })}
              />
            </View>
            <View className='srow'>
              <Text className='slabel'>门店地址</Text>
              <Input
                className='sinput'
                value={s.shop.address}
                onInput={(e) => updateShop({ address: e.detail.value })}
              />
            </View>
          </View>

          <View className='sgroup'>
            <View className='sgroup-title'>收款</View>
            <View className='srow col'>
              <Text className='slabel'>收款方式</Text>
              <View className='seg'>
                <View
                  className={`seg-item ${s.shop.payMode === 'offline' ? 'active' : ''}`}
                  onClick={() => updateShop({ payMode: 'offline' })}
                >
                  到店付款
                </View>
                <View
                  className={`seg-item ${s.shop.payMode === 'wxpay' ? 'active' : ''}`}
                  onClick={() => {
                    updateShop({ payMode: 'wxpay' })
                    Taro.showToast({ title: '微信支付待接入，当前为占位', icon: 'none' })
                  }}
                >
                  微信支付
                </View>
              </View>
            </View>
            <View className='srow col'>
              <Text className='slabel'>到店付款提示</Text>
              <Textarea
                className='stextarea'
                value={s.shop.offlinePayTip}
                maxlength={80}
                onInput={(e) => updateShop({ offlinePayTip: e.detail.value })}
              />
            </View>
          </View>

          <View className='sgroup'>
            <View className='sgroup-title'>安全与存储</View>
            <View className='srow'>
              <Text className='slabel'>后台密码</Text>
              <Input
                className='sinput'
                type='number'
                value={s.shop.adminPin}
                maxlength={8}
                onInput={(e) => updateShop({ adminPin: e.detail.value })}
              />
            </View>
            <View className='srow'>
              <Text className='slabel'>本地占用</Text>
              <Text className='svalue'>{formatBytes(localUsage())} / 约 5 MB</Text>
            </View>
            <View className='snote'>
              图片存在本机，不会上传服务器。占用快满时，先把不用的商品图移除。
            </View>
          </View>

          <View className='danger'>
            <View
              className='dbtn'
              onClick={() =>
                Taro.showModal({
                  title: '恢复默认菜单',
                  content: '你改过的商品名称、价格会被覆盖，订单不会丢。确定吗？',
                  success: (r) => r.confirm && resetMenu()
                })
              }
            >
              恢复默认菜单
            </View>
            <View
              className='dbtn'
              onClick={() =>
                Taro.showModal({
                  title: '清空所有数据',
                  content: '菜单改动、订单记录、店铺设置全部清空，回到刚装好的状态。',
                  success: (r) => r.confirm && resetAll()
                })
              }
            >
              清空所有数据
            </View>
          </View>

          <View className='abottom-space' />
        </ScrollView>
      ) : null}

      {editor ? (
        <ProductEditor
          product={editor.product}
          categories={s.menu.categories}
          specGroups={s.menu.specGroups}
          onClose={() => setEditor(null)}
          onSave={productEditorSave}
          onDelete={editor.product ? productEditorDelete : undefined}
        />
      ) : null}

      {catOpen ? <CategoryEditor onClose={() => setCatOpen(false)} /> : null}

      {specOpen ? <SpecEditor onClose={() => setSpecOpen(false)} /> : null}
    </View>
  )
}
