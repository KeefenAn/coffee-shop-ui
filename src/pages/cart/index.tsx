import { useState } from 'react'
import { Input, ScrollView, Text, Textarea, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { Order } from '@/data/types'
import { cartTotal, changeQty, placeOrder, useAppState } from '@/store'
import { yuan } from '@/utils/format'
import './index.scss'

export default function CartPage() {
  const s = useAppState()
  const [pickup, setPickup] = useState<Order['pickup']>('takeaway')
  const [customerName, setCustomerName] = useState('')
  const [remark, setRemark] = useState('')

  const total = cartTotal(s.cart)
  const closed = !s.shop.isOpen

  const goBack = () => {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) Taro.navigateBack({ delta: 1 })
    else Taro.redirectTo({ url: '/pages/menu/index' })
  }

  const submit = () => {
    if (closed) {
      Taro.showToast({ title: '本店已打烊', icon: 'none' })
      return
    }
    if (s.cart.length === 0) {
      Taro.showToast({ title: '购物车是空的', icon: 'none' })
      return
    }
    const order = placeOrder({ pickup, customerName, remark })
    Taro.redirectTo({ url: `/pages/order/index?id=${order.id}` })
  }

  return (
    <View className='cpage'>
      <ScrollView scrollY className='cscroll'>
        <View className='card'>
          <View className='card-title'>取餐方式</View>
          <View className='seg'>
            <View
              className={`seg-item ${pickup === 'takeaway' ? 'active' : ''}`}
              onClick={() => setPickup('takeaway')}
            >
              <Text className='seg-emoji'>🥡</Text>
              <Text className='seg-text'>自取带走</Text>
            </View>
            <View
              className={`seg-item ${pickup === 'dinein' ? 'active' : ''}`}
              onClick={() => setPickup('dinein')}
            >
              <Text className='seg-emoji'>🪑</Text>
              <Text className='seg-text'>店内堂食</Text>
            </View>
          </View>
          <View className='hint'>
            预计 {s.shop.estimatedMinutes} 分钟后可取，做好会叫号
          </View>
        </View>

        <View className='card'>
          <View className='card-title-row'>
            <Text className='card-title'>已选商品</Text>
            <Text className='link' onClick={goBack}>
              继续添加
            </Text>
          </View>

          {s.cart.length === 0 ? (
            <View className='empty'>购物车是空的</View>
          ) : (
            s.cart.map((item) => (
              <View className='citem' key={item.key}>
                <View
                  className='cemoji'
                  style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined}
                >
                  {item.image ? null : item.emoji}
                </View>
                <View className='grow'>
                  <View className='cname ellipsis'>{item.name}</View>
                  {item.specs.length > 0 ? (
                    <View className='cspec ellipsis'>
                      {item.specs.map((x) => x.optionName).join(' / ')}
                    </View>
                  ) : null}
                  <View className='cprice'>¥{yuan(item.unitPrice)}</View>
                </View>
                <View className='stepper'>
                  <View className='sbtn' onClick={() => changeQty(item.key, -1)}>
                    −
                  </View>
                  <Text className='snum'>{item.qty}</Text>
                  <View className='sbtn' onClick={() => changeQty(item.key, 1)}>
                    +
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View className='card'>
          <View className='card-title'>怎么称呼你</View>
          <Input
            className='input'
            placeholder='选填，方便叫号时喊你'
            value={customerName}
            maxlength={12}
            onInput={(e) => setCustomerName(e.detail.value)}
          />
        </View>

        <View className='card'>
          <View className='card-title'>备注</View>
          <Textarea
            className='textarea'
            placeholder='比如：少冰、奶泡厚一点、打包分杯装'
            value={remark}
            maxlength={100}
            onInput={(e) => setRemark(e.detail.value)}
          />
        </View>

        <View className='pay-tip'>
          {s.shop.payMode === 'offline'
            ? `💡 ${s.shop.offlinePayTip}`
            : '💡 提交后可直接微信支付'}
        </View>
      </ScrollView>

      <View className='cfoot'>
        <View className='cfoot-total'>
          <View className='cfoot-count'>共 {s.cart.reduce((a, i) => a + i.qty, 0)} 件</View>
          <View className='cfoot-num'>¥{yuan(total)}</View>
        </View>
        <View
          className={`cfoot-btn ${s.cart.length === 0 || closed ? 'disabled' : ''}`}
          onClick={submit}
        >
          {closed ? '已打烊' : '提交订单'}
        </View>
      </View>
    </View>
  )
}
