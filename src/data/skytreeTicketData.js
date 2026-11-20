/**
 * 도쿄 스카이트리 전망대 입장권 예매 및 현장 이용 정보 데이터
 * (2026년 11월 공식 한국어 홈페이지 확인 URL 기반)
 */

export const SKYTREE_TICKET_URLS = {
  deck350: 'https://global-official-ticket.tokyo-skytree.jp/ko/skytree/product/prod_agohhqeglr4lbgcgtigwuc5lta?planId=SKYTREE-WV13S-1',
  combo: 'https://global-official-ticket.tokyo-skytree.jp/ko/skytree/product/prod_agohhqeglr4lbgcgtigwuc5lta?planId=SKYTREE-WV13S-2',
  officialHome: 'https://global-official-ticket.tokyo-skytree.jp/ko/home',
  officialGuide: 'https://ko.tokyo-skytree.jp/ticket/',
  webPurchaseGuide: 'https://ko.tokyo-skytree.jp/ticket/web-purchase/',
  congestion: 'https://ko.tokyo-skytree.jp/ticket/congestion/',
  admission: 'https://ko.tokyo-skytree.jp/ticket/admission/',
  cancelPolicy: 'https://ko.tokyo-skytree.jp/ticket/cancel/',
  openHours: 'https://ko.tokyo-skytree.jp/open-hours/',
};

export const SKYTREE_TICKET_PLANS = {
  deck350: {
    id: 'deck350',
    badge: '가족 야경 추천',
    name: '덴보 데크 (350m) 단독 입장권',
    shortName: '350m 덴보 데크',
    jpName: '天望デッキ(350m) 入場券',
    adultMinJpy: 1800,
    childMinJpy: 900,
    onsiteSurchargeJpy: 500,
    summary: '지상 350m 360도 파노라마 야경과 340m 유리 바닥 감상 · 첫날 체력을 아끼기 좋은 핵심 권종',
    highlights: [
      '어른(15세 이상·고등학생~) 최저 ¥1,800~ / 어린이(6~14세) 최저 ¥900~',
      '만 5세 이하(6세 미만 미취학 아동) 무료 입장',
      '현장 4F 구매 시 1장당 +¥500 추가 · 사전 온라인 예매로 면제',
      '당일 450m에 올라가고 싶으면 350m 내부 발매기에서 추가 구매 가능(어른 ¥1,400 · 어린이 ¥700, 현장 수수료 없음)',
    ],
    buyUrl: SKYTREE_TICKET_URLS.deck350,
    ctaLabel: '공식 350m 단독권 예매 ↗',
  },
  combo: {
    id: 'combo',
    badge: '최고층 451.2m',
    name: '덴보 데크(350m) + 덴보 회랑(450m) 콤보 티켓',
    shortName: '350m+450m 콤보',
    jpName: '天望デッキ＋天望回廊 セット券',
    adultMinJpy: 3000,
    childMinJpy: 1500,
    onsiteSurchargeJpy: 500,
    summary: '350m 전망대 + 최고 높이 451.2m 나선형 하늘 산책 경사로(덴보 회랑)까지 한 번에 오르는 세트권',
    highlights: [
      '어른(15세 이상·고등학생~) 최저 ¥3,000~ / 어린이(6~14세) 최저 ¥1,500~',
      '만 5세 이하(6세 미만 미취학 아동) 무료 입장',
      '현장 추가(¥1,400)보다 사전 세트 구매가 유리하며 한 번에 QR 입장',
      '1일차 새벽 출발 일정을 고려해 가족 체력이 충분할 때 추천',
    ],
    buyUrl: SKYTREE_TICKET_URLS.combo,
    ctaLabel: '공식 콤보 티켓 예매 ↗',
  },
};

