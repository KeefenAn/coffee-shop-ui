/** 金额一律用「分」为单位存整数，避免浮点误差 */

export type PayMode = 'offline' | 'wxpay'

export interface ShopInfo {
  name: string
  slogan: string
  notice: string
  /** 首页顶部背景图（dataURL 或 https 地址），空则用默认渐变 */
  coverImage?: string
  /** 营业开关：关掉后顾客无法下单 */
  isOpen: boolean
  phone: string
  address: string
  payMode: PayMode
  /** 线下付款时的引导文案 */
  offlinePayTip: string
  /** 预计制作时长（分钟） */
  estimatedMinutes: number
  /** 店主后台密码（明文本地保存，仅用于拦住误入的顾客） */
  adminPin: string
}

export interface Category {
  id: string
  name: string
  emoji: string
}

export interface SpecOption {
  id: string
  name: string
  /** 相对基础价的加价，单位分 */
  priceDelta: number
}

export interface SpecGroup {
  id: string
  name: string
  /** 是否必选 */
  required: boolean
  /** 是否可多选 */
  multiple: boolean
  options: SpecOption[]
}

export interface Product {
  id: string
  categoryId: string
  name: string
  desc: string
  /** 没有真实图片时用 emoji 占位，店主换成 image 即可 */
  emoji: string
  image?: string
  /** 基础价，单位分 */
  price: number
  soldOut: boolean
  onSale: boolean
  tags: string[]
  /** 引用全局规格组 */
  specGroupIds: string[]
  sort: number
}

export interface MenuData {
  categories: Category[]
  products: Product[]
  specGroups: SpecGroup[]
}

export interface CartSpec {
  groupId: string
  groupName: string
  optionId: string
  optionName: string
  priceDelta: number
}

export interface CartItem {
  /** productId + 规格组合，用于合并同款 */
  key: string
  productId: string
  name: string
  emoji: string
  /** 商品图（下单时快照，之后改菜单不影响历史订单） */
  image?: string
  /** 单份价格（含规格加价），单位分 */
  unitPrice: number
  qty: number
  specs: CartSpec[]
  note: string
}

export type OrderStatus = 'pending' | 'making' | 'ready' | 'done' | 'cancelled'

export interface Order {
  id: string
  /** 取餐号，如 A012 */
  no: string
  items: CartItem[]
  total: number
  count: number
  status: OrderStatus
  payStatus: 'unpaid' | 'paid'
  pickup: 'takeaway' | 'dinein'
  customerName: string
  remark: string
  createdAt: number
  updatedAt: number
}

export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  pending: '已下单',
  making: '制作中',
  ready: '请取餐',
  done: '已完成',
  cancelled: '已取消'
}
