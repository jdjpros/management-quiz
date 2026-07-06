// ═══════════════════════════════════════════
// 01-core-firebase.js — 전역 변수 · Firebase 초기화/인증/동기화 · 로그인 UI · 마이그레이션
// (index.html에서 분리 — 로드 순서 유지 필수)
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// 문제 데이터 (Firebase에서 로드 — management_data.js 대체)
// ═══════════════════════════════════════════
var MENU = [], O_TYPE = new Set(), Q_EXPS_BOX = new Set(), Q_OPTS_BOX = new Set(), Q3_TYPE = new Set();
var NUMS = ['①','②','③','④','⑤'];
var _questionsLoaded = false;

// ═══════════════════════════════════════════
// 상태 변수
// ═══════════════════════════════════════════
var SK = 'management_v1';
var state = {}, mode = 'all';
var curParent = 'A', curMid = 'AA', curSubId = null;
var masteryFilter = null, searchQuery = '';

// ── Firebase 설정 ──────────────────────────────────────
// 👇 아래 firebaseConfig를 본인의 Firebase 프로젝트 설정으로 교체하세요
var firebaseConfig = {
  apiKey: "AIzaSyD-3sWgOb430MidgXeEGLDTYAU4c7pb3Fc",
  authDomain: "management-quiz-5bd98.firebaseapp.com",
  databaseURL: "https://management-quiz-5bd98-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "management-quiz-5bd98",
  storageBucket: "management-quiz-5bd98.firebasestorage.app",
  messagingSenderId: "674777478488",
  appId: "1:674777478488:web:dae5a7dd2ee927521a612d"
};
var fbApp = null, fbDb = null, fbAuth = null;
var currentUser = null;
var syncCode = null;
var firebaseReady = false;
var autoSyncTimer = null;
var _cloudWriting = false; // pushToCloud 중복 실행 방지 플래그
var _cloudLoaded  = false; // 초기 클라우드 로드 완료 전 자동 push 금지 (낡은 로컬로 클라우드 덮어쓰기 방지)

// ── 동기화 메타 (누가/언제 마지막으로 썼는지 — 타 기기 변경 감지용) ──
function _getDeviceId(){
  var id = localStorage.getItem('_device_id');
  if(!id){
    id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    try{ localStorage.setItem('_device_id', id); }catch(e){}
  }
  return id;
}
function _metaTuple(meta){ return meta ? String(meta.updatedAt||'') + '|' + (meta.device||'') : ''; }
function _recordCloudMetaSeen(uid, meta){ try{ localStorage.setItem('cloud_meta_seen_'+uid, _metaTuple(meta)); }catch(e){} }
// 마지막으로 본 클라우드 버전과 다르면 = 다른 기기(또는 이 기기의 다른 세션)가 그 사이에 씀
function _cloudChangedSinceSeen(uid, cloudMeta){
  if(!cloudMeta) return false; // meta 없는 레거시 데이터 → 판단 불가, 기존 동작 유지
  return _metaTuple(cloudMeta) !== (localStorage.getItem('cloud_meta_seen_'+uid) || '');
}

function initFirebase() {
  if(firebaseConfig.apiKey === 'YOUR_API_KEY') { showGuestUI(); return; }
  if(window._fbErr || typeof firebase === 'undefined') { showGuestUI(); return; }
  try {
    initFirebaseCore();
  } catch(e) {
    console.warn('[동기화] Firebase 초기화 오류:', e.message);
    showGuestUI();
  }
}

function initFirebaseCore() {
  try {
    if(firebase.apps && firebase.apps.length > 0) {
      fbApp = firebase.apps[0];
    } else {
      fbApp = firebase.initializeApp(firebaseConfig);
    }
    fbDb = firebase.database();
    fbAuth = firebase.auth();
    firebaseReady = true;
    _enableGoogleLoginBtn();
    // 삼성 브라우저/태블릿 리다이렉트 결과 처리
    handleRedirectResult();

    // 로그인 상태 감지 - 자동으로 처리
    fbAuth.onAuthStateChanged(function(user) {
      if(user) {
        // 로그인됨 → 문제 데이터 로드 후 앱 시작
        currentUser = user;
        showUserUI(user);
        // 로그인 오버레이를 로딩 메시지로 교체
        var loginBox = document.querySelector('.login-box');
        if(loginBox) loginBox.innerHTML =
          '<div style="text-align:center;padding:40px 0;">'
          + '<div style="font-size:36px;margin-bottom:14px;">⏳</div>'
          + '<p style="color:#7dd3fc;font-size:16px;margin:0;font-weight:600;">문제 데이터 로딩 중...</p>'
          + '<p style="color:#64748b;font-size:13px;margin-top:8px;">잠시만 기다려 주세요</p>'
          + '</div>';
        // 로그인 즉시 프로필 저장 (관리자 페이지용)
        fbDb.ref('users/' + user.uid + '/profile').set({
          email:       user.email       || '',
          displayName: user.displayName || '',
          lastActive:  new Date().toISOString().slice(0,10)
        }).catch(function(){});
        _loadQuestionsFromFirebase(function(){
          hideLoginOverlay();
          loadCloudState(user.uid);
          updateAdminUI();
          loadAndMergeCustomQuestions();
        });
        // 안전장치: 8초 후에도 loginOverlay가 살아있으면 강제 해제 (캐시/렌더링 버그 대응)
        setTimeout(function(){
          var _lo = document.getElementById('loginOverlay');
          if(_lo && _lo.style.display !== 'none'){ _lo.style.display = 'none'; }
        }, 8000);
      } else {
        // 로그아웃 상태
        currentUser = null;
        updateAdminUI();
        var skipped = localStorage.getItem('login_skipped');
        if(skipped) {
          showGuestUI();
        } else {
          showLoginOverlay();
        }
      }
    });
  } catch(e) {
    console.warn('[동기화] Firebase 초기화 실패:', e.message);
    showGuestUI();
  }
}

