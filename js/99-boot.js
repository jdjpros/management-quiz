// ═══════════════════════════════════════════
// 99-boot.js — 앱 부트스트랩 (반드시 마지막에 로드!)
// 모든 함수 정의가 끝난 뒤 실행돼야 하는 시작 코드 전용.
// 여기 있는 코드는 로드 시점에 즉시 실행되므로, 다른 js 파일의
// 어떤 함수든 안전하게 호출할 수 있음 (행정법 앱과 동일 구조).
// ═══════════════════════════════════════════

// iOS Safari 주소창 높이 변동 대응 - visualViewport 우선, fallback innerHeight
(function setAppHeight(){
  function update(){
    // visualViewport: iOS Safari 주소창 슬라이드 시 실제 보이는 높이를 정확히 반영
    var h = (window.visualViewport ? window.visualViewport.height : window.innerHeight);
    document.documentElement.style.setProperty('--app-height', h + 'px');
  }
  update();
  // visualViewport resize: iOS Safari 주소창 나타남/사라짐 시 즉시 반응
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
  }
  // 일반 resize (데스크탑·안드로이드 대응)
  window.addEventListener('resize', update);
  // 화면 회전: iOS는 회전 완료까지 시간이 필요해 딜레이를 넉넉히 줌
  window.addEventListener('orientationchange', function(){
    setTimeout(update, 100);
    setTimeout(update, 450); // 회전 애니메이션 완료 후 한 번 더
  });
})();

loadState();
migrateReviewFlags();
cleanOldRvKeys();   // 3일 이상 된 임시 판정 키 자동 정리
// 저장된 플랜에서 범위 설정 즉시 복원 (Firebase 로드 전에도 동작)
(function restorePlanScope(){
  try{
    var saved = JSON.parse(localStorage.getItem(getPlanKey())||'null');
    if(saved && saved.scopeMode){
      planScopeMode = saved.scopeMode;
      planScopeIds  = saved.scopeIds || [];
    }
  }catch(e){}
})();
renderTabs();
renderAll();
updateProg();
updateTodayUI();
renderTodayBanner();
checkNewDesignToast();
showMigrationWizard();

// 플랜이 활성 상태면 앱 로드 시 오늘 배너 위치로 자동 스크롤
(function autoScrollToBanner(){
  try{
    var tp = getTodayPlan ? getTodayPlan() : null;
    if(tp && tp.status==='active'){
      setTimeout(function(){
        var banner = document.getElementById('todayPlanBanner');
        if(banner && banner.offsetParent !== null){
          banner.scrollIntoView({ behavior:'smooth', block:'start' });
        }
      }, 300);
    }
  }catch(e){}
})();

// Firebase SDK는 <head>의 <script> 태그로 동기 로드됨
initFirebase();
// 10초 후에도 버튼이 비활성 상태면 게스트 모드로 강제 전환
setTimeout(function(){
  if(!firebaseReady){
    console.warn('[동기화] 10초 내 Firebase 초기화 실패 - 게스트 모드 전환');
    showGuestUI();
  }
}, 10000);
// ⑦ 뒤로가기 버튼 → 이전 모드로 복원 (창 종료 방지)
(function(){
  var _popHandling = false;
  var _initialized = false;

  history.replaceState({mode:'dash'}, '');

  window.addEventListener('popstate', function(e){
    var m = (e.state && e.state.mode) ? e.state.mode : 'dash';
    _popHandling = true;
    setMode(m); // setMode 내부에서 해당 모드 렌더까지 수행 (중복 renderAll 제거)
    _popHandling = false;
  });

  var _origSetMode = setMode;
  setMode = function(m){
    _origSetMode(m);
    if(!_popHandling){
      if(!_initialized){ history.replaceState({mode:m}, ''); _initialized=true; }
      else { history.pushState({mode:m}, ''); }
    }
  };
})();

setTimeout(function(){
  setMode('dash');
  setTimeout(renderRatioAlert, 300);
}, 50);

setTimeout(function(){
  if(!loadPlan()){
    var checkLogin = setInterval(function(){
      var lo = document.getElementById('loginOverlay');
      if(!lo || lo.style.display==='none'){
        clearInterval(checkLogin);
        setTimeout(function(){ if(!loadPlan()) openPlanOverlay(); }, 2000);
      }
    }, 500);
  }
},100);
