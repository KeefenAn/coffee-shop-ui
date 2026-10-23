import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { DEFAULT_MENU, DEFAULT_SHOP } from '@/data/mock'
import type {
  CartItem,
  Category,
  MenuData,
  Order,
  OrderStatus,
  Product,
  ShopInfo,
  SpecGroup
} from '@/data/types'
import { todayStr } from '@/utils/format'

const STORAGE_KEY = 'coffee-shop-state-v1'

export interface AppState {
  shop: ShopInfo
  menu: MenuData
  cart: CartItem[]
  orders: Order[]
  /** 当日取餐号序号，形如 A001 */
  orderSeq: number
  orderSeqDate: string
  /** 店主后台是否已解锁 */
  adminUnlocked: boolean
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

function initialState(): AppState {
  return {
    shop: clone(DEFAULT_SHOP),
    menu: clone(DEFAULT_MENU),
    cart: [],
    orders: [],
    orderSeq: 0,
    orderSeqDate: todayStr(),
    adminUnlocked: false
  }
}

/** 把本地已保存的内容合并到默认种子上：保留店主改动，同时让新加的默认商品能出现 */
function mergeMenu(saved?: Partial<MenuData>): MenuData {
  const base = clone(DEFAULT_MENU)
  if (!saved) return base
  const savedProducts = saved.products ?? []
  const savedById = new Map(savedProducts.map((p) => [p.id, p]))
  const baseIds = new Set(base.products.map((p) => p.id))
  const merged = base.products.map((p) => savedById.get(p.id) ?? p)
  savedProducts.forEach((p) => {
    if (!baseIds.has(p.id)) merged.push(p)
  })
  return {
    categories: saved.categories?.length ? saved.categories : base.categories,
    specGroups: saved.specGroups?.length ? saved.specGroups : base.specGroups,
    products: merged
  }
}

function load(): AppState {
  const base = initialState()
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY)
    if (!raw) return base
    const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!saved || typeof saved !== 'object') return base
    return {
      shop: { ...base.shop, ...(saved.shop ?? {}) },
      menu: mergeMenu(saved.menu),
      cart: Array.isArray(saved.cart) ? saved.cart : [],
      orders: Array.isArray(saved.orders) ? saved.orders : [],
      orderSeq: typeof saved.orderSeq === 'number' ? saved.orderSeq : 0,
      orderSeqDate: saved.orderSeqDate ?? base.orderSeqDate,
      adminUnlocked: !!saved.adminUnlocked
    }
  } catch (e) {
    console.warn('[store] load failed, fallback to default', e)
    return base
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

let quotaWarned = false

function persist(next: AppState) {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(next))
    quotaWarned = false
  } catch (e) {
    console.warn('[store] persist failed', e)
    if (!quotaWarned) {
      quotaWarned = true
      Taro.showToast({
        title: '本地空间不足，这次改动可能没保存上',
        icon: 'none',
        duration: 2600
      })
    }
  }
}

function commit(next: AppState) {
  state = next
  persist(next)
  listeners.forEach((l) => l())
}

export function getState(): AppState {
  return state
}

export function update(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const delta = typeof patch === 'function' ? patch(state) : patch
  commit({ ...state, ...delta })
}

/** 订阅整个状态，任何变更都触发重渲染（数据量很小，够用） */
export function useAppState(): AppState {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((v) => v + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return state
}

// ---------------------------------------------------------------- 价格计算

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((sum, i) => sum + i.qty, 0)
}

export function buildCartKey(productId: string, specs: CartItem['specs']): string {
  const specKey = specs
    .map((s) => `${s.groupId}:${s.optionId}`)
    .sort()
    .join(',')
  return `${productId}|${specKey}`
}

// ---------------------------------------------------------------- 购物车操作

export function addToCart(item: CartItem) {
  const existing = state.cart.find((i) => i.key === item.key)
  const cart = existing
    ? state.cart.map((i) => (i.key === item.key ? { ...i, qty: i.qty + item.qty } : i))
    : [...state.cart, item]
  commit({ ...state, cart })
}