// ── 로그인 UI 제어 ─────────────────────────────────────
// 인앱 브라우저 감지
function isInAppBrowser(){
  var ua = navigator.userAgent || '';
  return /KAKAOTALK|NAVER|Instagram|FB_IAB|FBAN|FBAV|Line\/|MicroMessenger|Snapchat/i.test(ua);
}

function copyPageUrl(){
  var url = location.href;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){
      _showCopyToast('✅ 주소 복사 완료! Chrome / Safari 주소창에 붙여넣기 해주세요.');
    }).catch(function(){ _showCopyFallback(url); });
  } else {
    _showCopyFallback(url);
  }
}

function _showCopyToast(msg){
  var t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);'
    + 'background:#1e2540;color:#fff;padding:11px 20px;border-radius:10px;'
    + 'font-size:13px;font-family:Pretendard,sans-serif;z-index:999999;'
    + 'white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.35);';
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3000);
}

/* 클립보드 API 실패 → readonly input 오버레이: 탭하면 전체 선택돼 복사 가능 */
function _showCopyFallback(url){
  var prev = document.getElementById('_copyFallbackBox');
  if(prev) prev.remove();

  var ov = document.createElement('div');
  ov.id = '_copyFallbackBox';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);'
    + 'display:flex;align-items:center;justify-content:center;'
    + 'z-index:999999;padding:20px;';

  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:14px;padding:22px 18px;'
    + 'width:100%;max-width:400px;box-shadow:0 12px 40px rgba(0,0,0,.3);';

  box.innerHTML = '<p style="font-weight:700;font-size:14px;color:#1a1f36;margin-bottom:6px;">📋 주소를 직접 복사해 주세요</p>'
    + '<p style="font-size:12px;color:#4a5080;line-height:1.65;margin-bottom:12px;">'
    + '아래 주소창을 <b>꾹 눌러 전체 선택</b> 후 복사하세요.<br>'
    + '복사 후 Chrome 또는 Safari 주소창에 붙여넣기 해주세요.</p>';

  var inp = document.createElement('input');
  inp.type = 'text';
  inp.readOnly = true;
  inp.value = url;
  inp.style.cssText = 'width:100%;border:2px solid #2563eb;border-radius:8px;'
    + 'padding:10px 12px;font-size:12px;font-family:monospace;'
    + 'color:#1a1f36;background:#eff6ff;outline:none;';
  inp.addEventListener('focus', function(){ this.select(); });
  inp.addEventListener('click',  function(){ this.select(); });

  var btn = document.createElement('button');
  btn.textContent = '닫기';
  btn.style.cssText = 'margin-top:14px;width:100%;padding:10px;border:none;'
    + 'border-radius:8px;background:#1e2540;color:#fff;font-size:13px;'
    + 'font-weight:700;cursor:pointer;font-family:Pretendard,sans-serif;';
  btn.onclick = function(){ ov.remove(); };

  box.appendChild(inp);
  box.appendChild(btn);
  ov.appendChild(box);
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov);

  setTimeout(function(){ inp.focus(); inp.select(); }, 80);
}

function _fallbackCopy(url){ _showCopyFallback(url); }

function _enableGoogleLoginBtn(){
  var btn = document.getElementById('googleLoginBtn');
  var txt = document.getElementById('googleLoginBtnText');
  var hint = document.getElementById('firebaseLoadingHint');
  if(btn){ btn.disabled = false; }
  if(txt){ txt.textContent = 'Google로 로그인'; }
  if(hint){ hint.style.display = 'none'; }
}

function _disableGoogleLoginBtnWithHint(){
  var btn = document.getElementById('googleLoginBtn');
  var txt = document.getElementById('googleLoginBtnText');
  var hint = document.getElementById('firebaseLoadingHint');
  if(btn){ btn.disabled = true; }
  if(txt){ txt.textContent = '⚠️ 연결 실패 — 새로고침 후 시도'; }
  if(hint){ hint.style.display = 'block'; hint.textContent = '네트워크 상태를 확인하거나 페이지를 새로고침해주세요.'; }
}