export const SKYTREE_BOOKING_CHANNELS = [
  {
    id: 'official',
    name: '도쿄 스카이트리 공식 한국어 E-티켓',
    badge: '공식 · 최우선 추천',
    paymentNote: '해외결제 카드 (VISA · Mastercard · JCB · Amex · Diners)',
    desc: '정가 기준 가장 깔끔한 공식 예매처. 결제 후 모바일 QR이 즉시 발급되며 4F 사전 구입 전용 레인에서 교환 없이 바로 입장합니다.',
    tags: ['공식 정가', 'QR 즉시 입장', '현장 +¥500 면제'],
    url: SKYTREE_TICKET_URLS.officialHome,
    ctaLabel: '공식 E-티켓 홈 열기 ↗',
    recommended: true,
  },
  {
    id: 'klook',
    name: '클룩 (Klook) 한국어',
    badge: '원화 · 간편결제',
    paymentNote: '원화(KRW) · 카카오페이 · 네이버페이 · 신용카드',
    desc: '한국어 리뷰·옵션 비교와 원화 결제가 편리하며, 즉시 확정 모바일 바우처(QR)로 현장에서 바로 입장할 수 있습니다.',
    tags: ['원화 결제', '카카오/네이버페이', '모바일 QR'],
    url: 'https://www.klook.com/ko/activity/800-tokyo-skytree-tokyo/',
    ctaLabel: '클룩 예매 페이지 ↗',
    recommended: false,
  },
  {
    id: 'kkday',
    name: 'KKday 한국어',
    badge: '원화 · 할인 프로모션',
    paymentNote: '원화(KRW) · 간편결제 · 국내 카드',
    desc: '날짜·시간대 지정 예약과 모바일 바우처 QR 바로 입장을 지원하며, 시즌 할인 쿠폰 적용이 가능한 경우가 많습니다.',
    tags: ['원화 결제', '시간대 지정', 'QR 바로 입장'],
    url: 'https://www.kkday.com/ko/product/38352',
    ctaLabel: 'KKday 예매 페이지 ↗',
    recommended: false,
  },
  {
    id: 'myrealtrip',
    name: '마이리얼트립',
    badge: '국내 플랫폼',
    paymentNote: '원화(KRW) · 토스/카카오/카드 · 쿠폰 적용',
    desc: '국내 여행 플랫폼에서 한국어 고객센터 지원과 함께 스카이트리 단품 및 도쿄 패스 결합 상품을 비교해 구매할 수 있습니다.',
    tags: ['국내 고객지원', '원화·쿠폰', '패키지 비교'],
    url: 'https://www.myrealtrip.com/search?tab=all&q=%EB%8F%84%EC%BF%84+%EC%8A%A4%EC%B9%B4%EC%9D%B4%ED%8A%B8%EB%A6%AC+%EC%9E%85%EC%9E%A5%EA%B6%8C',
    ctaLabel: '마이리얼트립 검색 ↗',
    recommended: false,
  },
];

export const SKYTREE_OFFICIAL_HELP_LINKS = [
  { id: 'guide', label: '공식 요금 안내', url: SKYTREE_TICKET_URLS.officialGuide },
  { id: 'congestion', label: '시간대 혼잡 예상', url: SKYTREE_TICKET_URLS.congestion },
  { id: 'admission', label: '4F 입구 가는 법', url: SKYTREE_TICKET_URLS.admission },
  { id: 'cancel', label: '취소·변경 규정', url: SKYTREE_TICKET_URLS.cancelPolicy },
  { id: 'hours', label: '영업시간 확인', url: SKYTREE_TICKET_URLS.openHours },
];

export const SKYTREE_TIME_SLOTS = ['18:30', '19:00', '19:30', '20:00', '20:30'];

export const SKYTREE_IMPORTANT_NOTES = [
  '변동 요금제(다이내믹 프라이싱) 운영: 일요일(11.22) 저녁 실제 요금은 예매 화면에서 날짜·시간을 선택해 실시간으로 확인하세요.',
  '4F 현장 매표소·발매기 구매 시 티켓 1장당 +500엔의 현장 수수료가 가산되므로, 4인 기준 온라인 사전 예매만으로 최대 ¥2,000을 절약합니다.',
  '공식 WEB 구매 취소 규정: 구매 후 59분 이내 무료 취소, 이후 입장 개시 시간 전까지 취소 수수료 20%, 입장 개시 후 취소 불가 및 날짜·시간 변경 불가.',
  '리무진 버스나 저녁 식사가 지연되어 예약 슬롯 시각보다 늦어져도 당일 4F 현지 스태프에게 말씀하시면 상황에 따라 입장을 안내받을 수 있습니다(최종 입장 21:00).',
];

/**
 * 사용자가 입력한 URL이 안전한 http(s) 링크인지 검증하고 정제합니다.
 */
export function normalizeSafeHttpUrl(raw) {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return '';
  } catch {
    return '';
  }
}
