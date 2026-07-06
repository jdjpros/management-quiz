// ═══════════════════════════════════════════
// 05-progress-srs.js — 진도 계산 · 오늘 학습량/연속일 · SRS
// (index.html에서 분리 — 로드 순서 유지 필수)
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// updateProg
// ═══════════════════════════════════════════
function updateProg(){
  // 모드별 집계 대상 결정
  // ┌─────────────────────────────────────────────────────┐
  // │ 플랜 있음 + 학습/복습 중  → 오늘 분량(passQs) 기준  │
  // │ 플랜 없음 or 대시보드    → 현재 단원 or 전체 기준   │
  // └─────────────────────────────────────────────────────┘
  var Qs;
  var tp = (typeof getTodayPlan === 'function') ? getTodayPlan() : null;
  var hasPlanToday = tp && tp.status === 'active';

  if(mode==='dash'){
    // 대시보드: 플랜 범위 전체
    Qs = getPlanQuestions();
  } else if(mode==='final'){
    // 파이널체크: 플랜 범위 전체
    Qs = getPlanQuestions();
  } else if(mode==='plan'){
    // plan 모드(대시보드에서 학습 시작): 오늘 분량(passQs)
    if(hasPlanToday && tp.passQs && tp.passQs.length > 0){
      Qs = tp.passQs;
    } else {
      Qs = planStudyQIds.length > 0
        ? getAllQuestions().filter(function(q){ return planStudyQIds.indexOf(q.id) >= 0; })
        : getCurrentData();
    }
  } else if(mode==='review'){
    // 복습모드: 플랜 있으면 오늘 △·X 기준, 없으면 현재 단원 △·X
    if(hasPlanToday && tp.passQs && tp.passQs.length > 0){
      Qs = tp.passQs; // 이미 △·X 필터된 오늘 복습 대상
    } else {
      Qs = getCurrentData().filter(function(q){ return needsReview(q.id); });
    }
  } else if(mode==='globalReview'){
    // 전범위 복습: 플랜 범위 전체의 △·X
    Qs = getPlanQuestions().filter(function(q){ return needsReview(q.id); });
  } else {
    // 학습모드(all): 플랜 활성이면 오늘 차수 대상 기준, 없으면 현재 단원
    if(hasPlanToday && tp.todayQs && tp.todayQs.length > 0){
      Qs = tp.todayQs; // 1차든 2/3차든 오늘 범위 기준
    } else {
      Qs = getCurrentData();
    }
  }
  var total = Qs.length;

  // ── 지문 단위 진도 집계 (문제 완료 수 → 판정된 지문 수) ──
  var totalStmts = 0, doneStmts = 0;
  Qs.forEach(function(q){
    if(Q_OPTS_BOX.has(q.id)||Q_EXPS_BOX.has(q.id)){
      q.exps.forEach(function(e,i){ totalStmts++; if(getGnJudge(q.id,i)) doneStmts++; });
    } else {
      var parsed2=parseBoxStem(q.stem);
      if(parsed2.items.length>0&&!Q3_TYPE.has(q.id)){
        parsed2.items.forEach(function(it){ totalStmts++; if(getBoxJudge(q.id,it.label)) doneStmts++; });
      } else {
        q.opts.forEach(function(o,i){ totalStmts++; if(getOptJudge(q.id,i+1)) doneStmts++; });
      }
    }
  });

  // 완료 문항 수: review 모드는 항상 rv_ 판정 기준, 나머지는 원본 state 기준
  var isReviewPass = (mode==='review' || mode==='globalReview');
  var done = Qs.filter(function(q){ return isReviewPass ? isQRvDone(q) : isQDone(q); }).length;

  // 판정별 집계 (원본 state 기준)
  var m=0, cf=0, f=0;
  Qs.forEach(function(q){
    if(Q_OPTS_BOX.has(q.id)||Q_EXPS_BOX.has(q.id)){
      // ㄱㄴㄷ형: 지문별 판정
      q.exps.forEach(function(e,i){
        var jv = getGnJudge(q.id,i);
        if(jv==='mastered') m++;
        else if(jv==='confused') cf++;
        else if(jv==='failed') f++;
      });
    } else {
      var parsed = parseBoxStem(q.stem);
      var boxMode = parsed.items.length>0 && !Q3_TYPE.has(q.id);
      if(boxMode){
        parsed.items.forEach(function(it){
          var jv = getBoxJudge(q.id, it.label);
          if(jv==='mastered') m++;
          else if(jv==='confused') cf++;
          else if(jv==='failed') f++;
        });
      } else {
        q.opts.forEach(function(o,i){
          var jv = getOptJudge(q.id, i+1);
          if(jv==='mastered') m++;
          else if(jv==='confused') cf++;
          else if(jv==='failed') f++;
        });
      }
    }
  });
  var rev = Qs.filter(function(q){ return needsReview(q.id); }).length;

  // 상단 칩 업데이트 (진도: 지문 단위, 나머지: 기존)
  var elDone=document.getElementById('sDone'); if(elDone) elDone.textContent=doneStmts;
  var elTotal=document.getElementById('sTotal'); if(elTotal) elTotal.textContent=totalStmts;
  var elM=document.getElementById('sM'); if(elM) elM.textContent=m;
  var elC=document.getElementById('sC'); if(elC) elC.textContent=cf;
  var elF=document.getElementById('sF'); if(elF) elF.textContent=f;
  var elRev=document.getElementById('sRev'); if(elRev) elRev.textContent=rev;
  var elFill=document.getElementById('pFill'); if(elFill) elFill.style.width=(totalStmts>0?(doneStmts/totalStmts*100):0)+'%';

  // 완료 배너 (오늘 분량 or 현재 단원 전체 완료 시)
  var rb=document.getElementById('resultBanner');
  if(rb && (mode==='all'||mode==='plan'||mode==='review') && total>0 && done===total){
    var pct2 = Math.round(m/(m+cf+f||1)*100);
    var rangeLabel = hasPlanToday ? '오늘 '+tp.todayQs.length+'문항' : getCurrentLabel();
    document.getElementById('rEmoji').textContent=pct2>=80?'🏆':pct2>=60?'👍':'📚';
    document.getElementById('rScore').textContent=rangeLabel+' 완료! 완벽 '+m+'지문 ('+pct2+'%)';

    if(hasPlanToday && (mode==='plan'||mode==='review')){
      // 차수별 자동 완료 팝업 (1회만 표시)
      var popKey = 'pass_done_pop_'+todayStr()+'_r'+(tp.round-1)+'_p'+tp.passNum;
      if(!localStorage.getItem(popKey)){
        localStorage.setItem(popKey,'1');
        _showPassCompletePopup(tp);
      }
      var nextPassLabel = tp.passNum<3 ? (tp.passNum+1)+'차로 이동 →' : '대시보드로 →';
      document.getElementById('rMsg').innerHTML =
        '<button onclick="'+(tp.passNum<3?'advancePass()':'setMode(\'dash\')')+'" '
        +'style="margin-top:8px;padding:8px 18px;background:'+(tp.passNum<3?'var(--c2)':'var(--correct)')+';color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:Pretendard,sans-serif;">'
        +nextPassLabel+'</button>';
    } else if(!hasPlanToday){
      // 플랜 없이 단원 완료 → 다음 단원 버튼
      var nextU = getNextUnit();
      if(nextU){
        document.getElementById('rMsg').innerHTML =
          '<button onclick="_goNextUnit()" '
          +'style="margin-top:8px;padding:8px 18px;background:var(--c0);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:Pretendard,sans-serif;">'
          +'→ '+nextU.label+'</button>';
      } else {
        document.getElementById('rMsg').textContent = pct2>=80?'합격권 실력! 복습모드로 점검하세요.':'복습 모드로 반복 학습하세요.';
      }
    } else {
      document.getElementById('rMsg').textContent = '대시보드에서 다음 차수로 이동하세요.';
    }
    rb.classList.add('visible');
  } else if(rb){ rb.classList.remove('visible'); }

  // 대시보드 통계 실시간 갱신 (판정할 때마다 반영)
  if(mode==='dash'){
    var planQs = getPlanQuestions();
    var planTotal = planQs.length;
    var planDone = planQs.filter(function(q){ return isQDone(q); }).length;
    var planRev = planQs.filter(function(q){ return needsReview(q.id); }).length;
    var todayN = parseInt(localStorage.getItem('act_'+todayStr())||'0');
    var plan2 = loadPlan();
    var statRow = document.getElementById('dashStatRow');
    if(statRow){
      statRow.innerHTML =
        '<div class="dash-stat"><div class="dash-stat-val">'+planTotal+'</div><div class="dash-stat-lbl">전체 문제</div></div>'+
        '<div class="dash-stat"><div class="dash-stat-val" style="color:var(--correct)">'+planDone+'</div><div class="dash-stat-lbl">완료 문항</div></div>'+
        '<div class="dash-stat"><div class="dash-stat-val" style="color:var(--warn)">'+planRev+'</div><div class="dash-stat-lbl">△·X 복습 대상</div></div>'+
        '<div class="dash-stat"><div class="dash-stat-val" style="color:var(--c2)">'+todayN+'</div><div class="dash-stat-lbl">오늘 완료</div></div>'+
        '<div class="dash-stat"><div class="dash-stat-val" style="color:var(--c1)">'+calcStreak()+'</div><div class="dash-stat-lbl">연속 학습일</div></div>'+
        '<div class="dash-stat"><div class="dash-stat-val" style="color:var(--warn)">'+(plan2?'D-'+diffDays(todayStr(),plan2.examDate):'—')+'</div><div class="dash-stat-lbl">시험까지</div></div>';
    }
  }
}