function showLoginOverlay(){
  var el = document.getElementById('loginOverlay');
  if(!el) return;
  el.style.display = 'flex';
  // 인앱 브라우저 감지 → 안내 화면 전환
  if(isInAppBrowser()){
    var normal = document.getElementById('normalLoginUI');
    var inapp  = document.getElementById('inappLoginUI');
    if(normal) normal.style.display = 'none';
    if(inapp)  inapp.style.display  = 'block';
  }
}
function hideLoginOverlay(){
  var el = document.getElementById('loginOverlay');
  if(el) el.style.display = 'none';
}
function showUserUI(user){
  document.getElementById('syncUser').style.display = 'flex';
  document.getElementById('syncGuest').style.display = 'none';
  var avatar = document.getElementById('userAvatar');
  var name = document.getElementById('userName');
  if(avatar && user.photoURL) avatar.src = user.photoURL;
  if(name) name.textContent = user.displayName || user.email;
}
function showGuestUI(){
  try {
    var su = document.getElementById('syncUser');
    var sg = document.getElementById('syncGuest');
    if(su) su.style.display = 'none';
    if(sg) sg.style.display = 'flex';
    hideLoginOverlay();
    // 게스트 모드에서도 문제 데이터 + 커스텀 문제 로드 (Firebase 연결된 경우)
    if(typeof _questionsLoaded !== 'undefined' && !_questionsLoaded){
      _loadQuestionsFromFirebase(function(){
        if(typeof renderAll === 'function') renderAll();
        if(typeof updateProg === 'function') updateProg();
        loadAndMergeCustomQuestions();
      });
    } else {
      setTimeout(function(){ loadAndMergeCustomQuestions(); }, 800);
    }
  } catch(e) { console.warn('[UI] showGuestUI 오류:', e.message); }
}

// ── 구글 로그인 ────────────────────────────────────────
var _googleBtnHTML = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg> Google로 로그인';
function _resetGoogleBtn(btn){
  _enableGoogleLoginBtn();
}
function _isMobileOrTablet(){
  var ua = navigator.userAgent || '';
  // 터치 기반 기기 (Android, iOS, Samsung 태블릿 등)
  return /Android|iPhone|iPad|iPod|Samsung|SamsungBrowser|SM-[TPX]/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
}

function signInWithGoogle(){
  if(!firebaseReady){
    // Firebase SDK 아직 로드 중 → 준비되면 자동 재시도 (최대 15초)
    var btn = document.getElementById('googleLoginBtn');
    var hint = document.getElementById('firebaseLoadingHint');
    if(btn){ btn.disabled = true; }
    if(hint){ hint.style.display = 'block'; hint.textContent = 'Firebase 연결 중입니다. 잠시 기다려주세요...'; }
    var waited = 0;
    var retryTimer = setInterval(function(){
      waited += 300;
      if(firebaseReady){
        clearInterval(retryTimer);
        _resetGoogleBtn(btn);
        signInWithGoogle();
      } else if(waited >= 5000){
        clearInterval(retryTimer);
        _resetGoogleBtn(btn);
        var retry = confirm('Firebase 연결 시간 초과.\n인터넷 연결을 확인 후 다시 시도해주세요.\n\n[확인] 페이지 새로고침\n[취소] 로그인 없이 계속');
        if(retry){ location.reload(); } else { skipLogin(); }
      }
    }, 300);
    return;
  }
  var provider = new firebase.auth.GoogleAuthProvider();
  // 모바일/태블릿: 팝업이 조용히 무시되는 경우가 많으므로 리다이렉트 우선
  if(_isMobileOrTablet()){
    fbAuth.signInWithRedirect(provider).catch(function(e){
      if(e.code==='auth/unauthorized-domain'){
        alert('이 도메인은 Firebase 로그인이 허용되지 않습니다.\nFirebase Console > Authentication > Settings > 승인된 도메인에\n"' + location.hostname + '" 을 추가해주세요.');
      } else {
        alert('로그인 실패 (' + (e.code||'') + '): ' + e.message);
      }
    });
    return;
  }
  // 데스크탑: 팝업 우선, 실패 시 리다이렉트 폴백
  fbAuth.signInWithPopup(provider).catch(function(e){
    if(e.code==='auth/popup-blocked'||e.code==='auth/popup-closed-by-user'||e.code==='auth/operation-not-supported-in-this-environment'){
      fbAuth.signInWithRedirect(provider).catch(function(e2){
        alert('로그인 실패: ' + e2.message);
      });
    } else if(e.code==='auth/unauthorized-domain'){
      alert('이 도메인은 Firebase 로그인이 허용되지 않습니다.\nFirebase Console > Authentication > Settings > 승인된 도메인에\n"' + location.hostname + '" 을 추가해주세요.');
    } else {
      alert('로그인 실패 (' + (e.code||'') + '): ' + e.message);
    }
  });
}
// 리다이렉트 후 결과 처리 (삼성 브라우저/태블릿용)
function handleRedirectResult(){
  if(!firebaseReady||!fbAuth) return;
  fbAuth.getRedirectResult().then(function(result){
    if(result&&result.user){
      // onAuthStateChanged가 처리하지만, 혹시 누락될 경우 대비
      currentUser = result.user;
      hideLoginOverlay();
      showUserUI(result.user);
    }
  }).catch(function(e){
    if(e.code==='auth/unauthorized-domain'){
      alert('이 도메인은 Firebase 로그인이 허용되지 않습니다.\nFirebase Console > Authentication > Settings > 승인된 도메인에\n"' + location.hostname + '" 을 추가해주세요.');
    } else if(e.code&&e.code!=='auth/no-such-provider'){
      console.warn('redirect result 오류:', e.code, e.message);
    }
  });
}

