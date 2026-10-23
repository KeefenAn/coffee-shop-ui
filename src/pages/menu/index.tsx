import { useCallback, useMemo, useRef, useState } from 'react'
import { ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import CartSheet from '@/components/CartSheet'
import SpecPopup from '@/components/SpecPopup'
import type { CartItem, Product } from '@/data/types'
import { addToCart, buildCartKey, cartCount, cartTotal, useAppState } from '@/store'
import { yuan } from '@/utils/format'
import './index.scss'

export default function MenuPage() {
  const s = useAppState()
  const [activeCat, setActiveCat] = useState<string>('')
  const [scrollInto, setScrollInto] = useState<string>('')
  const [specProduct, setSpecProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const lastSync = useRef(0)

  const sections = useMemo(
    () =>
      s.menu.categories
        .map((c) => ({
          ...c,
          items: s.menu.products
            .filter((p) => p.categoryId === c.id && p.onSale)
            .sort((a, b) => a.sort - b.sort)
        }))
        .filter((c) => c.items.length > 0),
    [s.menu]
  )

  const currentCat = activeCat || sections[0]?.id || ''
  const closed = !s.shop.isOpen
  const count = cartCount(s.cart)
  const total = cartTotal(s.cart)

  const qtyOf = (pid: string) =>
    s.cart.filter((i) => i.productId === pid).reduce((a, i) => a + i.qty, 0)

  const handleScroll = useCallback(() => {
    const now = Date.now()
    if (now - lastSync.current < 140) return
    lastSync.current = now
    try {
      const q = Taro.createSelectorQuery()
      q.select('.list-wrap').boundingClientRect()
      q.selectAll('.cat-section').boundingClientRect()
      q.exec((res: any[]) => {
        const box = res?.[0]
        const tops = res?.[1]
        if (!box || !Array.isArray(tops) || tops.length === 0) return
        const line = box.top + 8
        let hit = ''
        tops.forEach((t: any) => {
          if (t && t.id && t.top <= line) hit = t.id
        })
        if (hit.startsWith('sec-')) {
          const id = hit.slice(4)
          setActiveCat((prev) => (prev === id ? prev : id))
        }
      })
    } catch (e) {
      // 查询失败不影响下单，忽略
    }
  }, [])

  const pickCategory = (id: string) => {
    setActiveCat(id)
    setScrollInto(`sec-${id}`)
  }

  const handleAdd = (p: Product) => {
    if (closed) {
      Taro.showToast({ title: '本店已打烊', icon: 'none' })
      return
    }
    if (p.soldOut) return
    if (p.specGroupIds.length > 0) {
      setSpecProduct(p)
      return
    }
    const item: CartItem = {
      key: buildCartKey(p.id, []),
      productId: p.id,
      name: p.name,
      emoji: p.emoji,
      image: p.image,
      unitPrice: p.price,
      qty: 1,
      specs: [],
      note: ''
    }
    addToCart(item)
    Taro.showToast({ title: '已加入购物车', icon: 'none', duration: 900 })
  }

  const handleSpecConfirm = (item: CartItem) => {
    addToCart(item)
    setSpecProduct(null)
    Taro.showToast({ title: '已加入购物车', icon: 'none', duration: 900 })
  }

  return (
    <View className='page'>
      <View
        className={`hero ${s.shop.coverImage ? 'has-cover' : ''}`}
        style={
          s.shop.coverImage ? { backgroundImage: `url("${s.shop.coverImage}")` } : undefined
        }
      >
        <View className='hero-mask' />
        <View className='hero-inner'>
          <View className='hero-top'>
            <View className='grow'>
              <View
                className='brand'
                onLongPress={() => Taro.navigateTo({ url: '/pages/admin/index' })}
              >
                {s.shop.name}
              </View>
              <View className='slogan'>{s.shop.slogan}</View>
            </View>
            <View
              className='hero-btn'
              onClick={() => Taro.navigateTo({ url: '/pages/orders/index' })}
            >
              我的订单
            </View>
          </View>

          <View className='hero-meta'>
            <View className={`pill ${closed ? 'closed' : ''}`}>
              <View className='dot' />
              {closed ? '休息中' : `营业中 · 约 ${s.shop.estimatedMinutes} 分钟`}
            </View>
          </View>

          {s.shop.notice ? (
            <View className='notice'>
              <Text className='notice-icon'>📢</Text>
              <Text className='notice-text ellipsis'>{s.shop.notice}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {closed ? (
        <View className='closed-bar'>本店已打烊，暂不接单，明早见 ☀️</View>
      ) : null}

      <View className='body'>
        <ScrollView scrollY className='cats' scrollWithAnimation>
          {sections.map((c) => (
            <View
              key={c.id}
              className={`cat ${currentCat === c.id ? 'active' : ''}`}
              onClick={() => pickCategory(c.id)}
            >
              <Text className='cat-emoji'>{c.emoji}</Text>
              <Text className='cat-name'>{c.name}</Text>
            </View>
          ))}
        </ScrollView>

        <ScrollView
          scrollY
          className='list-wrap'
          scrollIntoView={scrollInto}
          onScroll={handleScroll}
          scrollWithAnimation
        >
          {sections.map((c) => (
            <View className='cat-section' id={`sec-${c.id}`} key={c.id}>
              <View className='section-title'>
                <Text className='section-emoji'>{c.emoji}</Text>
                <Text className='section-name'>{c.name}</Text>
              </View>

              {c.items.map((p) => (
                <View className='prow' key={p.id}>
                  <View
                    className='pthumb'
                    style={p.image ? { backgroundImage: `url("${p.image}")` } : undefined}
                  >
                    {p.image ? null : p.emoji}
                  </View>
                  <View className='pinfo'>
                    <View className='pname-row'>
                      <Text className='pname'>{p.name}</Text>
                      {p.tags.map((t) => (
                        <Text className='ptag' key={t}>
                          {t}
                        </Text>
                      ))}
                    </View>
                    <View className='pdesc ellipsis-2'>{p.desc}</View>
                    <View className='pbottom'>
                      <View className='pprice'>
                        <Text className='cny'>¥</Text>
                        {yuan(p.price)}
                      </View>
                      {p.soldOut ? (
                        <View className='soldout'>售罄</View>
                      ) : (
                        <View className='add' onClick={() => handleAdd(p)}>
                          +
                          {qtyOf(p.id) > 0 ? <View className='add-badge'>{qtyOf(p.id)}</View> : null}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}

          <View className='list-end'>— 就这些了，慢慢挑 —</View>
          <View
            className='admin-entry'
            onClick={() => Taro.navigateTo({ url: '/pages/admin/index' })}
          >
            店主入口
          </View>
        </ScrollView>
      </View>

      <View className='cartbar'>
        <View className='cart-left' onClick={() => count > 0 && setCartOpen(true)}>
          <View className='cart-icon'>
            🛒
            {count > 0 ? <View className='cart-badge'>{count}</View> : null}
          </View>
          <View className='cart-amount'>
            {count > 0 ? (
              <Text className='cart-total'>¥{yuan(total)}</Text>
            ) : (
              <Text className='cart-empty'>还没选东西</Text>
            )}
          </View>
        </View>
        <View
          className={`cart-go ${count === 0 || closed ? 'disabled' : ''}`}
          onClick={() => {
            if (count === 0 || closed) return
            Taro.navigateTo({ url: '/pages/cart/index' })
          }}
        >
          {closed ? '已打烊' : '去结算'}
        </View>
      </View>

      <SpecPopup
        product={specProduct}
        menu={s.menu}
        onClose={() => setSpecProduct(null)}
        onConfirm={handleSpecConfirm}
      />

      <CartSheet
        visible={cartOpen}
        cart={s.cart}
        onClose={() => setCartOpen(false)}
        onGoCart={() => {
          setCartOpen(false)
          Taro.navigateTo({ url: '/pages/cart/index' })
        }}
      />
    </View>
  )
}