// ═══════════════════════════════════════════
// INIT



// ═══════════════════════════════════════════
// 오늘 학습량 / 연속일
// ═══════════════════════════════════════════
// 학습일 기준: 새벽 4시 (자정 이후 ~ 04:00 학습은 전날로 집계)
var STUDY_DAY_CUTOFF_HOUR = 4;
function todayStr(){
  var d=new Date();
  // 새벽 4시 이전이면 전날로 처리 (밤샘 학습 연속성 유지)
  if(d.getHours() < STUDY_DAY_CUTOFF_HOUR) d.setDate(d.getDate()-1);
  // 테스트용 가상 날짜 오프셋 (testNextDay/testResetDate에서 조작)
  var off=parseInt(localStorage.getItem('_dateOffset')||'0');
  if(off) d.setDate(d.getDate()+off);
  return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
}

// ── 새벽 early-morning 데이터 자동 병합 ────────────────────
// 자정~04:00 사이에 구 코드(0시 기준)로 저장된 calDate 키를
// 4시 기준 studyDate 키로 자동 이전 (act_, rv_, today_quota_, pass_day_, act1_)
function mergeEarlyMorningData(){
  var d = new Date();
  if(d.getHours() >= STUDY_DAY_CUTOFF_HOUR) return; // 4시 이후면 패스

  var studyDate = todayStr(); // 4시 기준 오늘 (예: 2026-05-20)
  var calDate   = d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); // 캘린더 날짜 (예: 2026-05-21)
  if(studyDate === calDate) return; // 같으면 불필요

  // 1) act_ 카운터: 합산 후 삭제
  var actCal = parseInt(localStorage.getItem('act_' + calDate) || '0');
  if(actCal > 0){
    var actStudy = parseInt(localStorage.getItem('act_' + studyDate) || '0');
    localStorage.setItem('act_' + studyDate, String(actStudy + actCal));
    localStorage.removeItem('act_' + calDate);
    console.log('[early-morning-merge] act ' + calDate + '(' + actCal + ') → ' + studyDate + '(' + (actStudy + actCal) + ')');
  }

  // 2) act1_, rv_, today_quota_, pass_day_ 키: calDate → studyDate 리네임
  // (이미 리네임된 키는 calDate가 없으므로 중복 실행 무해 — 플래그 불필요)
  var prefixes = ['act1_'+calDate, 'rv_'+calDate, 'today_quota_'+calDate, 'pass_day_'+calDate];
  var toRename = [];
  for(var i = 0; i < localStorage.length; i++){
    var k = localStorage.key(i);
    if(!k) continue;
    for(var pi = 0; pi < prefixes.length; pi++){
      if(k.indexOf(prefixes[pi]) === 0){ toRename.push(k); break; }
    }
  }
  toRename.forEach(function(k){
    var newKey = k.replace(calDate, studyDate);
    localStorage.setItem(newKey, localStorage.getItem(k));
    localStorage.removeItem(k);
  });
  if(toRename.length) console.log('[early-morning-merge] 키 리네임 ' + toRename.length + '개: ' + calDate + ' → ' + studyDate);
}
mergeEarlyMorningData(); // 페이지 로드 시 즉시 실행
function recordActivity(ownerDate){
  var today = todayStr();
  var k = 'act_' + today;
  localStorage.setItem(k, parseInt(localStorage.getItem(k)||'0') + 1);
  // 1차 학습 전용 카운터 — ownerDate 기반으로 이월 문제 정확 추적
  var tp2 = getTodayPlan();
  if(!tp2 || tp2.status !== 'active' || tp2.isFullPass){
    var targetDate = ownerDate || today;
    var k1 = 'act1_' + targetDate;
    var newCount = parseInt(localStorage.getItem(k1)||'0') + 1;
    localStorage.setItem(k1, newCount);
    // 오늘 실제 학습량 카운터 (배지·통계용 — ownerDate 무관)
    var kWork = 'act1_work_' + today;
    localStorage.setItem(kWork, parseInt(localStorage.getItem(kWork)||'0') + 1);
    // 해당 날짜 완료일 기록 (처음 할당량에 도달한 날)
    var completeKey = 'act1_complete_' + targetDate;
    if(!localStorage.getItem(completeKey)){
      var plan2 = tp2 ? tp2.plan : null;
      var r2 = plan2 && plan2.rounds && tp2.round >= 1 ? plan2.rounds[tp2.round-1] : null;
      var quota2 = r2 ? (r2.qPerDay||0) : 0;
      if(quota2 > 0 && newCount >= quota2) localStorage.setItem(completeKey, today);
    }
  }
  updateTodayUI();
}
// 문제가 플랜상 배정된 날짜(ownerDate) 반환 — 이월 시나리오에서 정확도 향상
function getQOwnerDate(qId){
  var tp = getTodayPlan();
  if(!tp || tp.status !== 'active') return todayStr();
  var plan = tp.plan;
  if(!plan || !plan.rounds || tp.round < 1) return todayStr();
  var r = plan.rounds[tp.round-1];
  if(!r) return todayStr();
  // 전체 회독(1·4회독): 문제 인덱스로 ownerDate 계산 (이월 분량 정확 반영)
  if(tp.isFullRound){
    var allQ = getAllQuestions();
    var qIdx = -1;
    for(var i=0; i<allQ.length; i++){ if(allQ[i].id === qId){ qIdx=i; break; } }
    if(qIdx < 0) return todayStr();
    var dayOffset = Math.floor(qIdx / (tp.qPerDay||1));
    return addDays(r.startDate, dayOffset);
  }
  // △·X 회독(2/3회독): 오늘이 ownerDate
  return todayStr();
}
function updateTodayUI(){
  var k = 'act_' + todayStr();
  var n = parseInt(localStorage.getItem(k)||'0');
  var el = document.getElementById('todayCount'); if(el) el.textContent = n;
  var el2 = document.getElementById('streakDays'); if(el2) el2.textContent = calcStreak();
}
function calcStreak(){
  // todayStr()과 동일한 4AM 컷오프 + dateOffset 적용
  var d = new Date();
  if(d.getHours() < STUDY_DAY_CUTOFF_HOUR) d.setDate(d.getDate()-1);
  var off = parseInt(localStorage.getItem('_dateOffset')||'0');
  if(off) d.setDate(d.getDate()+off);
  var streak = 0;
  for(var i=0;i<365;i++){
    var s = d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
    if(parseInt(localStorage.getItem('act_'+s)||'0') > 0){ streak++; }
    else if(i>0){ break; }
    d.setDate(d.getDate()-1);
  }
  return streak;
}

