import type { MenuData, ShopInfo } from './types'

export const DEFAULT_SHOP: ShopInfo = {
  name: '拾光咖啡',
  slogan: '一杯好咖啡，值得等一下',
  notice: '今日豆子：埃塞俄比亚 耶加雪菲 · 浅烘，果香明显',
  coverImage: '',
  isOpen: true,
  phone: '13800138000',
  address: 'XX 市 XX 区 XX 路 88 号',
  payMode: 'offline',
  offlinePayTip: '下单后请到吧台出示取餐号付款，也可以先扫码支付',
  estimatedMinutes: 8,
  adminPin: '8888'
}

export const DEFAULT_MENU: MenuData = {
  categories: [
    { id: 'cat-signature', name: '招牌特调', emoji: '✨' },
    { id: 'cat-classic', name: '经典咖啡', emoji: '☕' },
    { id: 'cat-cold', name: '冷萃冰滴', emoji: '🧊' },
    { id: 'cat-tea', name: '茶饮可可', emoji: '🍵' },
    { id: 'cat-dessert', name: '甜点烘焙', emoji: '🍰' }
  ],

  specGroups: [
    {
      id: 'g_size',
      name: '杯型',
      required: true,
      multiple: false,
      options: [
        { id: 's_m', name: '中杯', priceDelta: 0 },
        { id: 's_l', name: '大杯', priceDelta: 300 }
      ]
    },
    {
      id: 'g_temp',
      name: '温度',
      required: true,
      multiple: false,
      options: [
        { id: 't_hot', name: '热', priceDelta: 0 },
        { id: 't_ice', name: '冰', priceDelta: 0 }
      ]
    },
    {
      id: 'g_sugar',
      name: '糖度',
      required: true,
      multiple: false,
      options: [
        { id: 'su_std', name: '标准糖', priceDelta: 0 },
        { id: 'su_half', name: '半糖', priceDelta: 0 },
        { id: 'su_none', name: '无糖', priceDelta: 0 }
      ]
    },
    {
      id: 'g_milk',
      name: '牛奶',
      required: false,
      multiple: false,
      options: [
        { id: 'm_full', name: '全脂牛奶', priceDelta: 0 },
        { id: 'm_oat', name: '燕麦奶', priceDelta: 400 },
        { id: 'm_coco', name: '椰奶', priceDelta: 300 }
      ]
    },
    {
      id: 'g_espresso',
      name: '浓度',
      required: false,
      multiple: false,
      options: [
        { id: 'e_std', name: '标准', priceDelta: 0 },
        { id: 'e_extra', name: '加一份浓缩', priceDelta: 400 }
      ]
    },
    {
      id: 'g_addon',
      name: '加料',
      required: false,
      multiple: true,
      options: [
        { id: 'a_vanilla', name: '香草糖浆', priceDelta: 200 },
        { id: 'a_caramel', name: '焦糖酱', priceDelta: 200 },
        { id: 'a_cream', name: '奶油顶', priceDelta: 300 },
        { id: 'a_cinnamon', name: '肉桂粉', priceDelta: 0 }
      ]
    },
    {
      id: 'g_ice',
      name: '冰量',
      required: true,
      multiple: false,
      options: [
        { id: 'i_std', name: '正常冰', priceDelta: 0 },
        { id: 'i_less', name: '少冰', priceDelta: 0 },
        { id: 'i_none', name: '去冰', priceDelta: 0 }
      ]
    }
  ],

  products: [
    // ---------- 招牌特调 ----------
    {
      id: 'p_osmanthus',
      categoryId: 'cat-signature',
      name: '桂花拿铁',
      desc: '手作桂花糖浆 · 双份浓缩 · 鲜牛奶',
      emoji: '🌼',
      price: 3200,
      soldOut: false,
      onSale: true,
      tags: ['招牌', '热销'],
      specGroupIds: ['g_size', 'g_temp', 'g_sugar', 'g_milk', 'g_addon'],
      sort: 1
    },
    {
      id: 'p_brownsugar',
      categoryId: 'cat-signature',
      name: '黑糖燕麦拿铁',
      desc: '黑糖挂壁 · 燕麦奶 · 隐约焦香',
      emoji: '🍯',
      price: 3400,
      soldOut: false,
      onSale: true,
      tags: ['招牌'],
      specGroupIds: ['g_size', 'g_temp', 'g_sugar', 'g_addon'],
      sort: 2
    },
    {
      id: 'p_orange',
      categoryId: 'cat-signature',
      name: '橙 C 美式',
      desc: '鲜榨橙汁 · 双份浓缩 · 清爽不腻',
      emoji: '🍊',
      price: 3000,
      soldOut: false,
      onSale: true,
      tags: ['新品'],
      specGroupIds: ['g_size', 'g_addon'],
      sort: 3
    },
    {
      id: 'p_salted_caramel',
      categoryId: 'cat-signature',
      name: '焦糖海盐拿铁',
      desc: '焦糖甜感 · 海盐收尾 · 咸甜平衡',
      emoji: '🧂',
      price: 3300,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: ['g_size', 'g_temp', 'g_sugar', 'g_milk', 'g_addon'],
      sort: 4
    },

    // ---------- 经典咖啡 ----------
    {
      id: 'p_americano',
      categoryId: 'cat-classic',
      name: '美式',
      desc: '双份浓缩 + 水，干净明亮的果酸',
      emoji: '☕',
      price: 2200,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: ['g_size', 'g_temp', 'g_ice', 'g_espresso'],
      sort: 1
    },
    {
      id: 'p_latte',
      categoryId: 'cat-classic',
      name: '拿铁',
      desc: '双份浓缩 · 鲜牛奶 · 绵密奶泡',
      emoji: '🥛',
      price: 2600,
      soldOut: false,
      onSale: true,
      tags: ['热销'],
      specGroupIds: ['g_size', 'g_temp', 'g_sugar', 'g_milk', 'g_addon'],
      sort: 2
    },
    {
      id: 'p_cappuccino',
      categoryId: 'cat-classic',
      name: '卡布奇诺',
      desc: '奶泡更厚 · 咖啡味更突出',
      emoji: '☕',
      price: 2600,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: ['g_size', 'g_temp', 'g_sugar', 'g_milk'],
      sort: 3
    },
    {
      id: 'p_flatwhite',
      categoryId: 'cat-classic',
      name: '澳白',
      desc: '浓缩加倍 · 奶量更少 · 口感扎实',
      emoji: '🤍',
      price: 2800,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: ['g_size', 'g_temp', 'g_sugar', 'g_milk'],
      sort: 4
    },
    {
      id: 'p_mocha',
      categoryId: 'cat-classic',
      name: '摩卡',
      desc: '黑巧克力 · 浓缩 · 鲜牛奶',
      emoji: '🍫',
      price: 3000,
      soldOut: true,
      onSale: true,
      tags: [],
      specGroupIds: ['g_size', 'g_temp', 'g_sugar', 'g_milk', 'g_addon'],
      sort: 5
    },
    {
      id: 'p_espresso',
      categoryId: 'cat-classic',
      name: '浓缩咖啡',
      desc: '30ml · 一口闷，最纯粹的店豆风味',
      emoji: '⚫',
      price: 1800,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: ['g_espresso'],
      sort: 6
    },

    // ---------- 冷萃冰滴 ----------
    {
      id: 'p_coldbrew',
      categoryId: 'cat-cold',
      name: '冷萃咖啡',
      desc: '低温浸泡 16 小时 · 顺滑低酸',
      emoji: '🧊',
      price: 2800,
      soldOut: false,
      onSale: true,
      tags: ['热销'],
      specGroupIds: ['g_size', 'g_ice', 'g_addon'],
      sort: 1
    },
    {
      id: 'p_icedrip',
      categoryId: 'cat-cold',
      name: '冰滴咖啡',
      desc: '8 小时慢滴 · 酒香与果干风味',
      emoji: '💧',
      price: 3800,
      soldOut: false,
      onSale: true,
      tags: ['限量'],
      specGroupIds: ['g_size', 'g_ice'],
      sort: 2
    },
    {
      id: 'p_nitro',
      categoryId: 'cat-cold',
      name: '氮气冷萃',
      desc: '氮气注入 · 绵密泡沫 · 像黑啤',
      emoji: '🫧',
      price: 3400,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: ['g_size', 'g_ice'],
      sort: 3
    },

    // ---------- 茶饮可可 ----------
    {
      id: 'p_earlgrey',
      categoryId: 'cat-tea',
      name: '伯爵红茶',
      desc: '佛手柑香气 · 可加奶',
      emoji: '🫖',
      price: 2000,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: ['g_size', 'g_temp', 'g_sugar', 'g_milk'],
      sort: 1
    },
    {
      id: 'p_matcha',
      categoryId: 'cat-tea',
      name: '抹茶拿铁',
      desc: '宇治抹茶 · 鲜牛奶 · 微苦回甘',
      emoji: '🍵',
      price: 3000,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: ['g_size', 'g_temp', 'g_sugar', 'g_milk', 'g_addon'],
      sort: 2
    },
    {
      id: 'p_cocoa',
      categoryId: 'cat-tea',
      name: '热可可',
      desc: '70% 黑巧 · 全脂牛奶 · 奶油顶',
      emoji: '🍫',
      price: 2800,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: ['g_size', 'g_sugar', 'g_addon'],
      sort: 3
    },

    // ---------- 甜点烘焙 ----------
    {
      id: 'p_tiramisu',
      categoryId: 'cat-dessert',
      name: '提拉米苏',
      desc: '马斯卡彭 · 咖啡酒 · 每日现做',
      emoji: '🍰',
      price: 2800,
      soldOut: false,
      onSale: true,
      tags: ['推荐'],
      specGroupIds: [],
      sort: 1
    },
    {
      id: 'p_basque',
      categoryId: 'cat-dessert',
      name: '巴斯克芝士',
      desc: '焦香表皮 · 内里流心',
      emoji: '🧀',
      price: 3200,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: [],
      sort: 2
    },
    {
      id: 'p_croissant',
      categoryId: 'cat-dessert',
      name: '黄油可颂',
      desc: '法式黄油 · 32 层酥皮',
      emoji: '🥐',
      price: 1600,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: [],
      sort: 3
    },
    {
      id: 'p_cinnamon',
      categoryId: 'cat-dessert',
      name: '肉桂卷',
      desc: '肉桂糖霜 · 配黑咖啡一绝',
      emoji: '🌀',
      price: 2000,
      soldOut: false,
      onSale: true,
      tags: [],
      specGroupIds: [],
      sort: 4
    }
  ]
}
