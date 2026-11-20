import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, Maximize2, Compass, Layers, Sparkles } from 'lucide-react';

// 날짜별 세부 보너스 랜드마크 스팟 (가족들이 지도에서 직관적으로 위치를 파악하도록 상세 마커 추가)
const EXTRA_SPOTS_BY_DAY = {
  1: [
    { id: 'ex-1-1', title: '나리타 국제공항 제3터미널', jp: '成田空港 第3ターミナル', time: '12:50 도착', coords: [35.7797, 140.3853], color: '#0284c7', query: '成田空港 第3ターミナル', desc: 'Visit Japan Web QR 입국 후 1층 로비에서 14:15/14:25 T-CAT행 리무진 버스 탑승' },
    { id: 'ex-1-sky', title: '도쿄 스카이트리 4F 전망대 입구', jp: '東京スカイツリー 4F 入口フロア', time: '19:20 입장 준비', coords: [35.70985, 139.81035], color: '#2563eb', query: '東京スカイツリー', desc: '소라마치 4층 실내 통로 직결 · 모바일 QR 제시 및 보안검색 후 고속 엘리베이터로 350m 덴보 데크 탑승' },
    { id: 'ex-1-plaza', title: '스카이트리타운 1F 광장 (야경 포토존)', jp: '東京スカイツリータウン 1F スカイアリーナ', time: '20:25 촬영', coords: [35.70955, 139.80985], color: '#d97706', query: '東京スカイツリータウン', desc: '전망대 하산 후 점등된 스카이트리와 크리스마스 일루미네이션 배경 가족사진 촬영' },
    { id: 'ex-1-2', title: '짓켄바시 (물 위의 스카이트리 야경)', jp: '十間橋 (逆さスカイツリー)', time: '20:30 (선택)', coords: [35.7093, 139.8178], color: '#7c3aed', query: '十間橋 東京', desc: '스카이트리에서 도보 10분 · 강물에 비친 데칼코마니 스카이트리 촬영 명소 (피곤 시 생략 가능)' }
  ],
  2: [
    { id: 'ex-2-1', title: '아사쿠사 나카미세 도리 & 센소지 본당', jp: '仲見世通り · 浅草寺', time: '09:15~11:00', coords: [35.7128, 139.7967], color: '#e11d48', query: '仲見世通り 浅草', desc: '전통 상점가 구경 (걸으며 먹기 삼가) 후 11시 이른 점심 식사' },
    { id: 'ex-2-2', title: '애니메이트 아키하바라', jp: 'アニメイト秋葉原', time: '14:30~16:00', coords: [35.7005, 139.7716], color: '#db2777', query: 'アニメイト秋葉原', desc: '주오도리 북쪽 캐릭터 굿즈 성지 · 부모님은 인근 카페 휴식 후 1층 입구 합류' },
    { id: 'ex-2-3', title: '마루노우치 나카도리 일루미네이션 (선택)', jp: '丸の内仲通り イルミネーション', time: '19:00~19:30 (선택)', coords: [35.6789, 139.7634], color: '#d97706', query: '丸の内仲通り', desc: '여력이 있을 때만 산책 후 오테마치역(Z08)에서 한조몬선으로 스이텐구마에역(Z10) 복귀' }
  ],
  3: [
    { id: 'ex-3-1', title: '소어링: 판타스틱 플라이트', jp: 'ソアリン：ファンタスティック・フライト', time: '09:05 탑승', coords: [35.6267, 139.8871], color: '#2563eb', query: 'ソアリン 東京ディズニーシー', desc: '입장 직후 오른쪽 오르막길로 이동해 스탠바이 탑승' },
    { id: 'ex-3-2', title: '센터 오브 디 어스', jp: 'センター・オブ・ジ・アース', time: '10:10 대기', coords: [35.6262, 139.8851], color: '#dc2626', query: 'センター・オブ・ジ・アース', desc: '대기 중 10시 이후 토이 스토리 매니아 DPA 추가 구매' },
    { id: 'ex-3-3', title: '아라비안 코스트 (점심 식사)', jp: 'アラビアンコースト', time: '13:00 점심', coords: [35.6269, 139.8819], color: '#d97706', query: 'アラビアンコースト 東京ディズニーシー', desc: '판타지 스프링스 관람 후 카스바 푸드코트 등에서 점심 및 휴식' },
    { id: 'ex-3-4', title: '레이징 스피릿 & 니모 시라이더', jp: 'レイジングスピリッツ · ニモ', time: '13:50~15:00', coords: [35.6281, 139.8825], color: '#059669', query: 'レイジングスピリッツ', desc: '시간 부족 시 니모 → 레이징 스피릿 순으로 생략하고 일렉트릭 레일웨이 탑승' },
    { id: 'ex-3-5', title: '타워 오브 테러', jp: 'タワー・オブ・テラー', time: '16:15 탑승', coords: [35.6242, 139.8862], color: '#7c3aed', query: 'タワー・オブ・テラー 東京ディズニーシー', desc: '15:30 토이 스토리 매니아(DPA) 탑승 직후 바로 옆 타워 오브 테러 이용' }
  ],
  4: []
};