// ── 로그인 없이 시작 ───────────────────────────────────
function skipLogin(){
  localStorage.setItem('login_skipped', '1');
  showGuestUI();
}

// ── 로그아웃 ───────────────────────────────────────────
function signOut(){
  if(!confirm('로그아웃할까요?')) return;
  localStorage.removeItem('login_skipped');
  fbAuth.signOut();
}

// ── Firebase에서 문제 데이터 로드 (로그인 직후 1회) ───────
var _questionsLoading = false; // 중복 fetch 방지
function _loadQuestionsFromFirebase(callback) {
  if(!firebaseReady || !fbDb){ callback && callback(); return; }
  if(_questionsLoaded || _questionsLoading){ callback && callback(); return; }
  _questionsLoading = true;
  var _lfq_called = false;
  var _lfq_safe = function(){ if(!_lfq_called){ _lfq_called=true; callback && callback(); } };
  // 5초 타임아웃: Firebase 응답 없으면 loginOverlay 강제 해제 (모바일 무한 로딩 방지)
  var _lfq_timeout = setTimeout(function(){
    console.warn('[데이터] Firebase 응답 없음 - 타임아웃으로 진행');
    _questionsLoading = false;
    _lfq_safe();
  }, 5000);
  fbDb.ref('questions/management').once('value')
    .then(function(snap){
      clearTimeout(_lfq_timeout);
      var data = snap.val();
      if(!data || !data.units || !data.menu){
        console.error('[데이터] Firebase에 문제 데이터 없음 — upload_questions.html로 먼저 업로드하세요.');
        _questionsLoading = false;
        _lfq_safe(); return;
      }
      var units = data.units;
      var meta  = data.meta || {};
      // MENU 재구성 (data 참조 붙이기)
      MENU = (data.menu || []).map(function(p){
        return {
          id: p.id, label: p.label,
          mids: (p.mids || []).map(function(m){
            if(m.hasSub){
              return {
                id: m.id, label: m.label, hasSub: true,
                subs: (m.subs || []).map(function(s){
                  return { id: s.id, label: s.label, data: units[s.id] || [] };
                })
              };
            }
            return { id: m.id, label: m.label, data: units[m.id] || [] };
          })
        };
      });
      // Set 재구성
      O_TYPE     = new Set(meta.o_type     || []);
      Q_EXPS_BOX = new Set(meta.q_exps_box || []);
      Q_OPTS_BOX = new Set(meta.q_opts_box || []);
      Q3_TYPE    = new Set(meta.q3_type    || []);
      _questionsLoaded = true;
      _questionsLoading = false;
      if(typeof invalidateQuestionCache==='function') invalidateQuestionCache(); // MENU 재구성 → 문제 캐시 무효화
      renderTabs(); // 사이드바 재구성
      console.log('[데이터] 문제 로드 완료: ' + getAllQuestions().length + '문제');
      _lfq_safe();
    })
    .catch(function(e){
      clearTimeout(_lfq_timeout);
      _questionsLoading = false; // 실패 시 재시도 허용 (게스트 실패 후 로그인 등)
      console.error('[데이터] 문제 로드 실패:', e.message);
      _lfq_safe();
    });
}

// ── state 병합: 통째 교체 대신 문제 키 단위 유니온 ──────
// 두 기기가 서로 다른 문제를 푼 경우 한쪽 작업 전체가 유실되는 것을 방지.
// - 한쪽에만 있는 키: 보존
// - 양쪽에 있는 키: 객체/배열은 하위 키 단위 병합(incoming=클라우드 우선), 스칼라는 클라우드 우선
// (타임스탬프가 없어 동일 지문의 진짜 충돌은 클라우드 우선 — 발생 빈도 극히 낮음)
// preferLocal=true면 동일 문제키·동일 하위키 충돌 시 로컬 값 우선(방금 한 판정 보존).
//   탭 복귀(refreshFromCloud) 전용 — 로그인 직후(loadCloudState)는 클라우드가 신뢰본이라 기본 false.
function _mergeCloudState(local, cloud, preferLocal){
  var out = {}, k;
  for(k in local){ if(Object.prototype.hasOwnProperty.call(local,k)) out[k]=local[k]; }
  for(k in cloud){
    if(!Object.prototype.hasOwnProperty.call(cloud,k)) continue;
    var cv = cloud[k], lv = out[k];
    if(cv && typeof cv==='object' && lv && typeof lv==='object'){
      // Firebase가 숫자키 객체를 배열로 되돌려줘도 동작 (인덱스 키 순회 병합)
      var m = Array.isArray(lv) ? lv.slice() : Object.assign({}, lv);
      Object.keys(cv).forEach(function(sk){
        if(cv[sk]===null || cv[sk]===undefined) return;
        // preferLocal: 로컬에 이미 값이 있는 하위키는 클라우드로 덮지 않음
        if(preferLocal && m[sk]!==null && m[sk]!==undefined) return;
        m[sk]=cv[sk];
      });
      out[k]=m;
    } else if(preferLocal && lv!==null && lv!==undefined){
      // 스칼라 충돌 시 로컬 우선 (out[k]=lv 이미 세팅됨 → 유지)
      out[k]=lv;
    } else {
      out[k]=cv;
    }
  }
  return out;
}
// 활동 카운트 병합: 두 기기가 각자 센 값 중 큰 쪽이 실제에 가까움 (act_날짜·act1_ 공용)
function _mergeActCount(k, cloudVal){
  var lv = parseInt(localStorage.getItem(k)||'0');
  var cvNum = parseInt(cloudVal);
  if(!isNaN(cvNum) && String(cvNum)===String(cloudVal).trim()){
    localStorage.setItem(k, String(Math.max(lv, cvNum)));
  } else {
    // 숫자가 아닌 값은 클라우드 우선
    localStorage.setItem(k, cloudVal);
  }
}

