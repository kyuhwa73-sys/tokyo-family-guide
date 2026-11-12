'use strict';
(() => {
  const trip = window.TRIP_DATA;
  const $ = (s) => document.querySelector(s);
  const escape = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths = {
    calendar:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Zm2 10h3m4 0h3m-10 4h3',
    map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',
    bag:'M5 7h14l1 14H4L5 7Zm3 0V6a4 4 0 0 1 8 0v1m-8 4v1m8-1v1',
    book:'M12 5v16m0-16C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 1Z',
    search:'m16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
    pencil:'m15 3 6 6M3 21l5-1L21 7l-5-5L3 15v6Z',
    close:'m6 6 12 12M6 18 18 6',
    arrow:'M5 12h14m-6-6 6 6-6 6',
    check:'m5 12 4 4L20 5',
    pin:'M12 22s8-8 8-14a8 8 0 1 0-16 0c0 6 8 14 8 14Zm3-14a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    clock:'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.pin}"/></svg>`;
  document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
  const maps = [
    {id:1,day:1,title:'1일차 전체 동선',subtitle:'나리타 도착 · 소라마치 · 스카이트리 야경',type:'전체 동선'},
    {id:2,day:1,title:'1일차 걷는 구간',subtitle:'소라마치 · 스카이트리 · 짓켄바시 · 숙소 주변',type:'상세 지도'},
    {id:3,day:2,title:'2일차 전체 동선',subtitle:'아사쿠사 · 아키하바라 · 긴자 야경',type:'전체 동선'},
    {id:4,day:2,title:'2일차 걷는 구간',subtitle:'아사쿠사 · 아키하바라 · 긴자 상세',type:'상세 지도'},
    {id:5,day:3,title:'3일차 가는 길과 하루 계획',subtitle:'숙소에서 디즈니씨까지 · 시간대별 파크 계획',type:'이동 · 계획'},
    {id:6,day:3,title:'3일차 디즈니씨 동선',subtitle:'어트랙션 · 휴식 · 합류 장소를 담은 파크 약도',type:'파크 약도'}
  ];
  const categories = {transport:'이동',shopping:'쇼핑',food:'식사',sightseeing:'산책 · 관광',stay:'숙소 · 휴식',themepark:'디즈니씨'};
  const dayNames = ['첫 만남, 도쿄','골목에서 도시로','모험이 시작되는 날','또 만나, 도쿄'];
  let storageAvailable = true;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('tokyo-trip-journal-v1') || '{}'); } catch { storageAvailable = false; }
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  const objectOrEmpty = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  const state = {day:1,view:'schedule',query:'',completed:objectOrEmpty(saved.completed),checks:objectOrEmpty(saved.checks),notes:objectOrEmpty(saved.notes)};
  let activeMap = null, zoom = 100, toastTimeout, noteTimeout;
  let serviceWorkerRegistration;
  const persist = () => {
    try {localStorage.setItem('tokyo-trip-journal-v1',JSON.stringify({completed:state.completed,checks:state.checks,notes:state.notes}));return true;}
    catch { storageAvailable=false; toast('브라우저 저장 공간을 사용할 수 없어 이번 화면에서만 기록됩니다.');return false; }
  };
  function toast(message) { $('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('visible'),3600); }
  const currentDay = () => trip.days.find(d=>d.id===state.day);
  const mapsForDay = () => maps.filter(m=>m.day===state.day);
  const mapLink = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const doneCount = day => day.items.filter(item=>state.completed[item.id]).length;
  function renderTabs() {
    $('#day-tabs').innerHTML = trip.days.map(d=>`<button id="tab-day-${d.id}" role="tab" aria-selected="${state.day===d.id}" tabindex="${state.day===d.id?0:-1}" class="day-tab ${state.day===d.id?'selected':''}" data-day="${d.id}" title="${escape(d.label)}"><span class="day-number">DAY ${String(d.number).padStart(2,'0')}</span><span class="day-date">${escape(d.date.slice(5).replace('-','.'))} ${['일','월','화','수'][d.id-1]}</span><span class="day-name">${dayNames[d.id-1]}</span></button>`).join('');
  }
  function itemCard(item,day) {
    const done = !!state.completed[item.id];
    return `<article class="timeline-item ${done?'is-done':''}" id="item-${item.id}"><div class="timeline-time">${escape(item.startTime)}<small>– ${escape(item.endTime)}</small></div><span class="timeline-dot" aria-hidden="true"></span><div class="itinerary-card"><div class="card-heading"><span class="category-tag category-${escape(item.category)}">${categories[item.category]||'일정'}</span><button class="check-button ${done?'checked':''}" data-complete="${item.id}" aria-pressed="${done}" aria-label="${escape(item.title)} ${done?'완료 취소':'완료 표시'}">${icon(done?'check':'')}<span>${done?'완료':'방문 체크'}</span></button></div><h3 class="item-title">${escape(item.title)}</h3><ul class="item-bullets">${(item.bullets||[item.detail]).map(b=>`<li>${escape(b)}</li>`).join('')}</ul><div class="card-footer"><span>${icon('clock')}${escape(item.time)}</span>${item.placeQuery?`<a class="map-link" href="${escape(mapLink(item.placeQuery))}" target="_blank" rel="noopener noreferrer">${icon('pin')}장소 검색 ↗</a>`:''}</div></div></article>`;
  }
  function renderSchedule() {
    const d = currentDay(); const count=doneCount(d); const q=state.query.trim().toLocaleLowerCase();
    $('#day-summary').innerHTML = `<div class="day-overview"><div><span class="day-kicker">DAY ${String(d.id).padStart(2,'0')} · ${escape(d.label)}</span><h3 class="day-title">${escape(d.title)}</h3><p class="day-route">${escape(d.summary)}</p></div><span class="progress-pill">${count} / ${d.items.length} 완료</span></div>`;
    if(q) {
      const matches=trip.days.flatMap(day=>day.items.filter(i=>`${i.title} ${i.detail} ${i.time}`.toLocaleLowerCase().includes(q)).map(i=>({item:i,day})));
      $('#search-context').innerHTML=`<p class="search-result-heading">전체 4일 일정에서 <b>${matches.length}개</b>를 찾았어요. <button class="text-button" data-clear-search>검색 지우기</button></p>`;
      $('#itinerary').innerHTML=matches.length?matches.map(({item,day})=>`<button class="search-day-label" data-open-item="${item.id}" data-target-day="${day.id}">DAY ${day.id} · ${escape(day.label)} 일정으로 이동 ${icon('arrow')}</button>${itemCard(item,day)}`).join(''):`<div class="empty-state">${icon('search')}<h3>검색 결과가 없어요</h3><p>장소 이름이나 이동편을 짧게 입력해 보세요.</p></div>`;
    } else {$('#search-context').textContent='';$('#itinerary').innerHTML=`<div class="timeline">${d.items.map(i=>itemCard(i,d)).join('')}</div>`;}
    $('#day-note').value=typeof state.notes[d.id]==='string'?state.notes[d.id]:'';
    $('#note-status').textContent=storageAvailable?'이 기기에 자동 저장':'이번 화면에서만 저장';
    renderRouteSidebar();
  }
  function mapPreview(m,extraClass='') {return `<button class="map-preview ${extraClass}" data-map="${m.id}" aria-label="${escape(m.title)} 원본 확대"><img src="assets/route-${m.id}.png" alt="${escape(m.title)}: ${escape(m.subtitle)}" loading="lazy"><span class="expand-map">${icon('search')}원본 확대</span></button>`;}
  function renderRouteSidebar() {
    const d=currentDay(), dayMaps=mapsForDay(), count=doneCount(d), next=d.items.find(i=>!state.completed[i.id]);
    $('#route-sidebar').innerHTML=`<section class="route-card"><div class="route-card-heading"><h3>${icon('map')}오늘의 동선지도</h3><span>DAY ${String(d.id).padStart(2,'0')}</span></div>${dayMaps.length?`${mapPreview(dayMaps[0])}<div class="map-caption"><b>${escape(dayMaps[0].title)}</b><span>기존 동선지도 그대로 · 누르면 크게 보기</span></div><div class="map-switch">${dayMaps.map(m=>`<button data-map="${m.id}">${m.type} ${icon('arrow')}</button>`).join('')}</div>`:`<div class="empty-state compact">${icon('bag')}<h4>집으로 돌아가는 날</h4><p>4일차는 원본 동선지도가 없습니다.<br>왼쪽 귀국 일정을 따라 확인해 주세요.</p></div>`}</section><section class="progress-card"><span class="eyebrow">ONE STEP AT A TIME</span><h3>오늘도, 한 걸음씩</h3><div class="progress-label"><span>오늘의 일정</span><b>${count}<small> / ${d.items.length}</small></b></div><div class="progress-track"><div class="progress-fill" style="width:${count/d.items.length*100}%"></div></div><p class="next-place"><span>${next?'다음 미완료 일정':'모든 일정을 확인했어요'}</span><b>${next?escape(next.title):'오늘의 추억을 메모로 남겨보세요.'}</b></p></section>${trip.notes.filter(n=>n.day===d.id).map(n=>`<div class="travel-note"><span class="eyebrow">TRAVEL NOTE · 원문 기준</span><h4>${escape(n.title)}</h4><p>${escape(n.text)}</p></div>`).join('')}<p class="day-notice">요금·운영시간·휴장 안내는 원문 기준입니다. 장소 검색은 Google 지도로 연결됩니다.</p>`;
  }
  function renderMaps() {
    const dayMaps=mapsForDay();
    $('#maps-view').innerHTML=`<div class="view-intro"><div><span class="eyebrow">SAVED ROUTES, READY TO GO</span><h3>${state.day}일차 동선지도</h3><p>작성해 둔 원본 지도에서 길과 순서를 확인하세요.</p></div><span class="count-label">${dayMaps.length}개의 원본</span></div>${dayMaps.length?`<div class="map-gallery">${dayMaps.map(m=>`<article class="map-tile"><div class="map-tile-image">${mapPreview(m)}</div><div class="map-tile-body"><span class="eyebrow">DAY ${m.day} · ${m.type}</span><h3>${escape(m.title)}</h3><p>${escape(m.subtitle)}</p><button data-map="${m.id}" class="primary-button">원본 크게 보기 ${icon('arrow')}</button><a href="assets/route-${m.id}.png" download="${escape(m.title)}.png" class="text-button">지도 저장 ↓</a></div></article>`).join('')}</div>`:`<div class="empty-state">${icon('map')}<h3>4일차는 원본 동선지도가 없습니다</h3><p>공항 이동부터 귀가까지는 일정 화면에서 확인할 수 있어요.</p><button data-view="schedule" class="primary-button">귀국 일정 보기 ${icon('arrow')}</button></div>`}<p class="day-notice">6장의 지도는 제공된 원본 이미지입니다. 디즈니씨 지도는 실제 거리·모양과 다른 약도이며 현장 세부 길은 공식 앱·표지판을 확인하세요. 운영시간·요금 안내는 원문 기준입니다.</p>`;
  }
  function renderPrepare() {
    const checked=trip.checklist.filter(c=>state.checks[c.id]).length;
    $('#prepare-view').innerHTML=`<div class="view-intro"><div><span class="eyebrow">BEFORE WE GO</span><h3>가볍게 떠나기 위한 준비</h3><p>기존 일정에서 챙길 일을 모았어요. 체크 내용은 이 기기에 저장됩니다.</p></div><span class="progress-pill">${checked} / ${trip.checklist.length} 준비 완료</span></div><div class="prep-layout"><section class="prep-card"><div class="section-label">${icon('bag')}<h3>여행 체크리스트</h3></div><div class="checklist">${trip.checklist.map(c=>`<label class="check-row ${state.checks[c.id]?'is-done':''}"><input type="checkbox" class="prep-check" data-check="${c.id}" ${state.checks[c.id]?'checked':''}><span>${escape(c.label)}<small>DAY ${c.day} 일정 기준</small></span></label>`).join('')}</div></section><div><section class="prep-card"><span class="eyebrow">GOOD TO KNOW</span><h3>가족 여행의 작은 약속</h3><p>일정이 늦어지거나 피곤해질 때를 위한 원문의 대안이에요.</p>${trip.notes.map(n=>`<div class="travel-note"><span class="eyebrow">DAY ${n.day} · 원문 기준</span><h4>${escape(n.title)}</h4><p>${escape(n.text)}</p></div>`).join('')}</section><section class="prep-card offline-card"><span class="eyebrow">KEEP IT WITH YOU</span><h3>인터넷 없이도 펼쳐보기</h3><p>오프라인 저장을 누르면 일정과 원본 지도 6장을 이 브라우저에 내려받습니다. 장소 검색에는 인터넷이 필요해요.</p><button class="primary-button" data-offline>${icon('download')}오프라인용 전체 저장</button><p class="day-notice">기록은 기기별로 저장되며 자동 동기화되지 않습니다. 브라우저 데이터를 지우면 기록도 삭제됩니다. 홈 화면 추가는 브라우저 메뉴를 이용하세요.</p></section></div></div>`;
  }
  function renderOriginal() {
    $('#original-view').innerHTML=`<div class="original-intro"><div><span class="eyebrow">THE ORIGINAL TRAVEL PLAN</span><h3>작성한 일정, 그대로</h3><p>아래는 제공된 Word 문서의 전체 원문입니다. 앱의 일정과 준비 목록도 이 문서를 바탕으로 구성했습니다.</p></div><a class="primary-button" href="assets/${encodeURIComponent(trip.sourceFile)}" download="${escape(trip.sourceFile)}">${icon('download')}원본 문서 다운로드</a></div><p class="day-notice">${escape(trip.sourceNotice||'요금·운영시간·휴장·면세 안내는 원문 작성 기준이며 최신 정보가 아닐 수 있습니다.')}</p><article class="original-paper">${trip.rawParagraphs.map((p,i)=>`<p class="original-paragraph ${p.startsWith('■')?'original-day':p.startsWith('□')?'original-section':i===0?'original-title':''}">${escape(p)}</p>`).join('')}</article>`;
  }
  function setHash(){const hash=state.view==='schedule'?`day-${state.day}`:`${state.view}-day-${state.day}`;history.replaceState(null,'',`#${hash}`);}
  function render() {
    renderTabs();
    document.querySelectorAll('[data-view]').forEach(el=>{const active=el.dataset.view===state.view;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    const heading={schedule:['FOUR DAYS, A THOUSAND MEMORIES','우리의 도쿄 여행','설레는 첫 도착부터, 아쉬운 마지막 인사까지.'],maps:['OUR ORIGINAL ROUTE MAPS','길 위에서 만나는 도쿄','익숙한 지도를 펼치고, 다음 목적지로.'],prepare:['A LITTLE PREPARATION','여행을 준비하는 마음','하나씩 챙기면, 떠나는 마음도 가벼워져요.'],original:['OUR TRAVEL NOTEBOOK','처음 적어 둔 여행 계획','원래 작성한 일정의 모든 내용을 한곳에.']}[state.view];
    ['#page-eyebrow','#page-title','#page-description'].forEach((s,i)=>$(s).textContent=heading[i]);
    $('#day-tabs').hidden=!['schedule','maps'].includes(state.view);
    ['schedule','maps','prepare','original'].forEach(v=>$(`#${v}-view`).hidden=v!==state.view);
    if(state.view==='schedule')renderSchedule();if(state.view==='maps')renderMaps();if(state.view==='prepare')renderPrepare();if(state.view==='original')renderOriginal();setHash();
  }
  function navigate(view,day=state.day) {state.view=view;state.day=day;state.query='';$('#search').value='';render();window.scrollTo({top:0,behavior:'instant'});}
  function openMap(id) {activeMap=maps.find(m=>m.id===id);if(!activeMap)return;zoom=100;$('#map-dialog-title').textContent=activeMap.title;$('#large-map').src=`assets/route-${id}.png`;$('#large-map').alt=`${activeMap.title}: ${activeMap.subtitle}`;$('#download-map').href=`assets/route-${id}.png`;$('#download-map').download=`${activeMap.title}.png`;setZoom(100);$('#map-dialog').showModal();document.body.classList.add('dialog-open');}
  function setZoom(value){zoom=Math.max(50,Math.min(250,value));$('#large-map').style.width=`${zoom}%`;$('#zoom-value').textContent=`${zoom}%`;$('#zoom-out').disabled=zoom===50;$('#zoom-in').disabled=zoom===250;}
  $('#close-map').addEventListener('click',()=>$('#map-dialog').close());
  $('#map-dialog').addEventListener('close',()=>document.body.classList.remove('dialog-open'));
  $('#map-dialog').addEventListener('click',e=>{if(e.target===$('#map-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  $('#zoom-in').addEventListener('click',()=>setZoom(zoom+25));$('#zoom-out').addEventListener('click',()=>setZoom(zoom-25));$('#zoom-reset').addEventListener('click',()=>setZoom(100));
  document.addEventListener('click',e=>{
    const view=e.target.closest('[data-view]');if(view){navigate(view.dataset.view);return;}
    const day=e.target.closest('[data-day]');if(day){navigate(state.view,Number(day.dataset.day));return;}
    const map=e.target.closest('[data-map]');if(map){openMap(Number(map.dataset.map));return;}
    const complete=e.target.closest('[data-complete]');if(complete){const id=complete.dataset.complete;state.completed[id]=!state.completed[id];persist();const scroll=window.scrollY;renderSchedule();window.scrollTo(0,scroll);return;}
    const result=e.target.closest('[data-open-item]');if(result){navigate('schedule',Number(result.dataset.targetDay));document.getElementById(`item-${result.dataset.openItem}`)?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    if(e.target.closest('[data-clear-search]')){state.query='';$('#search').value='';renderSchedule();$('#search').focus();}
    if(e.target.closest('[data-offline]'))saveOffline();
  });
  document.addEventListener('change',e=>{if(e.target.matches('[data-check]')){state.checks[e.target.dataset.check]=e.target.checked;persist();renderPrepare();}});
  $('#search').addEventListener('input',e=>{state.query=e.target.value;renderSchedule();});
  $('#day-note').addEventListener('input',e=>{state.notes[state.day]=e.target.value;$('#note-status').textContent=persist()?'저장했어요':'이번 화면에서만 저장';clearTimeout(noteTimeout);noteTimeout=setTimeout(()=>$('#note-status').textContent=storageAvailable?'이 기기에 자동 저장':'이번 화면에서만 저장',1800);});
  $('#day-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?1:e.key==='End'?4:((state.day-1+(e.key==='ArrowRight'?1:3))%4)+1;navigate(state.view,next);$(`#tab-day-${next}`).focus();});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(e.target.tagName)&&!$('#map-dialog').open){e.preventDefault();if(state.view!=='schedule')navigate('schedule');$('#search').focus();}});
  function parseHash(){const m=location.hash.match(/^#(?:(maps|prepare|original)-)?day-([1-4])$/);if(m){state.view=m[1]||'schedule';state.day=Number(m[2]);}}
  window.addEventListener('hashchange',()=>{parseHash();state.query='';$('#search').value='';render();});
  function updateConnection(){$('#connection').textContent=navigator.onLine?'온라인':'오프라인';$('#connection').classList.toggle('is-offline',!navigator.onLine);}
  window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);updateConnection();
  async function saveOffline(){
    if(!('serviceWorker' in navigator)||location.protocol==='file:'){toast('오프라인 저장은 앱의 웹 주소에서 사용할 수 있어요.');return;}
    const button=$('#offline-button');button.disabled=true;button.innerHTML=`${icon('download')}<span>저장 중…</span>`;
    try {
      const reg=await serviceWorkerRegistration;if(!reg)throw new Error('Registration failed');await navigator.serviceWorker.ready;
      const worker=reg?.active||reg?.waiting||reg?.installing;if(!worker)throw new Error('No worker');
      await new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>reject(new Error('Timeout')),90000);channel.port1.onmessage=e=>{clearTimeout(timer);e.data.ok?resolve():reject(new Error('Cache failed'));};worker.postMessage({type:'CACHE_TRIP'},[channel.port2]);});
      button.innerHTML=`${icon('check')}<span>오프라인 저장 완료</span>`;toast('일정과 원본 지도 6장을 저장했어요. 같은 브라우저에서 오프라인으로 열 수 있어요.');
    }catch{button.innerHTML=`${icon('download')}<span>오프라인 저장</span>`;toast('전체 저장을 마치지 못했어요. 인터넷 연결과 저장 공간을 확인한 뒤 다시 눌러 주세요.');}finally{button.disabled=false;}
  }
  if('serviceWorker' in navigator&&location.protocol!=='file:')serviceWorkerRegistration=navigator.serviceWorker.register('sw.js').catch(()=>null);
  $('#offline-button').addEventListener('click',saveOffline);
  parseHash();render();
  if(!storageAvailable)toast('브라우저 저장 기능을 사용할 수 없어 기록이 이번 화면에서만 유지됩니다.');
})();