export default function InteractiveMap({ dayData, completed, onSelectItem, selectedItemId }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const [tileStyle, setTileStyle] = useState('editorial'); // 'editorial' | 'vivid'
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: dayData.mapCenter || [35.6895, 139.6917],
        zoom: dayData.mapZoom || 13,
        zoomControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 일차별 마커 및 경로 폴리라인 렌더링
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group || !dayData) return;

    group.clearLayers();

    const validItems = dayData.items.filter(item => Array.isArray(item.coords));
    // 도쿄 도심 권역 내 좌표들(나리타/인천 제외)을 중심으로 초기 줌을 잡으면 도보·지하철 동선이 훨씬 잘 보임
    const centralTokyoItems = validItems.filter(
      item => item.coords[0] >= 35.55 && item.coords[0] <= 35.75 && item.coords[1] >= 139.65 && item.coords[1] <= 139.95
    );
    const polyCoords = centralTokyoItems.map(item => item.coords);

    if (polyCoords.length > 1) {
      // 외곽선 효과
      L.polyline(polyCoords, {
        color: '#ffffff',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(group);

      // 메인 경로선
      L.polyline(polyCoords, {
        color: '#133933',
        weight: 4,
        opacity: 0.95,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(group);
    }

    // 메인 일정 마커 추가
    validItems.forEach((item, idx) => {
      const isDone = !!completed[item.id];
      const isSelected = selectedItemId === item.id;
      const bgColor = isDone ? '#059669' : isSelected ? '#c38b3f' : '#133933';
      const ringClass = isSelected ? 'ring-4 ring-amber-400 scale-110' : 'ring-2 ring-white';

      const iconHtml = `
        <div class="relative flex items-center justify-center w-9 h-9 rounded-full text-white font-extrabold text-sm shadow-xl transition-transform ${ringClass}" style="background-color: ${bgColor};">
          <span>${idx + 1}</span>
          <div class="absolute -bottom-1.5 w-3 h-3 rotate-45" style="background-color: ${bgColor};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: iconHtml,
        iconSize: [36, 42],
        iconAnchor: [18, 40],
        popupAnchor: [0, -38],
      });

      const marker = L.marker(item.coords, { icon: customIcon }).addTo(group);

      const gmapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.placeQuery || item.title)}`;

      const popupContent = `
        <div class="min-w-[230px] max-w-[270px] text-stone-800">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-900 text-white">STEP ${idx + 1} · ${item.startTime}</span>
            <span class="text-[11px] text-stone-500 font-medium">${item.time}</span>
          </div>
          <h4 class="font-bold text-sm text-stone-900 mt-1">${item.title}</h4>
          ${item.jpTitle ? `<p class="text-[11px] text-stone-500 mt-0.5">${item.jpTitle}</p>` : ''}
          <p class="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">${item.bullets?.[0] || item.detail}</p>
          <div class="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
            <span class="text-[11px] font-semibold text-emerald-800">${item.locationLabel || ''}</span>
            <a href="${gmapUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 text-white text-[11px] font-semibold hover:bg-emerald-800 transition-colors">
              Google 지도 ↗
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectItem) onSelectItem(item.id);
      });

      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 150);
      }
    });

    // 보조 세부 랜드마크 스팟 마커 추가
    const extraSpots = EXTRA_SPOTS_BY_DAY[dayData.id] || [];
    extraSpots.forEach((spot) => {
      const spotHtml = `
        <div class="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shadow-md ring-2 ring-white" style="background-color: ${spot.color};">
          ★
        </div>
      `;
      const spotIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: spotHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const gmapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.query)}`;
      const marker = L.marker(spot.coords, { icon: spotIcon }).addTo(group);
      marker.bindPopup(`
        <div class="min-w-[210px] max-w-[250px] text-stone-800">
          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full text-white" style="background-color: ${spot.color};">핵심 포인트 · ${spot.time}</span>
          <h4 class="font-bold text-sm text-stone-900 mt-1.5">${spot.title}</h4>
          <p class="text-[11px] text-stone-500">${spot.jp}</p>
          <p class="text-xs text-stone-600 mt-1.5 leading-relaxed">${spot.desc}</p>
          <div class="mt-2.5 pt-2 border-t border-stone-100 flex justify-end">
            <a href="${gmapUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 text-white text-[11px] font-semibold">
              Google 지도 ↗
            </a>
          </div>
        </div>
      `);
    });

    // 선택된 아이템이 있으면 해당 위치로 부드럽게 이동
    if (selectedItemId) {
      const target = validItems.find(i => i.id === selectedItemId);
      if (target && target.coords) {
        map.flyTo(target.coords, 15, { duration: 0.8 });
        return;
      }
    }

    if (polyCoords.length > 0) {
      const bounds = L.latLngBounds(polyCoords);
      extraSpots.forEach(s => {
        if (s.coords[0] >= 35.55 && s.coords[0] <= 35.75 && s.coords[1] >= 139.65 && s.coords[1] <= 139.95) {
          bounds.extend(s.coords);
        }
      });
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    } else if (dayData.mapCenter) {
      map.setView(dayData.mapCenter, dayData.mapZoom || 12);
    }
  }, [dayData, completed, selectedItemId]);

  const handleFitTokyo = () => {
    const map = mapInstanceRef.current;
    if (!map || !dayData) return;
    const centralTokyoItems = dayData.items.filter(
      item => Array.isArray(item.coords) && item.coords[0] >= 35.55 && item.coords[0] <= 35.75 && item.coords[1] >= 139.65 && item.coords[1] <= 139.95
    );
    if (centralTokyoItems.length > 0) {
      const bounds = L.latLngBounds(centralTokyoItems.map(i => i.coords));
      map.flyToBounds(bounds, { padding: [45, 45], maxZoom: 15, duration: 0.8 });
    } else {
      map.flyTo(dayData.mapCenter || [35.6895, 139.6917], dayData.mapZoom || 11);
    }
  };

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저에서는 GPS 위치 기능을 지원하지 않습니다.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = [pos.coords.latitude, pos.coords.longitude];
        const map = mapInstanceRef.current;
        const group = layerGroupRef.current;
        if (map && group) {
          const userIcon = L.divIcon({
            className: 'custom-leaflet-pin',
            html: `<div class="w-5 h-5 rounded-full bg-blue-600 ring-4 ring-blue-400/60 animate-pulse shadow-lg"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          L.marker(coords, { icon: userIcon })
            .addTo(group)
            .bindPopup('<b>현재 내 위치 (GPS)</b>')
            .openPopup();
          map.flyTo(coords, 15, { duration: 1 });
        }
      },
      () => {
        setLocating(false);
        alert('현재 위치를 가져올 수 없습니다. 위치 권한을 확인해 주세요.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-stone-200/80 dark:border-stone-800 shadow-sm bg-stone-100 dark:bg-stone-900">
      {/* 상단 플로팅 컨트롤 헤더 */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md border border-stone-200/70 dark:border-stone-700">
          <Compass className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span className="text-xs font-bold text-stone-800 dark:text-stone-100">
            DAY {dayData.id} 실시간 동선 맵
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTileStyle(prev => prev === 'editorial' ? 'vivid' : 'editorial')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md border border-stone-200/70 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 transition"
            title="지도 색감 전환"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{tileStyle === 'editorial' ? '웜톤 에디토리얼' : '선명한 표준'}</span>
          </button>

          <button
            type="button"
            onClick={handleFitTokyo}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md border border-stone-200/70 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 transition"
            title="오늘의 도쿄 동선 전체 보기"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>동선 맞춤</span>
          </button>

          <button
            type="button"
            onClick={handleFindMyLocation}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-800 text-white shadow-md text-xs font-semibold hover:bg-emerald-700 transition"
            title="현지에서 내 GPS 위치 표시"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{locating ? '확인 중…' : '내 위치'}</span>
          </button>
        </div>
      </div>

      {/* Leaflet 지도 캔버스 */}
      <div
        ref={mapContainerRef}
        className={`w-full h-[380px] sm:h-[430px] transition-all ${
          tileStyle === 'editorial' ? 'saturate-[0.82] contrast-[1.03] sepia-[0.06]' : ''
        }`}
      />

      {/* 하단 스팟 퀵 점프 바 */}
      <div className="px-3 py-2.5 bg-white dark:bg-stone-900 border-t border-stone-200/70 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[11px] font-bold text-stone-400 shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          빠른 이동:
        </span>
        {dayData.items.map((item, idx) => {
          const isSelected = selectedItemId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectItem && onSelectItem(item.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/15 text-[10px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <span>{item.locationLabel || item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