// ── 클라우드에서 진도 불러오기 (로그인 직후 자동) ──────
function loadCloudState(uid){
  var status = document.getElementById('syncStatus');
  if(status){ status.className = 'sync-status syncing'; status.textContent = '↻'; }
  // state + plan + rv + act + misc 동시에 가져오기
  fbDb.ref('users/' + uid).once('value')
    .then(function(snap){
      var cloudRoot = snap.val() || {};
      var cloudData = cloudRoot.state || null;
      var cloudPlan = cloudRoot.plan  || null;
      var cloudRv   = cloudRoot.rv    || null;
      var cloudAct  = cloudRoot.act   || null;
      var cloudMisc = cloudRoot.misc  || null;
      var cloudFc   = cloudRoot.fc    || null;
      var cloudMeta = cloudRoot.meta  || null;
      var localData = state;
      var changedByOther = _cloudChangedSinceSeen(uid, cloudMeta);
      _cloudLoaded = true; // 클라우드를 확인했으므로 이후 자동 push 허용
      _lastCloudRefresh = Date.now(); // 직후 visible 이벤트의 중복 재수신 방지

      if(cloudData && Object.keys(cloudData).length > 0){
        // ── 유니온 병합: 로컬·클라우드 양쪽 판정을 문제 키 단위로 모두 보존 ──
        //    (기존 "개수 비교 후 통째 선택" → 서로 다른 문제를 푼 두 기기 중 한쪽 유실 문제 해결)
        var _mergedState = _mergeCloudState(state, cloudData);
        // 병합 결과가 로컬과 달라졌는지 (달라졌으면 클라우드에도 반영 필요)
        var _stateChanged = JSON.stringify(_mergedState) !== JSON.stringify(state);
        state = _mergedState;
        saveState();
        // 클라우드 플랜 복원 (로컬보다 우선)
        if(cloudPlan){ localStorage.setItem(getPlanKey(), JSON.stringify(cloudPlan)); if(typeof _invalidateRvKeyCache==='function') _invalidateRvKeyCache(); }
        // 클라우드 복습모드 임시판정 복원
        if(cloudRv){ Object.keys(cloudRv).forEach(function(k){ if(k.indexOf('rv_')===0) localStorage.setItem(k, cloudRv[k]); }); }
        // 클라우드 활동 기록 복원 (날짜별 학습량 act_ + act1_* — 숫자 카운트는 max 병합)
        if(cloudAct){ Object.keys(cloudAct).forEach(function(k){
          if(k.indexOf('act_')===0 || k.indexOf('act1_')===0) _mergeActCount(k, cloudAct[k]);
        }); }
        // 클라우드 기타 플래그 복원 (회독 리셋·재조정·마이그레이션 등)
        if(cloudMisc){ Object.keys(cloudMisc).forEach(function(k){ localStorage.setItem(k, cloudMisc[k]); }); }
        // 클라우드 파이널체크 판정 복원 (통째 교체 대신 키 단위 병합 — 로컬 전용 키 보존)
        if(cloudFc){
          try{ var _lfc0=loadFcState(); localStorage.setItem(FC_KEY, JSON.stringify(Object.assign({}, _lfc0, cloudFc))); }
          catch(e){ localStorage.setItem(FC_KEY, JSON.stringify(cloudFc)); }
          if(typeof _invalidateFcCache==='function') _invalidateFcCache();
        }
        // 현재 클라우드 버전을 "확인함"으로 기록 (푸시 시엔 push 성공 콜백이 새 버전으로 갱신)
        _recordCloudMetaSeen(uid, cloudMeta);
        // 병합 결과가 로컬과 달라졌으면 클라우드에 반영 (병합본이 다른 기기에도 전파되도록)
        if(_stateChanged){ pushToCloud(uid, false); }
        // 범위 설정 복원
        var savedPlan = loadPlan();
        if(savedPlan && savedPlan.scopeMode){
          planScopeMode = savedPlan.scopeMode;
          planScopeIds  = savedPlan.scopeIds || [];
        }
        renderAll();
        updateProg();
        if(status){ status.className = 'sync-status'; status.textContent = '●'; }
        startAutoSync(uid);
      } else {
        // 클라우드에 state 없음
        if(Object.keys(localData).length > 0){
          if(changedByOther){
            // ⚠️ 다른 기기가 최근에 썼는데 state가 없음 = 다른 기기에서 초기화한 것
            //    (기존: confirm 없이 자동 재업로드 → 초기화가 조용히 무효화되는 최악 시나리오)
            if(confirm(
              '⚠️ 다른 기기에서 데이터 초기화가 감지됐습니다.\n\n'
              + '이 기기에는 이전 학습 데이터가 남아 있습니다.\n\n'
              + '[확인] 이 기기 데이터를 다시 업로드 (초기화 취소)\n'
              + '[취소] 초기화 유지 (이 기기 판정 기록 삭제)'
            )){
              pushToCloud(uid, false);
            } else {
              state = {};
              saveState();
              _recordCloudMetaSeen(uid, cloudMeta);
              renderAll(); updateProg();
            }
          } else {
            // 신규 계정/레거시(meta 없음) — 기존 동작 유지
            pushToCloud(uid, false);
          }
        } else {
          _recordCloudMetaSeen(uid, cloudMeta);
        }
        if(status){ status.className = 'sync-status'; status.textContent = '●'; }
        startAutoSync(uid);
      }
      setTimeout(function(){
        if(!loadPlan()){
          setTimeout(function(){ openPlanOverlay(); }, 1500);
        } else {
          renderDashboard();
        }
      }, 500);
    })
    .catch(function(e){
      if(status){ status.className = 'sync-status error'; status.textContent = '●'; }
    });
}

