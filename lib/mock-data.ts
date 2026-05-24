import { ScheduleItem } from './types'

export const disneylandItems: ScheduleItem[] = [
  // Attractions - Adventureland
  {
    id: 'att-1',
    name: 'カリブの海賊',
    type: 'attraction',
    duration: 15,
    parkType: 'land',
    area: 'アドベンチャーランド',
  },
  {
    id: 'att-2',
    name: 'ジャングルクルーズ',
    type: 'attraction',
    duration: 10,
    parkType: 'land',
    area: 'アドベンチャーランド',
  },
  // Attractions - Westernland
  {
    id: 'att-3',
    name: 'ビッグサンダー・マウンテン',
    type: 'attraction',
    duration: 4,
    parkType: 'land',
    area: 'ウエスタンランド',
  },
  {
    id: 'att-4',
    name: 'カントリーベア・シアター',
    type: 'attraction',
    duration: 17,
    parkType: 'land',
    area: 'ウエスタンランド',
  },
  // Attractions - Fantasyland
  {
    id: 'att-5',
    name: 'プーさんのハニーハント',
    type: 'attraction',
    duration: 4,
    parkType: 'land',
    area: 'ファンタジーランド',
  },
  {
    id: 'att-6',
    name: 'イッツ・ア・スモールワールド',
    type: 'attraction',
    duration: 10,
    parkType: 'land',
    area: 'ファンタジーランド',
  },
  {
    id: 'att-7',
    name: 'ホーンテッドマンション',
    type: 'attraction',
    duration: 15,
    parkType: 'land',
    area: 'ファンタジーランド',
  },
  // Attractions - Tomorrowland
  {
    id: 'att-8',
    name: 'スペース・マウンテン',
    type: 'attraction',
    duration: 3,
    parkType: 'land',
    area: 'トゥモローランド',
  },
  {
    id: 'att-9',
    name: 'バズ・ライトイヤーのアストロブラスター',
    type: 'attraction',
    duration: 5,
    parkType: 'land',
    area: 'トゥモローランド',
  },
  {
    id: 'att-10',
    name: 'スター・ツアーズ',
    type: 'attraction',
    duration: 7,
    parkType: 'land',
    area: 'トゥモローランド',
  },
  // Attractions - Critter Country
  {
    id: 'att-11',
    name: 'スプラッシュ・マウンテン',
    type: 'attraction',
    duration: 10,
    parkType: 'land',
    area: 'クリッターカントリー',
  },
  // Attractions - Toontown
  {
    id: 'att-12',
    name: 'ロジャーラビットのカートゥーンスピン',
    type: 'attraction',
    duration: 4,
    parkType: 'land',
    area: 'トゥーンタウン',
  },
  {
    id: 'att-13',
    name: 'ミニーの家',
    type: 'attraction',
    duration: 10,
    parkType: 'land',
    area: 'トゥーンタウン',
  },

  // Shows
  {
    id: 'show-1',
    name: 'ワンマンズ・ドリームII',
    type: 'show',
    duration: 30,
    parkType: 'land',
    area: 'トゥモローランド',
    fixedTimes: ['12:35', '14:45', '17:00'],
  },
  {
    id: 'show-2',
    name: 'ミッキーのマジカルミュージックワールド',
    type: 'show',
    duration: 25,
    parkType: 'land',
    area: 'ファンタジーランド',
    fixedTimes: ['10:20', '11:35', '13:40', '15:30', '17:10'],
  },
  {
    id: 'show-3',
    name: 'ジャンボリミッキー！',
    type: 'show',
    duration: 20,
    parkType: 'land',
    area: 'トゥーンタウン',
    fixedTimes: ['10:40', '13:10', '15:25'],
  },

  // Parades
  {
    id: 'parade-1',
    name: 'ハーモニー・イン・カラー',
    type: 'parade',
    duration: 45,
    parkType: 'land',
    area: 'パレードルート',
    fixedTimes: ['14:00'],
  },
  {
    id: 'parade-2',
    name: 'エレクトリカルパレード・ドリームライツ',
    type: 'parade',
    duration: 45,
    parkType: 'land',
    area: 'パレードルート',
    fixedTimes: ['19:30'],
  },

  // Events
  {
    id: 'event-1',
    name: 'スカイ・フル・オブ・カラーズ',
    type: 'event',
    duration: 20,
    parkType: 'land',
    area: 'シンデレラ城前',
    fixedTimes: ['20:30'],
  },

  // Restaurants
  {
    id: 'rest-1',
    name: 'ブルーバイユー・レストラン',
    type: 'restaurant',
    duration: 60,
    parkType: 'land',
    area: 'アドベンチャーランド',
    diningType: 'restaurant',
  },
  {
    id: 'rest-2',
    name: 'クリスタルパレス・レストラン',
    type: 'restaurant',
    duration: 60,
    parkType: 'land',
    area: 'アドベンチャーランド',
    diningType: 'restaurant',
  },
  {
    id: 'rest-3',
    name: 'センターストリート・コーヒーハウス',
    type: 'restaurant',
    duration: 45,
    parkType: 'land',
    area: 'ワールドバザール',
    diningType: 'restaurant',
  },
  {
    id: 'rest-4',
    name: 'れすとらん北齋',
    type: 'restaurant',
    duration: 50,
    parkType: 'land',
    area: 'ワールドバザール',
    diningType: 'restaurant',
  },
  {
    id: 'rest-5',
    name: 'ハングリーベア・レストラン',
    type: 'restaurant',
    duration: 30,
    parkType: 'land',
    area: 'ウエスタンランド',
    diningType: 'fastfood',
  },
  {
    id: 'rest-6',
    name: 'トゥモローランド・テラス',
    type: 'restaurant',
    duration: 25,
    parkType: 'land',
    area: 'トゥモローランド',
    diningType: 'fastfood',
  },
  {
    id: 'rest-7',
    name: 'グランマ・サラのキッチン',
    type: 'restaurant',
    duration: 30,
    parkType: 'land',
    area: 'クリッターカントリー',
    diningType: 'fastfood',
  },
  {
    id: 'rest-8',
    name: 'キャプテンフックス・ギャレー',
    type: 'restaurant',
    duration: 20,
    parkType: 'land',
    area: 'ファンタジーランド',
    diningType: 'fastfood',
  },
  {
    id: 'rest-9',
    name: 'クイーン・オブ・ハートのバンケットホール',
    type: 'restaurant',
    duration: 35,
    parkType: 'land',
    area: 'ファンタジーランド',
    diningType: 'fastfood',
  },
  {
    id: 'rest-10',
    name: 'ヒューイ・デューイ・ルーイのグッドタイム・カフェ',
    type: 'restaurant',
    duration: 25,
    parkType: 'land',
    area: 'トゥーンタウン',
    diningType: 'fastfood',
  },
]