// ═══════════════════════════════════════════
// SRS (Spaced Repetition System)
// SRS 레벨: 0=신규, 1=1일후, 2=3일후, 3=7일후, 4=14일후, 5=완료
// ═══════════════════════════════════════════
var SRS_INTERVALS = [0, 1, 3, 7, 14, 30]; // days
function getSrsState(qId){ return state['srs_'+qId]||{lvl:0,due:null}; }
function setSrsState(qId, correct){
  var s = getSrsState(qId);
  var lvl = s.lvl || 0;
  if(correct){ lvl = Math.min(lvl+1, 5); }
  else { lvl = Math.max(lvl-1, 0); }
  var dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + SRS_INTERVALS[lvl]);
  var due = dueDate.getFullYear()+'-'+('0'+(dueDate.getMonth()+1)).slice(-2)+'-'+('0'+dueDate.getDate()).slice(-2);
  state['srs_'+qId] = {lvl:lvl, due:due};
  saveState();
}
function isSrsDue(qId){
  var s = getSrsState(qId);
  if(!s.due) return true; // 미학습
  return s.due <= todayStr();
}
function getSrsDueQuestions(){
  var allQ = [];
  MENU.forEach(function(p){ p.mids.forEach(function(m){
    if(m.hasSub){ m.subs.forEach(function(s){ allQ = allQ.concat(s.data); }); }
    else if(m.data){ allQ = allQ.concat(m.data); }
  });});
  return allQ.filter(function(q){ return isSrsDue(q.id); });
}
