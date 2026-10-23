import { ScrollView, Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { ORDER_STATUS_TEXT } from '@/data/types'
import type { OrderStatus } from '@/data/types'
import { setOrderPaid, useAppState } from '@/store'
import { formatDateTime, yuan } from '@/utils/format'
import './index.scss'

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: '已下单' },
  { key: 'making', label: '制作中' },
  { key: 'ready', label: '请取餐' },
  { key: 'done', label: '已完成' }
]

export default function OrderPage() {
  const router = useRouter()
  const s = useAppState()
  const order = s.orders.find((o) => o.id === router.params.id)

  if (!order) {
    return (
      <View className='opage'>
        <View className='missing'>订单不存在或已被清理</View>
        <View className='back-btn' onClick={() => Taro.redirectTo({ url: '/pages/menu/index' })}>
          回到点单
        </View>
      </View>
    )
  }

  const stepIndex = STEPS.findIndex((x) => x.key === order.status)
  const cancelled = order.status === 'cancelled'

  const pay = () => {
    if (s.shop.payMode === 'wxpay') {
      Taro.showModal({
        title: '微信支付',
        content: '微信支付还没接入（需要小程序 AppID + 商户号）。现在先把流程走通？',
        confirmText: '模拟支付',
        success: (r) => {
          if (r.confirm) setOrderPaid(order.id)
        }
      })
      return
    }
    Taro.showModal({
      title: '到店付款',
      content: `请到吧台出示取餐号 ${order.no} 付款。收到钱后点「我已付款」即可（测试用）。`,
      confirmText: '我已付款',
      success: (r) => {
        if (r.confirm) setOrderPaid(order.id)
      }
    })
  }

  return (
    <View className='opage'>
      <ScrollView scrollY className='oscroll'>
        <View className='ticket'>
          <View className='ticket-label'>取餐号</View>
          <View className='ticket-no'>{order.no}</View>
          <View className='ticket-sub'>
            {cancelled ? '订单已取消' : ORDER_STATUS_TEXT[order.status]} ·{' '}
            {order.pickup === 'takeaway' ? '自取带走' : '店内堂食'}
          </View>
          <View className='ticket-status'>预计 {s.shop.estimatedMinutes} 分钟</View>
        </View>

        {!cancelled ? (
          <View className='steps'>
            {STEPS.map((st, i) => (
              <View className={`step ${i <= stepIndex ? 'on' : ''}`} key={st.key}>
                <View className='step-dot' />
                <View className='step-label'>{st.label}</View>
              </View>
            ))}
          </View>
        ) : null}

        <View className='card'>
          <View className='card-title-row'>
            <Text className='card-title'>订单内容</Text>
            <Text className='faint small'>{formatDateTime(order.createdAt)}</Text>
          </View>
          {order.items.map((it) => (
            <View className='oitem' key={it.key}>
              <View
                className='oemoji'
                style={it.image ? { backgroundImage: `url("${it.image}")` } : undefined}
              >
                {it.image ? null : it.emoji}
              </View>
              <View className='grow'>
                <View className='oname ellipsis'>{it.name}</View>
                {it.specs.length > 0 ? (
                  <View className='ospec ellipsis'>
                    {it.specs.map((x) => x.optionName).join(' / ')}
                  </View>
                ) : null}
              </View>
              <View className='oright'>
                <View className='oqty'>×{it.qty}</View>
                <View className='oprice'>¥{yuan(it.unitPrice * it.qty)}</View>
              </View>
            </View>
          ))}

          <View className='osum'>
            <Text className='faint'>共 {order.count} 件</Text>
            <Text className='osum-num'>¥{yuan(order.total)}</Text>
          </View>

          {order.remark ? (
            <View className='oremark'>
              <Text className='faint'>备注：</Text>
              {order.remark}
            </View>
          ) : null}
          {order.customerName ? (
            <View className='oremark'>
              <Text className='faint'>称呼：</Text>
              {order.customerName}
            </View>
          ) : null}
        </View>

        <View className='card'>
          <View className='card-title-row'>
            <Text className='card-title'>支付</Text>
            <Text className={`pay-chip ${order.payStatus === 'paid' ? 'paid' : ''}`}>
              {order.payStatus === 'paid' ? '已支付' : '待支付'}
            </Text>
          </View>
          <View className='pay-row'>
            <Text className='faint small'>{s.shop.payMode === 'offline' ? '到店付款' : '微信支付'}</Text>
            <Text className='pay-amount'>¥{yuan(order.total)}</Text>
          </View>
          {order.payStatus === 'unpaid' ? (
            <View className='pay-btn' onClick={pay}>
              去付款
            </View>
          ) : (
            <View className='pay-done'>✓ 已收款，谢谢惠顾</View>
          )}
        </View>

        <View className='actions'>
          <View className='action-btn' onClick={() => Taro.redirectTo({ url: '/pages/menu/index' })}>
            再点一单
          </View>
          <View
            className='action-btn ghost'
            onClick={() => Taro.redirectTo({ url: '/pages/orders/index' })}
          >
            我的订单
          </View>
        </View>
        <View className='oplaceholder'>—</View>
      </ScrollView>
    </View>
  )
}