// Disney Sea mock data (abbreviated for demo)
export const disneyseaItems: ScheduleItem[] = [
  {
    id: 'sea-att-1',
    name: 'ソアリン：ファンタスティック・フライト',
    type: 'attraction',
    duration: 5,
    parkType: 'sea',
    area: 'メディテレーニアンハーバー',
  },
  {
    id: 'sea-att-2',
    name: 'タワー・オブ・テラー',
    type: 'attraction',
    duration: 2,
    parkType: 'sea',
    area: 'アメリカンウォーターフロント',
  },
  {
    id: 'sea-att-3',
    name: 'センター・オブ・ジ・アース',
    type: 'attraction',
    duration: 3,
    parkType: 'sea',
    area: 'ミステリアスアイランド',
  },
]

export function getItemsByPark(parkType: 'land' | 'sea'): ScheduleItem[] {
  return parkType === 'land' ? disneylandItems : disneyseaItems
}

export function getItemsByType(items: ScheduleItem[], type: ScheduleItem['type']): ScheduleItem[] {
  return items.filter(item => item.type === type)
}

export function getItemsByArea(items: ScheduleItem[], area: string): ScheduleItem[] {
  return items.filter(item => item.area === area)
}

export function getUniqueAreas(items: ScheduleItem[]): string[] {
  return [...new Set(items.map(item => item.area))]
}