// ── 로컬 진도 마이그레이션 모달 ────────────────────────







// ── 자동 동기화 (페이지 이탈 직전 저장 — 배터리·데이터 최적화) ──
// setInterval(60초 push) 폐기: localStorage 순회로 모바일 freeze 발생.
// 대신 visibilitychange / beforeunload 시점에만 저장하고, 탭 복귀 시 클라우드 재수신.
function startAutoSync(uid){
  // 리스너는 최초 1회만 등록 (재로그인마다 startAutoSync가 불려도 중복 누적 방지)
  if(!startAutoSync._listenersBound){
    startAutoSync._listenersBound = true;
    // beforeunload: 탭 닫기/새로고침 직전 저장
    window.addEventListener('beforeunload', function(){
      if(currentUser && currentUser.uid) pushToCloud(currentUser.uid, false);
    });
    // visibilitychange: 탭 숨김(앱 전환 등) 시 저장 / 탭 복귀 시 클라우드 재수신
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'hidden' && currentUser && currentUser.uid){
        pushToCloud(currentUser.uid, false);
      } else if(document.visibilityState === 'visible'){
        refreshFromCloud(); // 다른 기기가 올린 최신 데이터 반영 (켜둔 탭이 옛 데이터로 덮어쓰는 사고 방지)
      }
    });
  }
}

// ── 탭 복귀 시 클라우드 재수신 (유니온 병합 재사용) ──────
// 폰에서 풀고 → 켜둔 PC 탭으로 복귀 시, PC가 옛 데이터로 덮어쓰는 사고를 병합 수신으로 차단.
var _lastCloudRefresh = 0;
function refreshFromCloud(){
  if(!currentUser || !currentUser.uid || !firebaseReady || !fbDb) return;
  if(_cloudWriting) return;                       // 쓰기 진행 중이면 이번엔 건너뜀
  var now = Date.now();
  if(now - _lastCloudRefresh < 60000) return;     // 60초 스로틀 (탭 전환 연타 방지)
  _lastCloudRefresh = now;
  fbDb.ref('users/' + currentUser.uid).once('value').then(function(snap){
    var root = snap.val() || {};
    // 탭 복귀: 방금 이 기기에서 한 판정이 클라우드 옛값으로 롤백되지 않도록 로컬 우선 병합
    if(root.state){ state = _mergeCloudState(state, root.state, true); saveState(); }
    if(root.plan){ localStorage.setItem(getPlanKey(), JSON.stringify(root.plan)); if(typeof _invalidateRvKeyCache==='function') _invalidateRvKeyCache(); }
    if(root.rv){ Object.keys(root.rv).forEach(function(k){ if(k.indexOf('rv_')===0) localStorage.setItem(k, root.rv[k]); }); }
    if(root.act){ Object.keys(root.act).forEach(function(k){ if(k.indexOf('act_')===0 || k.indexOf('act1_')===0) _mergeActCount(k, root.act[k]); }); }
    if(root.misc){ Object.keys(root.misc).forEach(function(k){ localStorage.setItem(k, root.misc[k]); }); }
    // fc 병합도 로컬 우선 (Object.assign 뒤 인자가 우선 → localFc를 마지막에)
    if(root.fc){ try{ var _lfc1=loadFcState(); localStorage.setItem(FC_KEY, JSON.stringify(Object.assign({}, root.fc, _lfc1))); if(typeof _invalidateFcCache==='function') _invalidateFcCache(); }catch(e){} }
    if(root.meta){ _recordCloudMetaSeen(currentUser.uid, root.meta); }
    // 현재 화면 갱신 (모드 유지)
    if(typeof renderAll==='function') renderAll();
    if(typeof updateProg==='function') updateProg();
    if(typeof renderTodayBanner==='function') renderTodayBanner();
    if(mode==='dash' && typeof renderDashboard==='function') renderDashboard();
  }).catch(function(){});
}