export function changeQty(key: string, delta: number) {
  const cart = state.cart
    .map((i) => (i.key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
    .filter((i) => i.qty > 0)
  commit({ ...state, cart })
}

export function clearCart() {
  commit({ ...state, cart: [] })
}

// ---------------------------------------------------------------- 订单

function nextOrderNo(s: AppState): { no: string; orderSeq: number; orderSeqDate: string } {
  const today = todayStr()
  const seq = s.orderSeqDate === today ? s.orderSeq + 1 : 1
  const no = `A${String(seq).padStart(3, '0')}`
  return { no, orderSeq: seq, orderSeqDate: today }
}

export function placeOrder(input: {
  pickup: Order['pickup']
  customerName: string
  remark: string
}): Order {
  const s = state
  const now = Date.now()
  const { no, orderSeq, orderSeqDate } = nextOrderNo(s)
  const order: Order = {
    id: `o_${now}_${Math.floor(Math.random() * 1000)}`,
    no,
    items: clone(s.cart),
    total: cartTotal(s.cart),
    count: cartCount(s.cart),
    status: 'pending',
    payStatus: 'unpaid',
    pickup: input.pickup,
    customerName: input.customerName,
    remark: input.remark,
    createdAt: now,
    updatedAt: now
  }
  commit({
    ...s,
    cart: [],
    orders: [order, ...s.orders],
    orderSeq,
    orderSeqDate
  })
  return order
}

export function setOrderStatus(id: string, status: OrderStatus) {
  const orders = state.orders.map((o) =>
    o.id === id ? { ...o, status, updatedAt: Date.now() } : o
  )
  commit({ ...state, orders })
}

export function setOrderPaid(id: string) {
  const orders = state.orders.map((o) =>
    o.id === id ? { ...o, payStatus: 'paid' as const, updatedAt: Date.now() } : o
  )
  commit({ ...state, orders })
}

export function getOrder(id: string): Order | undefined {
  return state.orders.find((o) => o.id === id)
}

// ---------------------------------------------------------------- 店主后台

export function updateShop(patch: Partial<ShopInfo>) {
  commit({ ...state, shop: { ...state.shop, ...patch } })
}

export function toggleShopOpen() {
  updateShop({ isOpen: !state.shop.isOpen })
}

export function updateProduct(id: string, patch: Partial<Product>) {
  const products = state.menu.products.map((p) => (p.id === id ? { ...p, ...patch } : p))
  commit({ ...state, menu: { ...state.menu, products } })
}

/** 新增商品，自动放到所属分类的最后 */
export function createProduct(input: Omit<Product, 'id' | 'sort'>): Product {
  const sameCategory = state.menu.products.filter((p) => p.categoryId === input.categoryId)
  const maxSort = sameCategory.reduce((m, p) => Math.max(m, p.sort), 0)
  const product: Product = {
    ...input,
    id: `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    sort: maxSort + 1
  }
  commit({
    ...state,
    menu: { ...state.menu, products: [...state.menu.products, product] }
  })
  return product
}

export function deleteProduct(id: string) {
  commit({
    ...state,
    menu: { ...state.menu, products: state.menu.products.filter((p) => p.id !== id) }
  })
}

export function createCategory(name = '新分类', emoji = '🍽'): Category {
  const category: Category = { id: `cat_${Date.now()}`, name, emoji }
  commit({
    ...state,
    menu: { ...state.menu, categories: [...state.menu.categories, category] }
  })
  return category
}

export function updateCategory(id: string, patch: Partial<Category>) {
  const categories = state.menu.categories.map((c) => (c.id === id ? { ...c, ...patch } : c))
  commit({ ...state, menu: { ...state.menu, categories } })
}

export function deleteCategory(id: string): { ok: boolean; reason?: string } {
  const used = state.menu.products.filter((p) => p.categoryId === id).length
  if (used > 0) {
    return { ok: false, reason: `这个分类下还有 ${used} 个商品，先把它们改到别的分类` }
  }
  if (state.menu.categories.length <= 1) {
    return { ok: false, reason: '至少要保留一个分类' }
  }
  commit({
    ...state,
    menu: { ...state.menu, categories: state.menu.categories.filter((c) => c.id !== id) }
  })
  return { ok: true }
}

/** 同一个分类内把商品上移/下移一位，并把 sort 重排成 1,2,3… */
export function moveProduct(id: string, dir: -1 | 1) {
  const target = state.menu.products.find((p) => p.id === id)
  if (!target) return
  const siblings = state.menu.products
    .filter((p) => p.categoryId === target.categoryId)
    .sort((a, b) => a.sort - b.sort)
  const from = siblings.findIndex((p) => p.id === id)
  const to = from + dir
  if (from < 0 || to < 0 || to >= siblings.length) return

  const ordered = [...siblings]
  const [moved] = ordered.splice(from, 1)
  ordered.splice(to, 0, moved)

  const sortMap = new Map(ordered.map((p, i) => [p.id, i + 1]))
  const products = state.menu.products.map((p) =>
    sortMap.has(p.id) ? { ...p, sort: sortMap.get(p.id)! } : p
  )
  commit({ ...state, menu: { ...state.menu, products } })
}

/** 分类上移/下移一位 */
export function moveCategory(id: string, dir: -1 | 1) {
  const list = [...state.menu.categories]
  const from = list.findIndex((c) => c.id === id)
  const to = from + dir
  if (from < 0 || to < 0 || to >= list.length) return
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  commit({ ...state, menu: { ...state.menu, categories: list } })
}

/** 整体替换规格组（规格编辑器内部用，允许逐个字段编辑） */
export function replaceSpecGroups(specGroups: SpecGroup[]) {
  commit({ ...state, menu: { ...state.menu, specGroups } })
}

/** 删除规格组，同时从所有商品上摘掉 */
export function deleteSpecGroup(id: string) {
  const specGroups = state.menu.specGroups.filter((g) => g.id !== id)
  const products = state.menu.products.map((p) =>
    p.specGroupIds.includes(id)
      ? { ...p, specGroupIds: p.specGroupIds.filter((x) => x !== id) }
      : p
  )
  commit({ ...state, menu: { ...state.menu, specGroups, products } })
}

/** 有多少个商品正在用这个规格组 */
export function specGroupUsage(id: string): number {
  return state.menu.products.filter((p) => p.specGroupIds.includes(id)).length
}

export function toggleSoldOut(id: string) {
  const p = state.menu.products.find((x) => x.id === id)
  if (p) updateProduct(id, { soldOut: !p.soldOut })}

export function updateSpecGroup(id: string, patch: Partial<SpecGroup>) {
  const specGroups = state.menu.specGroups.map((g) => (g.id === id ? { ...g, ...patch } : g))
  commit({ ...state, menu: { ...state.menu, specGroups } })
}

export function setAdminUnlocked(v: boolean) {
  commit({ ...state, adminUnlocked: v })
}

/** 把菜单恢复成初始示例（店主的商品修改会被覆盖） */
export function resetMenu() {
  commit({ ...state, menu: clone(DEFAULT_MENU) })
}

/** 清空全部本地数据，回到刚装好的样子 */
export function resetAll() {
  commit({ ...initialState(), adminUnlocked: state.adminUnlocked })
}
