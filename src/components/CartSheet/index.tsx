import { ScrollView, Text, View } from '@tarojs/components'
import type { CartItem } from '@/data/types'
import { cartTotal, changeQty, clearCart } from '@/store'
import { yuan } from '@/utils/format'
import './index.scss'

interface Props {
  visible: boolean
  cart: CartItem[]
  onClose: () => void
  onGoCart: () => void
}

export default function CartSheet({ visible, cart, onClose, onGoCart }: Props) {
  if (!visible) return null

  return (
    <View className='cs-mask' onClick={onClose}>
      <View className='cs-sheet' onClick={(e) => e.stopPropagation()}>
        <View className='cs-head'>
          <Text className='cs-title'>购物车</Text>
          {cart.length > 0 ? (
            <Text className='cs-clear' onClick={clearCart}>
              清空
            </Text>
          ) : null}
        </View>

        {cart.length === 0 ? (
          <View className='cs-empty'>还没有选东西，看看菜单吧 ☕</View>
        ) : (
          <ScrollView scrollY className='cs-list'>
            {cart.map((item) => (
              <View className='cs-item' key={item.key}>
                <View
                  className='cs-emoji'
                  style={item.image ? { backgroundImage: `url("${item.image}")` } : undefined}
                >
                  {item.image ? null : item.emoji}
                </View>
                <View className='grow'>
                  <View className='cs-name ellipsis'>{item.name}</View>
                  {item.specs.length > 0 ? (
                    <View className='cs-spec ellipsis'>
                      {item.specs.map((s) => s.optionName).join(' / ')}
                    </View>
                  ) : null}
                  <View className='cs-price'>¥{yuan(item.unitPrice * item.qty)}</View>
                </View>
                <View className='cs-stepper'>
                  <View className='cs-btn' onClick={() => changeQty(item.key, -1)}>
                    −
                  </View>
                  <Text className='cs-num'>{item.qty}</Text>
                  <View className='cs-btn' onClick={() => changeQty(item.key, 1)}>
                    +
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        <View className='cs-foot'>
          <View className='cs-total'>
            <Text className='faint'>合计 </Text>
            <Text className='cs-total-num'>¥{yuan(cartTotal(cart))}</Text>
          </View>
          <View className={`cs-go ${cart.length === 0 ? 'disabled' : ''}`} onClick={cart.length ? onGoCart : undefined}>
            去结算
          </View>
        </View>
      </View>
    </View>
  )
}