// ── 클라우드에 저장 ────────────────────────────────────
function pushToCloud(uid, showMsg){
  if(!firebaseReady || !fbDb || !uid) return;
  // 초기 클라우드 로드가 안 끝났으면 자동 push 금지 (낡은 로컬로 클라우드 덮어쓰기 방지)
  // 수동 동기화(showMsg=true)는 사용자 의사이므로 허용
  if(!_cloudLoaded && !showMsg) return;
  // 이미 쓰기 진행 중이면 자동 호출(showMsg=false)은 skip
  if(_cloudWriting && !showMsg) return;
  _cloudWriting = true;
  var status = document.getElementById('syncStatus');
  if(status){ status.className = 'sync-status syncing'; status.textContent = '↻'; }
  // 학습 판정 state + 플랜 + 복습모드 임시판정 + 활동 기록 + 기타 플래그 + 프로필 함께 저장
  var planData = loadPlan();
  var rvData = {}, actData = {}, miscData = {};
  // rvdone_ : △·X 회독 누적 완료 셋 (기기 간 동기화 필요). today_slice_는 로컬 전용(미포함)
  var miscPrefixes = ['round_reset_', 'round2_replan_', 'pass_done_pop_', 'rvdone_'];
  var miscSingles  = ['migration_v4_done','migration_v4_deferred_at','migration_v4_shown','migrated_review_v1','act1_tracking_start'];
  // Object.keys() 일괄 조회 (for+key(i) 방식 대비 O(n²)→O(n) 개선, 모바일 freeze 방지)
  Object.keys(localStorage).forEach(function(k){
    if(!k) return;
    if(k.indexOf('rv_')===0)   { rvData[k]  = localStorage.getItem(k); return; }
    if(k.indexOf('act_')===0)  { actData[k] = localStorage.getItem(k); return; } // 날짜별 학습량(연속일 계산용)
    if(k.indexOf('act1_')===0) { actData[k] = localStorage.getItem(k); return; }
    for(var pi=0; pi<miscPrefixes.length; pi++){
      if(k.indexOf(miscPrefixes[pi])===0){ miscData[k]=localStorage.getItem(k); break; }
    }
  });
  miscSingles.forEach(function(k){ var v=localStorage.getItem(k); if(v) miscData[k]=v; });
  var payload = { state: state };
  // plan이 null이면 명시적으로 null 전송 → Firebase /plan 노드 삭제
  payload.plan = planData || null;
  if(Object.keys(rvData).length > 0)   payload.rv   = rvData;
  if(Object.keys(actData).length > 0)  payload.act  = actData;
  if(Object.keys(miscData).length > 0) payload.misc = miscData;
  var fcData = loadFcState();
  if(Object.keys(fcData).length > 0) payload.fc = fcData;
  // 쓰기 메타 (타 기기 변경 감지용 — 클라이언트 시각이지만 "값이 바뀌었는가" 비교만 하므로 시계 오차 무관)
  var _pushMeta = { updatedAt: Date.now(), device: _getDeviceId() };
  payload.meta = _pushMeta;
  // 프로필 정보 (관리자 페이지용)
  if(currentUser){
    payload.profile = {
      email:       currentUser.email       || '',
      displayName: currentUser.displayName || '',
      lastActive:  new Date().toISOString().slice(0,10)
    };
  }
  fbDb.ref('users/' + uid).update(payload)
    .then(function(){
      _cloudWriting = false;
      _recordCloudMetaSeen(uid, _pushMeta); // 내가 쓴 버전 = 마지막으로 본 버전
      if(status){ status.className = 'sync-status'; status.textContent = '●'; }
      if(showMsg){
        var info = document.getElementById('syncInfo');
        var t = new Date(); var ts = t.getHours()+':'+('0'+t.getMinutes()).slice(-2);
        if(info){ info.textContent = '✅ 동기화 완료 ('+ts+')'; setTimeout(function(){ info.textContent=''; },3000); }
      }
    })
    .catch(function(){
      _cloudWriting = false;
      if(status){ status.className = 'sync-status error'; status.textContent = '●'; }
    });
}

// ── 수동 동기화 버튼 ───────────────────────────────────
function manualSync(){
  if(!currentUser){ alert('로그인이 필요합니다.'); return; }
  pushToCloud(currentUser.uid, true);
}




// ── 로컬 저장 (기존 그대로) ──────────────────────────
function loadState(){ try{ var s=localStorage.getItem(SK); if(s) state=JSON.parse(s); }catch(e){ state={}; } }

