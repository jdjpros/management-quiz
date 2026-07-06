// ═══════════════════════════════════════════
// 09-admin.js — 관리자 전용 문제 추가/삭제 · customQuestions 병합
// (index.html에서 분리 — 로드 순서 유지 필수)
// ═══════════════════════════════════════════
// ════════════════════════════════════════════
// 관리자 — 문제 추가 기능
// ════════════════════════════════════════════
var ADMIN_EMAIL = 'jdjpros@naver.com';

function isAdmin(){
  return currentUser && currentUser.email === ADMIN_EMAIL;
}

// 관리자 버튼 노출 (onAuthStateChanged, signOut 연동)
function updateAdminUI(){
  var btn = document.getElementById('btnAddQ');
  if(btn) btn.style.display = isAdmin() ? 'inline-block' : 'none';
}

// ── 오버레이 열기 ──
function openQaOverlay(){
  if(!isAdmin()){ alert('관리자 전용 기능입니다.'); return; }
  if(!firebaseReady||!fbDb){ alert('Firebase 연결 후 사용 가능합니다.'); return; }
  // 단원 드롭다운 초기화
  var sel = document.getElementById('qaUnitSel');
  sel.innerHTML = '';
  MENU.forEach(function(p){
    p.mids.forEach(function(m){
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = '[' + m.id + '] ' + p.label + ' — ' + m.label;
      sel.appendChild(opt);
    });
  });
  buildQaOptsUI();
  onQaUnitChange();
  document.getElementById('qaOverlay').style.display = 'flex';
}
function closeQaOverlay(){
  document.getElementById('qaOverlay').style.display = 'none';
  // 폼 초기화
  document.getElementById('qaId').value = '';
  document.getElementById('qaStem').value = '';
  document.getElementById('qaAns').value = '1';
  var wrap = document.getElementById('qaOptsWrap');
  if(wrap) wrap.querySelectorAll('input,textarea').forEach(function(el){ el.value=''; });
}

// ── 선지 UI 4개 생성 ──
function buildQaOptsUI(){
  var wrap = document.getElementById('qaOptsWrap');
  if(!wrap) return;
  var html = '';
  for(var i=1;i<=4;i++){
    html += '<div class="qa-opt-block">';
    html += '<div class="qa-opt-label">'+['①','②','③','④'][i-1]+' 선지</div>';
    html += '<div class="qa-opt-row">';
    html += '<input type="text" id="qaOpt'+i+'" placeholder="선지 내용 입력" style="flex:1;">';
    html += '</div>';
    html += '<div class="qa-opt-row">';
    html += '<select class="qa-ox-sel" id="qaOx'+i+'"><option value="O">O (맞음)</option><option value="X">X (틀림)</option></select>';
    html += '<input type="text" id="qaExp'+i+'" placeholder="해설 입력 (없으면 비워도 됨)" style="flex:1;">';
    html += '</div>';
    html += '</div>';
  }
  wrap.innerHTML = html;
}

// ── 단원 변경 시 저장 목록 갱신 ──
function onQaUnitChange(){
  var unitId = document.getElementById('qaUnitSel').value;
  renderQaList(unitId);
}

// ── 저장된 커스텀 문제 목록 렌더링 ──
function renderQaList(unitId){
  var container = document.getElementById('qaListItems');
  if(!container) return;
  if(!fbDb){ container.innerHTML='<div class="qa-list-empty">Firebase 미연결</div>'; return; }
  container.innerHTML = '<div class="qa-list-empty">로딩 중...</div>';
  fbDb.ref('customQuestions/'+unitId).once('value').then(function(snap){
    var data = snap.val();
    if(!data||Object.keys(data).length===0){
      container.innerHTML = '<div class="qa-list-empty">저장된 문제 없음</div>';
      return;
    }
    // 문자열 onclick 조립 대신 createElement + 클로저 onclick 사용 (인젝션 방지)
    container.innerHTML = '';
    Object.keys(data).forEach(function(qId){
      var q = data[qId];
      var stem = (q.stem||'').replace(/<[^>]+>/g,'').slice(0,60);
      var item = document.createElement('div');
      item.className = 'qa-list-item';
      var stemDiv = document.createElement('div');
      stemDiv.className = 'qa-list-stem';
      var idB = document.createElement('b');
      idB.style.cssText = 'font-size:10px;color:var(--muted);margin-right:4px;';
      idB.textContent = '['+qId+']';
      stemDiv.appendChild(idB);
      stemDiv.appendChild(document.createTextNode(stem));
      item.appendChild(stemDiv);
      var metaDiv = document.createElement('div');
      metaDiv.className = 'qa-list-meta';
      metaDiv.textContent = '정답 '+q.ans+'번';
      item.appendChild(metaDiv);
      var delBtn = document.createElement('button');
      delBtn.className = 'qa-list-del';
      delBtn.title = '삭제';
      delBtn.textContent = '✕';
      delBtn.onclick = (function(u,i){ return function(){ deleteCustomQuestion(u,i); }; })(unitId, qId);
      item.appendChild(delBtn);
      container.appendChild(item);
    });
  }).catch(function(){ container.innerHTML='<div class="qa-list-empty">로드 실패</div>'; });
}

