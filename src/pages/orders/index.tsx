import { ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { ORDER_STATUS_TEXT } from '@/data/types'
import { useAppState } from '@/store'
import { formatDateTime, yuan } from '@/utils/format'
import './index.scss'

export default function OrdersPage() {
  const s = useAppState()

  return (
    <View className='lpage'>
      <ScrollView scrollY className='lscroll'>
        {s.orders.length === 0 ? (
          <View className='empty'>
            <View className='empty-emoji'>☕</View>
            <View className='empty-text'>还没有订单</View>
            <View
              className='empty-btn'
              onClick={() => Taro.redirectTo({ url: '/pages/menu/index' })}
            >
              去点一杯
            </View>
          </View>
        ) : (
          s.orders.map((o) => {
            const active = o.status === 'pending' || o.status === 'making' || o.status === 'ready'
            return (
              <View
                className='ocard'
                key={o.id}
                onClick={() => Taro.navigateTo({ url: `/pages/order/index?id=${o.id}` })}
              >
                <View className='ocard-top'>
                  <Text className='ono'>{o.no}</Text>
                  <Text className={`ostatus ${active ? 'active' : ''}`}>
                    {ORDER_STATUS_TEXT[o.status]}
                  </Text>
                </View>
                <View className='ocard-items ellipsis'>
                  {o.items.map((i) => `${i.name}×${i.qty}`).join('、')}
                </View>
                <View className='ocard-bottom'>
                  <Text className='otime'>
                    {formatDateTime(o.createdAt)} · {o.count} 件
                  </Text>
                  <Text className='ototal'>¥{yuan(o.total)}</Text>
                </View>
              </View>
            )
          })
        )}
        <View className='placeholder' />
      </ScrollView>
    </View>
  )
}