// ── 마이그레이션: ☆ 복습필요(_r/_br) → △(confused) 자동 변환 ──
function migrateReviewFlags(){
  var migKey = 'migrated_review_v1';
  if(localStorage.getItem(migKey)) return; // 이미 완료

  var changed = 0;
  var allQ = getAllQuestions();

  allQ.forEach(function(q){
    // 일반형: _r 플래그
    var rObj = state[q.id+'_r']||{};
    Object.keys(rObj).forEach(function(idx){
      if(rObj[idx]){
        // _j 에 판단이 없거나 mastered인 경우 → confused로 변환
        var jObj = state[q.id+'_j']||{};
        if(!jObj[idx] || jObj[idx]==='mastered'){
          if(!state[q.id+'_j']) state[q.id+'_j']={};
          state[q.id+'_j'][idx]='confused';
          // 해설 열람 표시도 남기기
          if(!state[q.id+'_e']) state[q.id+'_e']={};
          state[q.id+'_e'][idx]=true;
          changed++;
        }
      }
    });
    delete state[q.id+'_r'];

    // 박스형: _br 플래그
    var brObj = state[q.id+'_br']||{};
    Object.keys(brObj).forEach(function(label){
      if(brObj[label]){
        var bjObj = state[q.id+'_bj']||{};
        if(!bjObj[label] || bjObj[label]==='mastered'){
          if(!state[q.id+'_bj']) state[q.id+'_bj']={};
          state[q.id+'_bj'][label]='confused';
          if(!state[q.id+'_be']) state[q.id+'_be']={};
          state[q.id+'_be'][label]=true;
          changed++;
        }
      }
    });
    delete state[q.id+'_br'];

    // ㄱㄴㄷ형: _br_N 플래그
    for(var i=0;i<10;i++){
      if(state[q.id+'_br_'+i]){
        var gnJv = state[q.id+'_bj_'+i];
        if(!gnJv || gnJv==='mastered'){
          state[q.id+'_bj_'+i]='confused';
          state[q.id+'_be_'+i]=true;
          changed++;
        }
        delete state[q.id+'_br_'+i];
      }
    }
  });

  if(changed>0){
    saveState();
    console.log('[마이그레이션] ☆ 복습필요 '+changed+'개 → △(한 번 더 볼게) 변환 완료');
  }
  localStorage.setItem(migKey, '1');
}
function saveState(){
  try{ localStorage.setItem(SK,JSON.stringify(state)); }catch(e){}
  // 로그인 상태면 클라우드에도 반영 (디바운스 2000ms → 연속 판정 시 불필요한 쓰기 방지)
  if(currentUser && firebaseReady){
    if(saveState._t) clearTimeout(saveState._t);
    saveState._t = setTimeout(function(){ pushToCloud(currentUser.uid, false); }, 2000);
  }
}

// rv_ 임시 판정 키 정리 (3일 이상 된 키 자동 삭제)
function cleanOldRvKeys(){
  try{
    var today = todayStr();
    var cutoff = (function(){
      var d = new Date(); d.setDate(d.getDate()-3);
      return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
    })();
    var toDelete = [];
    for(var i=0; i<localStorage.length; i++){
      var k = localStorage.key(i);
      if(!k) continue;
      // 키 형식: rv_YYYY-MM-DD_pN_...
      if(k.indexOf('rv_')===0){
        var dateMatch = k.match(/^rv_(\d{4}-\d{2}-\d{2})_/);
        if(dateMatch && dateMatch[1] < cutoff) toDelete.push(k);
        continue;
      }
      // 키 형식: today_slice_YYYY-MM-DD_rN (로컬 전용 · 3일 지난 것 정리)
      if(k.indexOf('today_slice_')===0){
        var sm = k.match(/^today_slice_(\d{4}-\d{2}-\d{2})_/);
        if(sm && sm[1] < cutoff) toDelete.push(k);
        continue;
      }
      // 키 형식: pass_day_YYYY-MM-DD_rN (날짜별 차수 · 3일 지난 것 정리)
      if(k.indexOf('pass_day_')===0){
        var pm = k.match(/^pass_day_(\d{4}-\d{2}-\d{2})_/);
        if(pm && pm[1] < cutoff) toDelete.push(k);
        continue;
      }
      // 키 형식: today_quota_YYYY-MM-DD_rN (당일 quota · 3일 지난 것 정리)
      if(k.indexOf('today_quota_')===0){
        var qm = k.match(/^today_quota_(\d{4}-\d{2}-\d{2})_/);
        if(qm && qm[1] < cutoff) toDelete.push(k);
      }
    }
    toDelete.forEach(function(k){ localStorage.removeItem(k); });
    if(toDelete.length>0) console.log('[정리] rv_ 임시 키 '+toDelete.length+'개 삭제');
  }catch(e){}
}

// [구 방식 제거: getSyncCode]

// [구 방식 제거: cloudPull]

// [구 방식 제거: genRandomCode]

// [구 방식 제거: initSyncCode]

// [구 방식 제거: updateSyncUI]

// [구 방식 제거: copyMyCode]

// [구 방식 제거: hideCodeModal]

// [구 방식 제거: applyModalCode]

// [구 방식 제거: resetToAutoCode]
function gq(id){ return state[id]||{}; }
function sq(id,obj){ state[id]=Object.assign({},state[id]||{},obj); saveState(); }