// ── 저장 ──
function saveCustomQuestion(){
  var unitId = document.getElementById('qaUnitSel').value;
  var stem   = (document.getElementById('qaStem').value||'').trim();
  var ans    = parseInt(document.getElementById('qaAns').value);
  var qId    = (document.getElementById('qaId').value||'').trim();
  if(!stem){ alert('문제 줄기를 입력해주세요.'); return; }
  // 사용자 입력 qId 형식 검증 (Firebase 경로/키 안전 문자만 허용)
  if(qId && !/^[A-Za-z0-9_-]+$/.test(qId)){
    alert('문제 ID는 영문·숫자·밑줄(_)·하이픈(-)만 사용할 수 있습니다.');
    return;
  }
  var opts = [], exps = [];
  for(var i=1;i<=4;i++){
    var optTxt = (document.getElementById('qaOpt'+i).value||'').trim();
    var ox     = document.getElementById('qaOx'+i).value;
    var expTxt = (document.getElementById('qaExp'+i).value||'').trim();
    if(!optTxt){ alert((i)+'번 선지를 입력해주세요.'); return; }
    opts.push(NUMS[i-1]+' '+optTxt);
    exps.push({ ox: ox, t: expTxt || (ox==='O'?'맞는 설명입니다.':'틀린 설명입니다.') });
  }
  if(!qId){
    // 자동 ID: 단원ID + _C + 타임스탬프 끝 4자리
    var ts = String(Date.now()).slice(-4);
    qId = unitId + '_C' + ts;
  }
  var q = { id: qId, ans: ans, stem: stem, opts: opts, exps: exps, _custom: true };
  fbDb.ref('customQuestions/'+unitId+'/'+qId).set(q)
    .then(function(){
      showToast('✅ 문제 저장 완료: '+qId);
      // MENU에 즉시 반영
      _mergeOneCustomQ(unitId, q);
      // 폼 초기화 및 목록 갱신
      document.getElementById('qaId').value = '';
      document.getElementById('qaStem').value = '';
      document.getElementById('qaAns').value = '1';
      document.getElementById('qaOptsWrap').querySelectorAll('input,textarea').forEach(function(el){ el.value=''; });
      renderQaList(unitId);
    })
    .catch(function(e){ alert('저장 실패: '+e.message); });
}

// ── 삭제 ──
function deleteCustomQuestion(unitId, qId){
  if(!confirm('['+qId+'] 문제를 삭제하시겠습니까?')) return;
  fbDb.ref('customQuestions/'+unitId+'/'+qId).remove()
    .then(function(){
      showToast('🗑 문제 삭제: '+qId);
      // MENU에서도 제거
      MENU.forEach(function(p){
        p.mids.forEach(function(m){
          if(m.id===unitId && m.data){
            var idx = m.data.findIndex(function(q){ return q.id===qId; });
            if(idx>=0) m.data.splice(idx,1);
          }
        });
      });
      invalidateQuestionCache(); // MENU 변경 → 문제 캐시 무효화
      renderQaList(unitId);
    })
    .catch(function(e){ alert('삭제 실패: '+e.message); });
}

// ── Firebase → MENU 병합 ──
function loadAndMergeCustomQuestions(){
  if(!firebaseReady||!fbDb) return;
  fbDb.ref('customQuestions').once('value').then(function(snap){
    var data = snap.val();
    if(!data) return;
    Object.keys(data).forEach(function(unitId){
      var qs = data[unitId];
      if(!qs) return;
      Object.keys(qs).forEach(function(qId){
        _mergeOneCustomQ(unitId, qs[qId]);
      });
    });
    // O_TYPE 재계산 (커스텀 문제 포함)
    _rebuildOTypeFromMenu();
    updateProg();
  }).catch(function(){});
}
function _mergeOneCustomQ(unitId, q){
  MENU.forEach(function(p){
    p.mids.forEach(function(m){
      if(m.id!==unitId) return;
      if(!m.data) m.data=[];
      var exists = m.data.findIndex(function(x){ return x.id===q.id; });
      if(exists>=0) m.data[exists]=q; else m.data.push(q);
    });
  });
  invalidateQuestionCache(); // MENU 변경 → 문제 캐시 무효화
}
function _rebuildOTypeFromMenu(){
  getAllQuestions().forEach(function(q){
    if(!q.exps||!q.opts) return;
    if(q.exps[0] && q.exps[0].ox==='O'){
      O_TYPE.add(q.id);
    }
  });
}
