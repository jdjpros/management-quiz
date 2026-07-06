// ═══════════════════════════════════════════
// 07-plan.js — 회독 플랜 엔진 · 단원 범위 선택 · 초기화 · iOS 대응 패치
// (index.html에서 분리 — 로드 순서 유지 필수)
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// 회독 플랜 엔진
// ═══════════════════════════════════════════

// 전체 문제 순서 배열 (MENU 순서대로 flat)
function getAllQuestions(){
  var all = [];
  MENU.forEach(function(p){
    p.mids.forEach(function(m){
      if(m.hasSub){ m.subs.forEach(function(s){ all = all.concat(s.data); }); }
      else if(m.data){ all = all.concat(m.data); }
    });
  });
  return all;
}

// 플랜 범위 상태 (전역)
var planScopeMode = 'all';       // 'all' | 'gwa' | 'unit'
var planScopeIds  = [];          // 선택된 중단원 id 배열 (unit 모드일 때)

// 플랜 범위 내 문제만 수집
function getPlanQuestions(){
  if(planScopeMode === 'all') return getAllQuestions();
  if(planScopeMode === 'gwa'){
    var result = [];
    MENU.forEach(function(p){
      p.mids.forEach(function(m){
        if(m.hasSub){
          m.subs.forEach(function(s){
            if(s.id.slice(-1) === 'A') result = result.concat(s.data);
          });
        } else if(m.data && m.id.slice(-1) === 'A'){
          result = result.concat(m.data);
        }
      });
    });
    return result;
  }
  if(planScopeIds.length === 0) return getAllQuestions();
  var result = [];
  MENU.forEach(function(p){
    p.mids.forEach(function(m){
      if(m.hasSub){
        m.subs.forEach(function(s){
          if(planScopeIds.indexOf(s.id) >= 0) result = result.concat(s.data);
        });
      } else if(m.data){
        var midId = m.id;
        if(planScopeIds.indexOf(midId) >= 0) result = result.concat(m.data);
      }
    });
  });
  return result;
}

// 플랜 범위 내 중단원 목록 (id 배열)
function getPlanScopeAllMidIds(){
  var ids = [];
  MENU.forEach(function(p){
    p.mids.forEach(function(m){
      if(m.hasSub){ m.subs.forEach(function(s){ ids.push(s.id); }); }
      else { ids.push(m.id); }
    });
  });
  return ids;
}

// 날짜 유틸
function dateStr(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
function parseDate(s){ var p=s.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }
function diffDays(a,b){ return Math.round((parseDate(b)-parseDate(a))/(1000*60*60*24)); }
function addDays(s,n){ var d=parseDate(s); d.setDate(d.getDate()+n); return dateStr(d); }

/*
  회독 구조:
  회독1 = 21일 (1차/2차/3차)
  회독2 = 14일 (4차/5차/6차)
  회독3 =  7일 (7차/8차/9차)
  회독4 =  3일 (선택: 시험 직전)
  총 = 21+14+7+3 = 45일 최소

  각 회독 내:
  - 奇수차(1,4,7): 전체 지문
  - 偶수차(2,3,5,6,8,9): X+△ 지문만
  - 하루에 1차→2차→3차 모두 완료
*/

// 1~9회독 패스 번호 매핑
var ROUND_PASSES = [
  [1,2,3],[4,5,6],[7,8,9],
  [10,11,12],[13,14,15],[16,17,18],
  [19,20,21],[22,23,24],[25,26,27]
];
var PLAN_KEY = 'study_plan_v1'; // 게스트용 기본키 (로그인 시 uid 기반으로 변경)
function getPlanKey(){
  // 로그인된 사용자는 uid 기반 키 → 계정마다 독립적인 플랜
  if(currentUser && currentUser.uid){
    return 'study_plan_v1_' + currentUser.uid;
  }
  return PLAN_KEY;
}
var planGoalRounds = 9; // UI 상태

function loadPlan(){ try{ return JSON.parse(localStorage.getItem(getPlanKey())||'null'); }catch(e){ return null; } }
function savePlanData(p){
  localStorage.setItem(getPlanKey(), JSON.stringify(p));
  // 로그인 상태면 Firebase에도 즉시 반영
  if(currentUser && currentUser.uid && firebaseReady && fbDb){
    fbDb.ref('users/' + currentUser.uid + '/plan').set(p).catch(function(){});
  }
}

// △·X 비율 계산
function calcWrongRatio(){
  // 플랜 범위 내 지문 수(total)와 판정된 지문 수(judged), △·X 수(wrong) 집계
  var allQ=getPlanQuestions(), total=0, judged=0, wrong=0;
  allQ.forEach(function(q){
    if(Q_OPTS_BOX.has(q.id)||Q_EXPS_BOX.has(q.id)){
      q.exps.forEach(function(e,i){
        total++;
        var jv=getGnJudge(q.id,i);
        if(jv){ judged++; if(jv==='confused'||jv==='failed') wrong++; }
      });
    } else {
      var parsed=parseBoxStem(q.stem);
      if(parsed.items.length>0&&!Q3_TYPE.has(q.id)){
        parsed.items.forEach(function(it){
          total++;
          var jv=getBoxJudge(q.id,it.label);
          if(jv){ judged++; if(jv==='confused'||jv==='failed') wrong++; }
        });
      } else {
        q.opts.forEach(function(o,i){
          total++;
          var jv=getOptJudge(q.id,i+1);
          if(jv){ judged++; if(jv==='confused'||jv==='failed') wrong++; }
        });
      }
    }
  });
  // 판정완료율 (0~1)
  var completionRate = total===0 ? 0 : judged/total;
  // 실제 △·X 비율 (판정된 것 기준)
  var rActual = judged===0 ? 0.5 : Math.max(0.1, Math.min(0.9, wrong/judged));
  // 블렌딩: 70% 이상 판정 시 실제값 100% 반영, 미만 시 0.5와 가중 혼합
  var weight = Math.min(1, completionRate / 0.7);
  var rBlended = rActual * weight + 0.5 * (1 - weight);
  return { r: rBlended, rActual: rActual, completionRate: completionRate, judged: judged, total: total };
}

/*
  9회독 구조 (3/6/9회독 완료 선택 가능):
  세트1: 1회독(전체) → 2회독(△X) → 3회독(△X)  ← 3회독 완료 가능
  세트2: 4회독(초기화+전체) → 5회독(△X) → 6회독(△X)  ← 6회독 완료 가능
  세트3: 7회독(초기화+전체) → 8회독(△X) → 9회독(△X)  ← 9회독 완료
  
  기간: D1=사용자설정, D4=D1×0.7, D7=D1×0.5 (점차 감소)
  △X 회독: Dn×r (r=현재 △X비율)
*/
// 주말 제외 옵션 반영한 날짜 이동
function addStudyDays(startStr, n){
  return planIncludeWeekend ? addDays(startStr, n) : addWeekdays(startStr, n);
}

function calcPlan(startDate, examDate, d1Override, goalRounds){
  var allQ=getPlanQuestions(), totalQ=allQ.length, rInfo=calcWrongRatio(), r=rInfo.r;
  var goal=goalRounds||9, D1=d1Override||21;

  // 세트별 전체 회독 기간
  // 4회독: 한 번 본 전체 범위 → D1 × 0.85
  // 7회독: 두 번 본 전체 범위 → D1 × 0.70
  var D4=Math.max(3,Math.round(D1*0.85));
  var D7=Math.max(3,Math.round(D1*0.70));

  // △X 회독 기간 계산
  // 2/3회독: 1회독에서 체크된 지문이 고정이므로 동일한 양
  //   2회독 = D1 × r          (처음 보는 △·X)
  //   3회독 = D1 × r × 0.8    (한 번 본 뒤라 약 20% 빠름)
  // 5/6, 8/9회독도 동일 논리
  var allDays=[
    D1,
    Math.max(3, Math.round(D1*r)),
    Math.max(2, Math.round(D1*r*0.8)),
    D4,
    Math.max(3, Math.round(D4*r)),
    Math.max(2, Math.round(D4*r*0.8)),
    D7,
    Math.max(3, Math.round(D7*r)),
    Math.max(2, Math.round(D7*r*0.8))
  ];

  var allDefs=[
    {round:1,isFullRound:true, resetBefore:false,label:'1회독 - 전체 학습'},
    {round:2,isFullRound:false,resetBefore:false,label:'2회독 - △·X 집중'},
    {round:3,isFullRound:false,resetBefore:false,label:'3회독 - △·X 마무리'},
    {round:4,isFullRound:true, resetBefore:true, label:'4회독 - 초기화 후 재학습'},
    {round:5,isFullRound:false,resetBefore:false,label:'5회독 - △·X 집중'},
    {round:6,isFullRound:false,resetBefore:false,label:'6회독 - △·X 마무리'},
    {round:7,isFullRound:true, resetBefore:true, label:'7회독 - 초기화 후 재학습'},
    {round:8,isFullRound:false,resetBefore:false,label:'8회독 - △·X 집중'},
    {round:9,isFullRound:false,resetBefore:false,label:'9회독 - 최종 마무리'}
  ];

  var roundDefs=allDefs.slice(0,goal).map(function(d,i){ return Object.assign({},d,{days:allDays[i]}); });

  // 일수 부족 시 비율 축소 (주말 제외 옵션 반영)
  var totalNeeded=roundDefs.reduce(function(s,d){return s+d.days;},0);
  var totalAvail=getAvailStudyDays(startDate,examDate);
  if(totalAvail<totalNeeded){
    var scale=totalAvail/totalNeeded;
    roundDefs=roundDefs.map(function(d){ return Object.assign({},d,{days:Math.max(1,Math.round(d.days*scale))}); });
  }

  // 대상 문항 수 추정
  // 2/3회독: 1회독 체크 지문 고정 → 동일 문항 수 (r)
  // 5/6, 8/9회독도 동일 논리 적용
  // 단, 세트가 반복될수록 숙련도 반영해 세트2는 ×0.85, 세트3은 ×0.7
  var wc=[
    totalQ,
    Math.round(totalQ*r),
    Math.round(totalQ*r),
    totalQ,
    Math.round(totalQ*r*0.85),
    Math.round(totalQ*r*0.85),
    totalQ,
    Math.round(totalQ*r*0.7),
    Math.round(totalQ*r*0.7)
  ];

  var rounds=[], cur=startDate;
  roundDefs.forEach(function(rd,ri){
    var tc=Math.max(1,wc[ri]||totalQ);
    var endDate = addStudyDays(cur, rd.days-1); // 주말 제외 옵션 반영
    rounds.push({
      round:rd.round, startDate:cur, endDate:endDate,
      days:rd.days, targetCount:tc, qPerDay:Math.max(1,Math.ceil(tc/rd.days)),
      isFullRound:rd.isFullRound, resetBefore:rd.resetBefore, label:rd.label
    });
    cur=addStudyDays(endDate, 1);
  });

  var doneQ=allQ.filter(function(q){return isQDone(q);});
  return {
    startDate:startDate, examDate:examDate, d1:D1, goalRounds:goal,
    includeWeekend: planIncludeWeekend,
    wrongRatio:r, rounds:rounds, hasProgress:doneQ.length>0,
    progressCount:doneQ.length, totalCount:totalQ, createdAt:todayStr()
  };
}

// 오늘 기준 현재 회독/차수/문제범위 계산
function getTodayPlan(){
  var plan = loadPlan();
  if(!plan) return null;
  var today = todayStr();
  if(today < plan.startDate) return { status:'notStarted', plan:plan };
  if(today > plan.examDate)  return { status:'done', plan:plan };

  // 주말 제외 옵션: 오늘이 주말이면 "오늘은 쉬는 날" 반환
  if(plan.includeWeekend===false){
    var dow = parseDate(today).getDay();
    if(dow===0||dow===6) return { status:'weekend', plan:plan };
  }

  var allQ = getPlanQuestions();

  for(var ri=0; ri<plan.rounds.length; ri++){
    var r = plan.rounds[ri];
    if(today < r.startDate || today > r.endDate) continue;

    var dayInRound = diffDays(r.startDate, today); // 0-based

    // 대상 문제 결정 (큐 방식 — 어제 잔여 자동 흡수)
    var targetQs;
    var _totalPool = allQ.length; // carryover 계산용 전체 풀 크기
    var _allDoneFallback = false; // 전부 완료된 경우 날짜 기반 fallback
    if(r.isFullRound){
      // 1·4회독: 미완료 문제를 큐처럼 앞에서부터 (어제 잔여 자동 흡수)
      var notDone = allQ.filter(function(q){ return !isQDone(q); });
      if(notDone.length>0){
        targetQs = notDone;
      } else {
        targetQs = allQ;
        _allDoneFallback = true; // 전부 완료 → 날짜 기반 slice fallback
      }
    } else {
      // 2/3회독: △·X 문항을 큐처럼 (미복습 우선, 어제 잔여 자동 흡수)
      var allWrong = allQ.filter(function(q){ return hasWrongOrConfused(q); });
      if(allWrong.length===0) allWrong = allQ;
      _totalPool = allWrong.length; // △·X 총 수
      var notRvDone = allWrong.filter(function(q){ return !isQRvDone(q); });
      if(notRvDone.length>0){
        targetQs = notRvDone;
      } else {
        targetQs = allWrong;
        _allDoneFallback = true; // 전부 복습 완료 → 날짜 기반 fallback
      }
    }

    // qPerDay: 플랜 저장값 우선 (생성 시 고정), 없으면 전체 풀 기준 재계산
    var qPerDay = r.qPerDay || Math.max(1, Math.ceil(_totalPool / r.days));

    var startIdx, endIdx, carryover = 0;
    if(!_allDoneFallback){
      // 큐 방식: 어제까지 밀린 분량 + 오늘 할당량
      var alreadyDone    = _totalPool - targetQs.length;              // 지금까지 완료한 수
      var shouldHaveDone = Math.min((dayInRound + 1) * qPerDay, _totalPool); // 오늘까지 완료해야 할 수
      carryover = Math.max(0, shouldHaveDone - alreadyDone);          // 밀린 수
      startIdx = 0;
      endIdx   = Math.min(carryover + qPerDay, targetQs.length);
    } else {
      // 전부 완료 fallback: 날짜 기반 슬라이스
      startIdx = Math.max(0, Math.min(dayInRound * qPerDay, targetQs.length));
      endIdx   = Math.max(startIdx, Math.min(startIdx + qPerDay, targetQs.length));
    }
    var todayQs  = targetQs.slice(startIdx, endIdx);

    // ⚠️ 4/7회독 첫날 state 초기화 블록 제거 (2026-06-07, 행정법 사고 동일 예방)
    //   - getTodayPlan()은 렌더마다 수십 번 호출되는 함수.
    //   - 여기서 confirm "예" → state={} 로 전체(1·2·3 세트 포함) 학습판정이 삭제되고 Firebase까지 덮어써짐.
    //   - confirm "취소" → resetKey가 안 박혀서 다음 렌더마다 confirm이 무한 반복 → 페이지 freeze.
    //   → 어느 쪽도 정상 동작이 아니므로 블록 자체를 제거(데이터 보존). 7회독은 isFullRound라
    //     초기화 없이도 전체 범위를 다시 학습 가능. 명시적 초기화가 필요하면 대시보드 버튼으로만.
    var passNum    = getTodayPassNum(today, ri);  // ← 누락된 정의 복구
    var globalPass = (ROUND_PASSES[ri]||[passNum])[passNum-1] || passNum;
    var isFullPass = (passNum===1);

    var passQs = getPassQuestions(todayQs, ri, passNum, today);

    // 1차 진도 표시용 초기 할당량을 처음 한 번만 기록 (완료가 진행돼도 분모가 고정됨)
    var quotaKey = 'today_quota_'+today+'_r'+ri;
    if(passNum === 1 && !localStorage.getItem(quotaKey) && passQs.length > 0){
      localStorage.setItem(quotaKey, passQs.length);
    }
    var todayInitialQuota = (passNum === 1)
      ? (parseInt(localStorage.getItem(quotaKey)||'0') || passQs.length)
      : passQs.length;

    return {
      status:      'active',
      plan:        plan,
      round:       ri+1,
      roundDays:   r.days,
      roundLabel:  r.label,
      isFullRound: r.isFullRound,
      dayInRound:  dayInRound+1,
      passNum:     passNum,
      globalPass:  globalPass,
      isFullPass:  isFullPass,
      autoMode:    isFullPass ? 'all' : 'review',
      todayQs:     todayQs,
      passQs:      passQs,
      todayInitialQuota: todayInitialQuota,
      startIdx:    startIdx,
      endIdx:      endIdx,
      qPerDay:     qPerDay,
      carryover:   carryover,
      targetTotal: targetQs.length,
      daysLeft:    diffDays(today, plan.examDate),
      wrongRatio:  plan.wrongRatio||0.5
    };
  }
  return { status:'done', plan:plan };
}

// 오늘 몇 차인지 판단 (localStorage에 저장)
function getTodayPassNum(today, roundIdx){
  var k = 'pass_day_'+today+'_r'+roundIdx;
  return parseInt(localStorage.getItem(k)||'1');
}
function setTodayPassNum(today, roundIdx, n){
  var k = 'pass_day_'+today+'_r'+roundIdx;
  localStorage.setItem(k, n);
}


// 해당 차수의 문제 목록
// passNum=1: 오늘 범위 전체 (학습모드)
// passNum=2,3: 오늘 범위 문제 중 △·X인 것
// ⚠️ 이 파일 하단 부트스트랩(updateProg→getTodayPlan)이 로드 시점에 호출하므로
//    반드시 07 안에 정의돼 있어야 함 (08로 옮기면 게스트 플랜 기기에서 ReferenceError로 앱 먹통)
function getPassQuestions(todayQs, roundIdx, passNum, today){
  if(passNum===1) return todayQs; // 1차: 오늘 범위 전체
  // 2차/3차: 오늘 범위 문제 중 △·X인 것
  return todayQs.filter(function(q){ return hasWrongOrConfused(q); });
}

// 문제에 X 또는 △ 지문이 하나라도 있는지
function hasWrongOrConfused(q){
  // 유형2/3: ㄱㄴㄷ형 (index 기반)
  if(Q_OPTS_BOX.has(q.id)||Q_EXPS_BOX.has(q.id)){
    for(var j=0;j<q.exps.length;j++){
      var jv2 = getGnJudge(q.id,j);
      var ox2 = (q.exps[j]&&q.exps[j].ox)||'O';
      if(_isReviewTarget(jv2,ox2)) return true;
    }
    return false;
  }
  // 유형1: A~E, ㄱ~ㅈ 박스형
  var parsed = parseBoxStem(q.stem);
  if(parsed.items.length > 0 && !Q3_TYPE.has(q.id)){
    var _lmapH={'A':0,'B':1,'C':2,'D':3,'E':4,'ㄱ':0,'ㄴ':1,'ㄷ':2,'ㄹ':3,'ㅁ':4,'ㅂ':5,'ㅅ':6,'ㅇ':7,'ㅈ':8,'가':0,'나':1,'다':2,'라':3,'마':4,'바':5,'사':6,'아':7,'자':8};
    return parsed.items.some(function(it){
      var jv = getBoxJudge(q.id, it.label);
      var liH=(_lmapH[it.label]!==undefined?_lmapH[it.label]:0);
      var bexpH=(q.bexps&&q.bexps[liH])||null;
      var expH=bexpH||q.exps[liH]||{ox:'O'};
      var oxH=expH.ox||'O';
      return _isReviewTarget(jv,oxH);
    });
  }
  // 일반 4지선다
  var isOtypeH=O_TYPE.has(q.id);
  for(var i=1;i<=q.opts.length;i++){
    var jv = getOptJudge(q.id,i);
    var isAnsH=(i===q.ans);
    var oxH2=isOtypeH?(isAnsH?'O':'X'):(isAnsH?'X':'O');
    if(_isReviewTarget(jv,oxH2)) return true;
  }
  return false;
}

// 오늘 패스에서 완료한 문제 수
// passNum >= 2 이면 isQRvDone(임시 rv 판정) 기준, 1차이면 isQDone(판정 완료) 기준
function getTodayPassDone(passQs, passNum){
  if(passNum && passNum >= 2){
    return passQs.filter(function(q){ return isQRvDone(q); }).length;
  }
  return passQs.filter(function(q){ return isQDone(q); }).length;
}

// ── 오늘 배너 렌더 (진도 표시 전용 - 액션 버튼 없음) ──
function renderTodayBanner(){
  var el = document.getElementById('todayPlanBanner');
  if(!el) return;
  var tp = getTodayPlan();
  if(!tp){ el.innerHTML=''; return; }

  if(tp.status==='notStarted'){
    el.innerHTML='<div class="today-plan-banner"><div class="tpb-round">📅 플랜 예정</div>'
      +'<div class="tpb-main">시작일: <span>'+tp.plan.startDate+'</span></div>'
      +'<div class="tpb-sub">아직 시작 전입니다. D-'+diffDays(todayStr(),tp.plan.startDate)+'</div>'
      +'<div class="tpb-sub" style="margin-top:4px;font-size:11px;opacity:.7;">대시보드에서 플랜을 수정할 수 있어요.</div>'
      +'</div>';
    return;
  }
  if(tp.status==='weekend'){
    el.innerHTML='<div class="today-plan-banner" style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8)">'
      +'<div class="tpb-round">🏖 주말</div>'
      +'<div class="tpb-main">오늘은 <span>쉬는 날</span>이에요!</div>'
      +'<div class="tpb-sub">주말 제외 플랜 적용 중 · 내일 학습이 이어집니다.</div>'
      +'</div>';
    return;
  }
  if(tp.status==='done'){
    el.innerHTML='<div class="today-plan-banner" style="background:linear-gradient(135deg,#064e3b,#065f46)">'
      +'<div class="tpb-round">🏆 플랜 완료</div>'
      +'<div class="tpb-main">시험 준비 완료!</div>'
      +'<div class="tpb-sub">수고하셨습니다.</div>'
      +'</div>';
    return;
  }

  var _bannerToday = todayStr();
  var done, total;
  if(tp.passNum >= 2){
    done = getTodayPassDone(tp.passQs, tp.passNum);
    total = tp.passQs.length;
  } else {
    done = parseInt(localStorage.getItem('act_'+_bannerToday)||'0');
    total = tp.todayInitialQuota || tp.passQs.length;
  }
  var pct = total>0 ? Math.round(done/total*100) : 0;
  var passLabel = ['1차 (전체 지문)','2차 (△·X 지문)','3차 (△·X 지문)'][tp.passNum-1];
  var roundLabel = tp.round+'회독 '+tp.globalPass+'차';
  var passClass = ['p1','p2','p3'][tp.passNum-1];
  var modeIcon = tp.isFullPass ? '📖' : '🔁';

  // 2차이상인데 오늘 복습 대상 없으면 완료 표시
  if(tp.passNum>1 && total===0){
    el.innerHTML='<div class="today-plan-banner" style="background:linear-gradient(135deg,#064e3b,#065f46)">'
      +'<div class="tpb-round">✅ '+roundLabel+'</div>'
      +'<div class="tpb-main">오늘 <span>'+passLabel+'</span> 완료!</div>'
      +'<div class="tpb-sub">틀리거나 헷갈린 지문이 없어요 🎉 &nbsp;·&nbsp; 대시보드에서 다음 차수로 이동하세요.</div>'
      +'</div>';
    return;
  }

  // 완료 여부
  var isDone = (pct >= 100);
  var statusBar = isDone
    ? '<div class="tpb-pct" style="color:#6ee7b7;font-weight:700;"><span>✅ '+done+'/'+total+' 완료!</span><span>대시보드에서 다음 차수로 이동하세요 →</span></div>'
    : '<div class="tpb-pct"><span>'+done+'/'+total+' 완료 ('+pct+'%)</span><span>D-'+tp.daysLeft+'일 남음</span></div>';

  el.innerHTML='<div class="today-plan-banner">'
    +'<div class="tpb-round">'+modeIcon+' '+tp.round+'회독 Day '+tp.dayInRound+'/'+tp.roundDays+' &nbsp;·&nbsp; D-'+tp.daysLeft+'</div>'
    +'<div class="tpb-main"><span class="pass-badge '+passClass+'">'+roundLabel+'</span> '+passLabel+'</div>'
    +'<div class="tpb-sub">오늘 범위: Q'+(tp.startIdx+1)+'~Q'+tp.endIdx+' ('+tp.todayQs.length+'문제) &nbsp;·&nbsp; 현재 차수: '+total+'문항</div>'
    +'<div class="tpb-progress"><div class="tpb-fill" style="width:'+pct+'%"'+(isDone?' style="background:linear-gradient(90deg,#34d399,#059669)"':'')+'></div></div>'
    + statusBar
    +'</div>';
}

// 자동 큐: 오늘 분량 + 1차 학습 시 밀린 분량 흡수
// (어제 잔여 1차/2차/3차 + 오늘 1차/2차/3차 순서로 자동 진행)
function getStudyQueue(){
  var tp = getTodayPlan();
  if(!tp || tp.status !== 'active') return null;
  var passQs = tp.passQs.slice();
  var extraCount = 0;
  if(tp.isFullPass){
    var allQ = getPlanQuestions();
    var notDone = allQ.filter(function(q){ return !isQDone(q); });
    var inToday = {};
    passQs.forEach(function(q){ inToday[q.id] = true; });
    var extras = notDone.filter(function(q){ return !inToday[q.id]; });
    var room = Math.max(0, tp.qPerDay - passQs.length);
    if(room > 0 && extras.length > 0){
      var add = extras.slice(0, room);
      passQs = passQs.concat(add);
      extraCount = add.length;
    }
  }
  return { tp: tp, passQs: passQs, isFullPass: tp.isFullPass, extraCount: extraCount };
}

// 메인 '이어서 학습 시작' 버튼 핸들러
// 현재 차수 완료 시 → 다음 차수 자동 진입
// 미완료 시 → 모드 자동 전환 (1차=학습모드 / 2,3차=복습모드)
function handleMainStudyBtn(){
  var tp = getTodayPlan();
  if(!tp || tp.status !== 'active') return;
  var _hmsbToday = todayStr();
  var done0, total0;
  if(tp.passNum >= 2){
    done0 = getTodayPassDone(tp.passQs, tp.passNum);
    total0 = tp.passQs.length;
  } else {
    done0 = parseInt(localStorage.getItem('act_'+_hmsbToday)||'0');
    total0 = tp.todayInitialQuota || tp.passQs.length;
  }
  var curIsDone = (total0 > 0 && done0 >= total0);
  if(curIsDone && tp.passNum < 3){
    advancePass();
    return;
  }
  var queue = getStudyQueue();
  if(queue && queue.isFullPass){
    planStudyMode = true;
    planStudyQIds = queue.passQs.map(function(q){ return q.id; });
    setMode('plan');
  } else {
    planStudyMode = false;
    setMode('review');
  }
  window.scrollTo({ top: 200, behavior: 'smooth' });
}

// 단원별 진도율 접기/펼치기 토글 (대시보드)
function toggleUnitsCollapse(){
  var el = document.getElementById('dashUnits');
  var title = document.getElementById('unitsTitle');
  if(!el || !title) return;
  var open = el.style.display !== 'none';
  if(open){
    el.style.display = 'none';
    title.classList.remove('open');
    localStorage.setItem('dash_units_open', '0');
  } else {
    el.style.display = '';
    title.classList.add('open');
    localStorage.setItem('dash_units_open', '1');
  }
}

// ── 마이그레이션 마법사 (대시보드 흐름 v4 적용 안내) ─────────
function analyzeMigrationGap(){
  var allQ = getPlanQuestions();
  var tp = getTodayPlan();
  if(!tp || tp.status !== 'active') return null;
  var firstPassDone = allQ.filter(function(q){ return isQDone(q); }).length;
  var gap = allQ.filter(function(q){ return hasWrongOrConfused(q); }).length;
  return { firstPassDone: firstPassDone, gap: gap };
}

function closeMigrationOverlay(){
  var el = document.getElementById('migrationOverlay');
  if(el && el.parentNode) el.parentNode.removeChild(el);
}

function _buildMigrationModal(title, subtitle, result, showDefer){
  var overlay = document.createElement('div');
  overlay.className = 'migration-overlay';
  overlay.id = 'migrationOverlay';
  overlay.innerHTML = '<div class="migration-modal">'
    + '<h3>'+title+'</h3>'
    + '<p class="msub">'+subtitle+'</p>'
    + '<div class="mresult">'
    + '<div class="mresult-row">✓ 1차 학습 완료: '+result.firstPassDone+'문제</div>'
    + '<div class="mresult-row warn">⚠ 2/3차 복습 누락: 약 '+result.gap+'문제</div>'
    + '</div>'
    + '<p style="font-size:12px;color:rgba(255,255,255,.55);margin:0 0 12px;font-family:Pretendard,sans-serif;">처리 방법을 선택해 주세요:</p>'
    + '<button class="migration-btn mprimary" onclick="migrateAutoDistribute()">📅 자동 분산 <span style="font-size:11.5px;font-weight:500;opacity:.85;">— 시험일까지 균등 분배 (추천)</span></button>'
    + '<button class="migration-btn msecondary" onclick="migrateSkip()">⏭ 건너뛰기 — 누락분 포기, 새 흐름 즉시 시작</button>'
    + (showDefer ? '<button class="migration-btn mtext" onclick="migrateDefer()">나중에 결정</button>' : '')
    + '</div>';
  document.body.appendChild(overlay);
}

// 마이그레이션 마법사 표시 (migration_v4_done 없을 때)
function showMigrationWizard(){
  if(localStorage.getItem('migration_v4_done')) return;
  var result = analyzeMigrationGap();
  if(!result) return;
  if(result.gap <= 20){
    // 소량 누락 → 자동 흡수 (모달 없음)
    localStorage.setItem('migration_v4_done', 'auto');
    return;
  }
  _buildMigrationModal('🎯 새 학습 흐름이 적용됐어요', '기존 학습 데이터를 분석했습니다', result, true);
}

// D-30: 강제 결정 (나중에 버튼 없음)
function showMigrationWizardForced(){
  if(localStorage.getItem('migration_v4_done')) return;
  var result = analyzeMigrationGap();
  if(!result) return;
  _buildMigrationModal('⚠ 지금 결정하셔야 해요!', '시험까지 30일 이하 — 더 이상 미루기 어려워요', result, false);
}

// 자동 분산: replanFromToday 로직을 confirm 없이 실행
function migrateAutoDistribute(){
  closeMigrationOverlay();
  var plan = loadPlan();
  if(!plan){ localStorage.setItem('migration_v4_done','distribute'); return; }
  var allQ = getPlanQuestions();
  var today = todayStr();
  var tp = getTodayPlan();
  if(!tp || tp.status !== 'active'){
    localStorage.setItem('migration_v4_done','distribute');
    showToast('✅ 새 학습 흐름으로 시작합니다', 3000);
    return;
  }
  var ri = tp.round - 1;
  var curRound = plan.rounds[ri];
  var remainDays = Math.max(1, getAvailStudyDays(today, curRound.endDate));
  var remainQs = allQ.filter(function(q){ return !isQDone(q); });
  plan.rounds[ri].qPerDay = Math.max(1, Math.ceil(remainQs.length / remainDays));
  plan.rounds[ri].adjusted = true;
  var actualWrongCount = allQ.filter(function(q){ return hasWrongOrConfused(q); }).length;
  for(var i = ri + 1; i < plan.rounds.length; i++){
    var r = plan.rounds[i];
    var setScale = i <= 2 ? 1.0 : (i <= 5 ? 0.85 : 0.70);
    var tc = r.isFullRound ? allQ.length : Math.max(1, Math.round(actualWrongCount * setScale));
    plan.rounds[i].qPerDay = Math.max(1, Math.ceil(tc / Math.max(1, r.days)));
    plan.rounds[i].adjusted = true;
  }
  savePlanData(plan);
  localStorage.setItem('migration_v4_done', 'distribute');
  renderDashboard();
  showToast('✅ 누락 분량이 시험일까지 균등 분배됩니다', 3500);
}

function migrateSkip(){
  closeMigrationOverlay();
  localStorage.setItem('migration_v4_done', 'skip');
  showToast('⏭ 새 학습 흐름으로 바로 시작합니다', 3000);
}

function migrateDefer(){
  closeMigrationOverlay();
  if(!localStorage.getItem('migration_v4_deferred_at')){
    localStorage.setItem('migration_v4_deferred_at', new Date().toISOString());
  }
  showToast('⏰ 나중에 다시 안내드릴게요', 2500);
}

// 점진적 압박 알림 (1주 이내=점, 1~2주=배너, 1개월/D-60=큰 모달, D-30=강제 결정)
function showMigrationDot(){
  if(document.getElementById('migrationChip')) return;
  var chip = document.createElement('button');
  chip.className = 'migration-chip';
  chip.id = 'migrationChip';
  chip.textContent = '⚠ 누락 학습 처리';
  chip.onclick = function(){ showMigrationWizard(); };
  document.body.appendChild(chip);
}

function showMigrationBanner(){
  if(document.getElementById('migrationBanner')) return;
  var result = analyzeMigrationGap();
  if(!result) return;
  var banner = document.createElement('div');
  banner.className = 'migration-banner';
  banner.id = 'migrationBanner';
  banner.onclick = showMigrationWizard;
  banner.innerHTML = '<span class="migration-banner-text">⚠ 처리 안 된 누락 학습 약 '+result.gap+'문제 — 탭해서 처리하기</span>'
    + '<span style="font-size:13px;color:rgba(255,255,255,.4);">›</span>';
  var dashSection = document.getElementById('dashTodaySection');
  if(dashSection && dashSection.parentNode){
    dashSection.parentNode.insertBefore(banner, dashSection);
  }
}

function checkMigrationPressure(){
  if(localStorage.getItem('migration_v4_done')) return;
  var deferredAt = localStorage.getItem('migration_v4_deferred_at');
  if(!deferredAt) return;
  var tp = getTodayPlan ? getTodayPlan() : null;
  if(!tp || tp.status !== 'active') return;
  var elapsed = Math.round((Date.now() - new Date(deferredAt).getTime()) / (1000*60*60*24));
  var dLeft = tp.daysLeft || 999;
  if(dLeft <= 30){
    showMigrationWizardForced();
  } else if(elapsed >= 30 || dLeft <= 60){
    showMigrationWizard();
  } else if(elapsed >= 7){
    showMigrationBanner();
  } else {
    showMigrationDot();
  }
}

// 토스트 알림
function showToast(msg, duration){
  duration = duration || 3000;
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e2540;color:#fff;padding:11px 20px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.4);z-index:9999;font-family:Pretendard,sans-serif;white-space:nowrap;opacity:0;transition:opacity .25s;border:1px solid rgba(255,255,255,.12);';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function(){ el.style.opacity = '1'; }, 10);
  setTimeout(function(){
    el.style.opacity = '0';
    setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 300);
  }, duration);
}

// 새 디자인 첫 진입 안내 토스트 (1회만)
function checkNewDesignToast(){
  if(localStorage.getItem('migration_v4_shown')) return;
  var tp = getTodayPlan ? getTodayPlan() : null;
  if(!tp || tp.status !== 'active') return;
  setTimeout(function(){
    showToast('✨ 새 학습 흐름이 적용됐어요 · 버튼 하나로 이어서 학습!', 4500);
    localStorage.setItem('migration_v4_shown', '1');
  }, 1000);
}

// 오늘 학습 시작: 1/4/7차 → 학습모드(plan), 나머지 → 복습모드
function startTodayStudy(){
  var tp = getTodayPlan();
  if(!tp||tp.status!=='active') return;
  if(!tp.isFullPass){
    // 2/3차: 복습모드 (임시 판정, 원본 무영향)
    planStudyMode = false;
    setMode('review');
  } else {
    // 1차: 플랜 범위 내 오늘 분량만 plan 모드로 표시
    planStudyMode = true;
    // tp.passQs는 getPlanQuestions() 기반이므로 그대로 사용
    planStudyQIds = tp.passQs.map(function(q){return q.id;});
    setMode('plan');
  }
  window.scrollTo({top:200, behavior:'smooth'});
}

var planStudyMode = false;
var planStudyQIds = [];

// 다음 차수로 넘어가기
function advancePass(){
  var tp = getTodayPlan();
  if(!tp||tp.status!=='active') return;
  var nextPass = tp.passNum + 1;
  if(nextPass > 3){
    setMode('dash');
    setTimeout(function(){
      renderDashboard();
      var el = document.getElementById('ratioAlertBanner');
      if(el){
        el.style.display='block';
        el.innerHTML='<div style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:10px;padding:14px 16px;margin-bottom:10px;">'
          +'<div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:4px;">🎉 오늘 3차까지 모두 완료!</div>'
          +'<div style="font-size:12px;color:rgba(255,255,255,.8);margin-bottom:10px;">내일 다음 범위로 이어집니다. 오늘도 수고하셨어요!</div>'
          +'<div style="display:flex;gap:6px;flex-wrap:wrap;">'
          +'<button onclick="this.parentElement.parentElement.parentElement.style.display=\'none\'" style="padding:7px 12px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.2);border-radius:7px;font-size:12px;cursor:pointer;font-family:Pretendard,sans-serif;">닫기</button>'
          +'</div></div>';
      }
    }, 100);
    return;
  }
  setTodayPassNum(todayStr(), tp.round-1, nextPass);
  renderTodayBanner();
  var tp2 = getTodayPlan();
  if(!tp2||tp2.status!=='active') return;
  // 2/3차는 복습모드 (△X 필터)
  if(!tp2.isFullPass){
    planStudyMode = false;
    setMode('review');
  } else {
    planStudyMode = true;
    planStudyQIds = tp2.passQs.map(function(q){return q.id;}); // getPlanQuestions 기반
    setMode('plan');
  }
  window.scrollTo({top:200, behavior:'smooth'});
}

// 이전 차수로 되돌아가기
function retreatPass(){
  var tp = getTodayPlan();
  if(!tp||tp.status!=='active') return;
  var prevPass = tp.passNum - 1;
  if(prevPass < 1){
    alert('이미 1차입니다.');
    return;
  }
  if(!confirm(prevPass+'차로 되돌아갈까요?\n(이번 차수의 임시 판정은 유지됩니다)')) return;
  setTodayPassNum(todayStr(), tp.round-1, prevPass);
  renderTodayBanner();
  var tp2 = getTodayPlan();
  if(!tp2||tp2.status!=='active') return;
  if(!tp2.isFullPass){
    planStudyMode = false;
    setMode('review');
  } else {
    planStudyMode = true;
    planStudyQIds = tp2.passQs.map(function(q){return q.id;});
    setMode('plan');
  }
  renderDashboard();
  window.scrollTo({top:200, behavior:'smooth'});
}

// ── 기능1: 남은 일수 → 회독 수 추천 ──────────────────
function calcMinDaysForGoal(d1, r, goal){
  // calcPlan과 동일한 비율 사용 (D4×0.85, D7×0.70, 3회독=r×0.8)
  var D1=d1;
  var D4=Math.max(3,Math.round(D1*0.85));
  var D7=Math.max(3,Math.round(D1*0.70));
  var allDays=[
    D1,
    Math.max(3, Math.round(D1*r)),
    Math.max(2, Math.round(D1*r*0.8)),
    D4,
    Math.max(3, Math.round(D4*r)),
    Math.max(2, Math.round(D4*r*0.8)),
    D7,
    Math.max(3, Math.round(D7*r)),
    Math.max(2, Math.round(D7*r*0.8))
  ];
  return allDays.slice(0,goal).reduce(function(s,d){return s+d;},0);
}

function getRecommendedGoal(availDays, d1, r){
  // 가능한 최대 목표 반환 (3/6/9 중)
  if(availDays >= calcMinDaysForGoal(d1,r,9)) return 9;
  if(availDays >= calcMinDaysForGoal(d1,r,6)) return 6;
  if(availDays >= calcMinDaysForGoal(d1,r,3)) return 3;
  return 3; // 최소한 3회독
}

function selectGoal(n){
  planGoalRounds = n;
  [3,6,9].forEach(function(g){
    var btn = document.getElementById('goalBtn'+g);
    if(!btn) return;
    btn.className = 'plan-goal-btn' + (g===n ? ' act'+n : '');
  });
  updatePlanPreview();
}

// ═══════════════════════════════════════════
// 단원 범위 선택 UI
// ═══════════════════════════════════════════
// 플랜 진행 중 범위 변경 경고 체크
function _warnScopeChange(){
  var plan = loadPlan();
  if(!plan) return true; // 플랜 없으면 자유롭게 변경
  var tp = getTodayPlan();
  if(!tp || tp.status !== 'active') return true;
  // 1회독 1차 시작 전이면 경고 불필요
  if(tp.round === 1 && tp.passNum === 1 && tp.dayInRound === 1) return true;
  return confirm(
    '⚠️ 플랜 진행 중 범위 변경\n\n'
    + '현재 ' + tp.round + '회독 ' + tp.passNum + '차 진행 중입니다.\n'
    + '범위를 변경하면 오늘 분량 계산이 달라질 수 있습니다.\n\n'
    + '변경하시겠습니까?\n'
    + '(플랜 재조정이 필요하면 대시보드에서 "일정 재조정"을 해주세요)'
  );
}

function selectScope(mode){
  if(mode !== planScopeMode && !_warnScopeChange()) return; // 취소
  planScopeMode = mode;
  document.getElementById('scopeTabAll').className  = 'scope-tab'+(mode==='all'?' act':'');
  document.getElementById('scopeTabGwa').className  = 'scope-tab'+(mode==='gwa'?' act':'');
  document.getElementById('scopeTabUnit').className = 'scope-tab'+(mode==='unit'?' act':'');
  document.getElementById('scopeUnitPanel').style.display = mode==='unit'?'block':'none';
  if(mode==='unit' && planScopeIds.length===0){
    planScopeIds = getPlanScopeAllMidIds();
    renderScopeUnitList();
  }
  updateScopeCount();
  updatePlanPreview();
}

function scopeSelectAll(select){
  if(!_warnScopeChange()) return;
  if(select){ planScopeIds = getPlanScopeAllMidIds(); }
  else { planScopeIds = []; }
  renderScopeUnitList();
  updateScopeCount();
  updatePlanPreview();
}

function toggleScopeParent(parentId, select){
  if(!_warnScopeChange()) return;
  var p = MENU.find(function(x){ return x.id===parentId; }); if(!p) return;
  p.mids.forEach(function(m){
    if(m.hasSub){
      m.subs.forEach(function(s){
        var idx = planScopeIds.indexOf(s.id);
        if(select && idx<0) planScopeIds.push(s.id);
        else if(!select && idx>=0) planScopeIds.splice(idx,1);
      });
    } else {
      var idx = planScopeIds.indexOf(m.id);
      if(select && idx<0) planScopeIds.push(m.id);
      else if(!select && idx>=0) planScopeIds.splice(idx,1);
    }
  });
  renderScopeUnitList();
  updateScopeCount();
  updatePlanPreview();
}

function toggleScopeMid(midId){
  if(!_warnScopeChange()) return;
  var idx = planScopeIds.indexOf(midId);
  if(idx>=0) planScopeIds.splice(idx,1);
  else planScopeIds.push(midId);
  renderScopeUnitList();
  updateScopeCount();
  updatePlanPreview();
}

function renderScopeUnitList(){
  var container = document.getElementById('scopeUnitList');
  if(!container) return;
  container.innerHTML = '';
  MENU.forEach(function(p){
    // 대단원 내 모든 중단원 id 수집
    var allMidIds = [];
    p.mids.forEach(function(m){
      if(m.hasSub){ m.subs.forEach(function(s){ allMidIds.push(s.id); }); }
      else { allMidIds.push(m.id); }
    });
    var checkedCount = allMidIds.filter(function(id){ return planScopeIds.indexOf(id)>=0; }).length;
    var isAll = checkedCount === allMidIds.length;
    var isNone = checkedCount === 0;
    var isPartial = !isAll && !isNone;

    var box = document.createElement('div'); box.className='scope-unit-box';

    // 대단원 헤더
    var header = document.createElement('div'); header.className='scope-parent';
    // 체크박스 (indeterminate 처리)
    var cb = document.createElement('input'); cb.type='checkbox'; cb.checked=isAll; cb.indeterminate=isPartial;
    cb.style.cssText='cursor:pointer;accent-color:var(--c0);width:14px;height:14px;';
    cb.onchange=(function(pid){ return function(){ toggleScopeParent(pid, this.checked); }; })(p.id);
    header.appendChild(cb);
    var lbl = document.createElement('span'); lbl.className='scope-parent-label';
    lbl.textContent = p.label + ' (' + checkedCount + '/' + allMidIds.length + ')';
    header.appendChild(lbl);
    var bAll = document.createElement('button'); bAll.className='scope-parent-btn'; bAll.textContent='전체';
    bAll.onclick=(function(pid){ return function(){ toggleScopeParent(pid,true); }; })(p.id);
    var bNone = document.createElement('button'); bNone.className='scope-parent-btn'; bNone.textContent='해제';
    bNone.onclick=(function(pid){ return function(){ toggleScopeParent(pid,false); }; })(p.id);
    header.appendChild(bAll); header.appendChild(bNone);
    box.appendChild(header);

    // 중단원 목록
    var midsDiv = document.createElement('div'); midsDiv.className='scope-mids';
    p.mids.forEach(function(m){
      var units = m.hasSub ? m.subs : [m];
      units.forEach(function(u){
        var qCount = (u.data||[]).length;
        var checked = planScopeIds.indexOf(u.id) >= 0;
        var item = document.createElement('label'); item.className='scope-mid-item';
        var uCb = document.createElement('input'); uCb.type='checkbox'; uCb.checked=checked;
        uCb.onchange=(function(uid){ return function(){ toggleScopeMid(uid); }; })(u.id);
        item.appendChild(uCb);
        var txt = document.createTextNode(u.label + ' (' + qCount + ')');
        item.appendChild(txt);
        midsDiv.appendChild(item);
      });
    });
    box.appendChild(midsDiv);
    container.appendChild(box);
  });
}

function updateScopeCount(){
  var el = document.getElementById('scopeCountLabel'); if(!el) return;
  var cnt = getPlanQuestions().length;
  el.textContent = '선택된 문항: ' + cnt + '문항';
  el.style.color = cnt===0 ? 'var(--wrong)' : 'var(--c0)';
  // D1 힌트 텍스트도 업데이트
  var hint = document.getElementById('planD1Hint');
  if(hint) hint.textContent = '일 (' + cnt + '문항 기준, 권장 ' + Math.max(7, Math.ceil(cnt/27)) + '일)';
}

function openPlanOverlay(){
  var plan = loadPlan();
  var today = todayStr();
  var goal = plan ? (plan.goalRounds||9) : 9;
  planGoalRounds = goal;
  if(plan){
    document.getElementById('planExamDate').value  = plan.examDate;
    document.getElementById('planStartDate').value = plan.startDate;
    document.getElementById('planD1').value        = plan.d1||21;
    planIncludeWeekend = plan.includeWeekend !== false;
    // 저장된 범위 복원
    planScopeMode = plan.scopeMode || 'all';
    planScopeIds  = plan.scopeIds  || [];
  } else {
    document.getElementById('planStartDate').value = today;
    document.getElementById('planD1').value        = 21;
    planIncludeWeekend = true;
    planScopeMode = 'all';
    planScopeIds  = [];
  }
  // 범위 탭 UI 복원
  document.getElementById('scopeTabAll').className  = 'scope-tab'+(planScopeMode==='all'?' act':'');
  document.getElementById('scopeTabGwa').className  = 'scope-tab'+(planScopeMode==='gwa'?' act':'');
  document.getElementById('scopeTabUnit').className = 'scope-tab'+(planScopeMode==='unit'?' act':'');
  document.getElementById('scopeUnitPanel').style.display = planScopeMode==='unit'?'block':'none';
  if(planScopeMode==='unit'){ renderScopeUnitList(); }
  updateScopeCount();
  selectGoal(goal);
  selectWeekend(planIncludeWeekend);
  updatePlanPreview();
  document.getElementById('planOverlay').style.display='flex';
  // 중복 등록 방지: 기존 핸들러 제거 후 재등록
  ['planExamDate','planStartDate','planD1'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    el.removeEventListener('input', updatePlanPreview);
    el.addEventListener('input', updatePlanPreview);
  });
}
function closePlanOverlay(){ document.getElementById('planOverlay').style.display='none'; }

// ── 현재 회독 학습 데이터 초기화 ─────────────────────────
// state(O/△/X) + rv(복습 판정) + act(날짜별 학습량) 를 삭제하고
// Firebase에도 즉시 반영 → 재로그인 시 오염된 이전 데이터 복원 방지
// 초기화 완료 후 시작일 조정(shiftRoundStartToToday) 여부를 함께 제안
function resetCurrentRoundData(){
  var tp0    = (typeof getTodayPlan === 'function') ? getTodayPlan() : null;
  var ri     = (tp0 && tp0.round) ? tp0.round - 1 : null;
  var rLabel = (ri !== null) ? (ri + 1) + '회독' : '현재 회독';

  if(!confirm(
    '🔄 ' + rLabel + ' 학습 데이터 초기화\n\n' +
    '아래 데이터가 모두 삭제됩니다:\n' +
    '  • O/△/X 판정 결과 (state)\n' +
    '  • 복습 판정 기록 (rv)\n' +
    '  • 날짜별 학습량 기록 (act)\n\n' +
    'Firebase에도 즉시 반영되어\n다른 기기에서 재로그인 시에도 초기화가 유지됩니다.\n\n' +
    '※ 회독 플랜 설정(시험일·일정)은 유지됩니다.\n\n' +
    '정말 초기화하시겠습니까?'
  )) return;

  // 1. state 초기화 (메모리 + localStorage)
  state = {};
  saveState();

  // 2. rv_*, act_*, today_quota_*, pass_day_*, act1_* 키 일괄 삭제
  var toRemove = [];
  for(var i = 0; i < localStorage.length; i++){
    var k = localStorage.key(i);
    if(!k) continue;
    if(k.indexOf('rv_')          === 0 ||
       k.indexOf('today_quota_') === 0 ||
       k.indexOf('pass_day_')    === 0 ||
       k.indexOf('act1_')        === 0 ||
       /^act_\d{4}-\d{2}-\d{2}$/.test(k) ||
       k === 'act_오늘'){
      toRemove.push(k);
    }
  }
  toRemove.forEach(function(k){ localStorage.removeItem(k); });

  // 3. UI 갱신 (Firebase 응답 전에 먼저)
  renderAll(); updateProg();
  setMode('dash');
  setTimeout(function(){ renderDashboard(); }, 100);

  // 4. Firebase 반영 후 완료 알림 + 시작일 조정 제안
  function _afterReset(fbOk, errMsg){
    var plan2   = loadPlan();
    var today   = todayStr();
    var ri2     = (tp0 && tp0.round) ? tp0.round - 1 : 0;
    var curRnd  = plan2 && plan2.rounds && plan2.rounds[ri2];
    var curStart= curRnd ? curRnd.startDate : null;

    var fbLine = fbOk    ? 'Firebase에도 반영됐습니다.' :
                 errMsg  ? '⚠️ Firebase 반영 실패: ' + errMsg + '\n수동 동기화를 눌러 반영하세요.' :
                           '(Firebase 미연결 — 로그인 후 수동 동기화를 눌러 반영하세요)';

    // 시작일이 오늘 이전이면 조정 제안
    if(curStart && curStart < today){
      if(confirm(
        '✅ ' + rLabel + ' 초기화 완료!\n' + fbLine + '\n\n' +
        '──────────────────────\n' +
        '📅 회독 시작일 조정\n\n' +
        '현재 설정된 시작일: ' + curStart + '\n\n' +
        '캘린더에 빈 날짜가 표시되지 않도록\n' +
        '시작일을 오늘(' + today + ')로 조정할까요?\n\n' +
        '[확인] 오늘로 조정   [취소] 기존 날짜 유지'
      )){
        shiftRoundStartToToday(true); // true = silent (alert 없이 실행)
      }
    } else {
      alert('✅ ' + rLabel + ' 초기화 완료!\n' + fbLine +
        '\n\n대시보드 → 이어서 학습하기로 시작하세요.');
    }
  }

  if(currentUser && firebaseReady && fbDb){
    fbDb.ref('users/' + currentUser.uid).update({ state: {}, rv: null, act: null })
      .then(function(){ _afterReset(true,  null); })
      .catch(function(e){ _afterReset(false, e.message); });
  } else {
    _afterReset(false, null);
  }
}

// ── 현재 회독 시작일을 오늘로 조정 ──────────────────────
// · plan.rounds[ri].startDate = today
// · 남은 일수(today ~ endDate) 기준으로 qPerDay 재계산
// · round_reset 키도 새 startDate로 갱신
// silent=true면 완료 alert 없이 renderDashboard만 호출
function shiftRoundStartToToday(silent){
  var plan = loadPlan();
  if(!plan || !plan.rounds){ if(!silent) alert('플랜이 없습니다.'); return; }

  var tp   = (typeof getTodayPlan === 'function') ? getTodayPlan() : null;
  var ri   = (tp && tp.round) ? tp.round - 1 : null;
  if(ri === null){ if(!silent) alert('진행 중인 회독을 찾을 수 없습니다.'); return; }

  var curRound = plan.rounds[ri];
  var today    = todayStr();

  // 마감일이 이미 지난 경우 → 조정 불가
  if(curRound.endDate < today){
    if(!silent) alert(
      '현재 회독 마감일(' + curRound.endDate + ')이 이미 지났습니다.\n' +
      '"일정 재조정" 버튼을 이용해 주세요.'
    );
    return;
  }
  // 이미 오늘이 시작일
  if(curRound.startDate === today){
    if(!silent) alert('이미 오늘(' + today + ')이 시작일입니다.');
    return;
  }

  var oldStart = curRound.startDate;

  // 남은 학습 가능 일수 (주말 포함 여부 반영)
  var remainDays = Math.max(1, getAvailStudyDays(today, curRound.endDate));

  // 대상 문항 수
  var allQ = getPlanQuestions();
  var targetCount;
  if(curRound.isFullRound){
    targetCount = allQ.length;
  } else {
    targetCount = allQ.filter(function(q){ return hasWrongOrConfused(q); }).length;
    if(!targetCount) targetCount = allQ.length;
  }
  var newQpd = Math.max(1, Math.ceil(targetCount / remainDays));

  // 플랜 업데이트
  plan.rounds[ri].startDate = today;
  plan.rounds[ri].qPerDay   = newQpd;
  plan.rounds[ri].days      = Math.max(1, diffDays(today, curRound.endDate) + 1); // 캘린더 중복 방지
  plan.rounds[ri].adjusted  = true;

  // round_reset 키를 새 startDate 기준으로 갱신
  // (기존 키 그대로 두면 앱이 "초기화 하시겠습니까?" 재질문)
  var oldKey = 'round_reset_' + curRound.round + '_' + oldStart;
  var newKey = 'round_reset_' + curRound.round + '_' + today;
  var resetTs = localStorage.getItem(oldKey) || String(Date.now());
  localStorage.removeItem(oldKey);
  localStorage.setItem(newKey, resetTs);

  savePlanData(plan);
  renderDashboard();
  renderTodayBanner();

  if(!silent){
    alert(
      '✅ ' + (ri + 1) + '회독 시작일 조정 완료!\n\n' +
      oldStart + ' → ' + today + '\n' +
      '하루 목표: ' + newQpd + '문제/일\n' +
      '(마감일 ' + curRound.endDate + ' 기준 재계산)'
    );
  }
}

function resetPlanAll(){
  if(!confirm('⚠️ 회독 플랜을 전체 초기화합니다.\n\n설정된 시험일, 목표 회독 수, 일정이 모두 삭제됩니다.\n(학습 진도 데이터는 유지됩니다)\n\n초기화하시겠습니까?')) return;
  // 현재 사용자 키로 플랜 삭제
  localStorage.removeItem(getPlanKey());
  // 오늘 차수 기록도 정리 (pass_day_ 로 시작하는 키)
  Object.keys(localStorage).forEach(function(k){
    if(k.indexOf('pass_day_')===0 || k.indexOf('round_reset_')===0) localStorage.removeItem(k);
  });
  closePlanOverlay();
  setMode('dash');
  setTimeout(function(){ renderDashboard(); }, 50);
  alert('✅ 회독 플랜이 초기화됐습니다.\n대시보드에서 새로 설정할 수 있습니다.');
}

function updatePlanPreview(){
  var examDate  = document.getElementById('planExamDate').value;
  var startDate = document.getElementById('planStartDate').value;
  var d1Val     = parseInt(document.getElementById('planD1').value||'21');
  var el = document.getElementById('planPreview');
  if(!examDate||!startDate){ el.innerHTML='시험일과 시작일을 모두 입력하세요.'; return; }
  if(examDate<=startDate){ el.innerHTML='<span style="color:var(--wrong)">시험일이 시작일보다 늦어야 합니다.</span>'; return; }

  var allQ2      = getPlanQuestions();
  var rInfo      = calcWrongRatio();
  var r          = rInfo.r;
  var rPct       = Math.round(rInfo.rActual*100);
  var completionPct = Math.round(rInfo.completionRate*100);
  var goal       = planGoalRounds||9;
  var totalAvail = getAvailStudyDays(startDate, examDate);

  // ── 회독 추천 계산: calcPlan 실제 합계 기준 (세부 계획과 1:1 일치) ──
  // calcPlan을 각 목표별로 실행해서 실제 필요 일수 계산
  var plan3 = calcPlan(startDate, examDate, d1Val, 3);
  var plan6 = calcPlan(startDate, examDate, d1Val, 6);
  var plan9 = calcPlan(startDate, examDate, d1Val, 9);
  // 축소 전 원래 필요 일수 (scale 적용 전)
  function calcRawDays(d1, r, goalN){
    var D1=d1, D4=Math.max(3,Math.round(D1*0.85)), D7=Math.max(3,Math.round(D1*0.70));
    var days=[
      D1, Math.max(3,Math.round(D1*r)), Math.max(2,Math.round(D1*r*0.8)),
      D4, Math.max(3,Math.round(D4*r)), Math.max(2,Math.round(D4*r*0.8)),
      D7, Math.max(3,Math.round(D7*r)), Math.max(2,Math.round(D7*r*0.8))
    ];
    return days.slice(0,goalN).reduce(function(s,d){return s+d;},0);
  }
  var raw3 = calcRawDays(d1Val,r,3);
  var raw6 = calcRawDays(d1Val,r,6);
  var raw9 = calcRawDays(d1Val,r,9);
  // 실제 계획 합계 (자동 축소 반영)
  var actual3 = plan3.rounds.reduce(function(s,rd){return s+rd.days;},0);
  var actual6 = plan6.rounds.reduce(function(s,rd){return s+rd.days;},0);
  var actual9 = plan9.rounds.reduce(function(s,rd){return s+rd.days;},0);

  // 추천: 실제 계획이 가용 일수 안에 들어오는 최대 목표
  var recommended = totalAvail>=raw9?9:totalAvail>=raw6?6:3;

  // 추천 배너
  var recHtml = '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 12px;margin-bottom:10px;">';
  recHtml += '<div style="font-size:11.5px;font-weight:700;color:#166534;margin-bottom:6px;">📊 남은 기간 분석 ('+totalAvail+'일)</div>';
  [[3,raw3,actual3,'단기'],[6,raw6,actual6,'표준'],[9,raw9,actual9,'완벽']].forEach(function(arr){
    var g=arr[0], rawD=arr[1], actualD=arr[2], lbl=arr[3];
    var ok = totalAvail >= rawD;   // 축소 없이 가능한지
    var okWithScale = totalAvail >= actualD; // 축소 후 실제 가능한지
    var isRec = g===recommended;
    var surplus = totalAvail - rawD;
    var icon = ok ? '✅' : (okWithScale ? '⚡' : '❌');
    var color = ok ? '#166534' : (okWithScale ? '#92400e' : '#991b1b');
    var badge = isRec ? ' <span style="background:#2563eb;color:#fff;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;">추천</span>' : '';
    var note;
    if(ok){
      note = surplus>0 ? '(+'+surplus+'일 여유)' : '(딱 맞음)';
    } else if(okWithScale){
      note = '(일정 축소 후 '+actualD+'일로 가능)';
    } else {
      note = '('+Math.abs(surplus)+'일 부족)';
    }
    recHtml += '<div style="font-size:11px;color:'+color+';margin-bottom:2px;">'
      +icon+' '+g+'회독 '+lbl+': '+rawD+'일 필요 '+note+badge+'</div>';
  });
  recHtml += '<div style="font-size:11px;color:#1d4ed8;margin-top:6px;cursor:pointer;font-weight:600;" '
    +'onclick="selectGoal('+recommended+')">→ '+recommended+'회독으로 자동 선택</div>';
  recHtml += '</div>';

  // 버튼 상태 업데이트
  [3,6,9].forEach(function(g){
    var btn = document.getElementById('goalBtn'+g);
    if(!btn) return;
    var rawD = g===3?raw3:g===6?raw6:raw9;
    var ok = totalAvail>=rawD;
    var isSelected = g===goal;
    var isRec = g===recommended;
    btn.className = 'plan-goal-btn'+(isSelected?' act'+g:'')+(ok?'':' disabled-goal');
    var span = btn.querySelector('.goal-rec-tag');
    if(!span){ span=document.createElement('span'); span.className='goal-rec-tag'; span.style='display:block;font-size:8px;'; btn.appendChild(span); }
    span.textContent = isRec ? '⭐추천' : (ok ? '가능' : '부족');
    span.style.color = isRec ? '#2563eb' : (ok ? '#059669' : '#dc2626');
  });

  var plan2  = calcPlan(startDate, examDate, d1Val, goal);
  var totalNeeded = plan2.rounds.reduce(function(s,rd){return s+rd.days;},0);
  var warn = totalAvail < totalNeeded
    ? '<div style="color:var(--wrong);font-size:11px;margin-bottom:6px;">⚠️ '+goal+'회독 최소 '+totalNeeded+'일 필요 → 일정 자동 축소</div>'
    : '';

  var doneQ2  = allQ2.filter(function(q){return isQDone(q);});
  var wrongQ2 = allQ2.filter(function(q){return hasWrongOrConfused(q);});
  var progressNote = doneQ2.length>0
    ? '<div style="color:#059669;font-size:11px;margin-bottom:4px;">✅ 기존 완료 '+doneQ2.length+'문항 → 1회독 미완료 '+(allQ2.length-doneQ2.length)+'문항 대상</div>'
    : '';
  var blendNote = completionPct < 70
    ? ' <span style="color:#92400e;font-size:10px;">(판정 '+completionPct+'% → 기본값 혼합 적용 중)</span>'
    : ' <span style="color:#059669;font-size:10px;">(판정 '+completionPct+'% → 실제 비율 반영)</span>';
  var wrongNote = rInfo.judged>0
    ? '<div style="color:var(--warn);font-size:11px;margin-bottom:8px;">📊 실제 △·X '+rPct+'%'+blendNote+' → 적용 비율 '+Math.round(r*100)+'%</div>'
    : '<div style="font-size:11px;color:var(--muted);margin-bottom:8px;">△·X 데이터 없음 → 50% 기본값 적용 (학습 진행 시 자동 조정)</div>';

  var setBreaks = {3:'── 3회독 완료 가능 ──',6:'── 6회독 완료 가능 ──',9:'── 9회독 최종 완료 ──'};
  var modeLabel = function(isFullRound){ return isFullRound ? '📖 학습모드' : '🔁 복습모드(△·X)'; };

  var html = recHtml + warn + progressNote + wrongNote;
  html += '<strong>목표 '+goal+'회독 · 총 '+totalNeeded+'일 (시험까지 '+totalAvail+'일)</strong><br><br>';
  plan2.rounds.forEach(function(rnd){
    var resetMark = rnd.resetBefore ? ' <span style="color:var(--wrong);font-size:10px;">🔄초기화</span>' : '';
    html += '<b>'+rnd.round+'회독</b>'+resetMark+' ('+rnd.days+'일 · ~'+rnd.qPerDay+'문항/일)<br>'
          +'<span style="font-size:10.5px;color:var(--muted);">'+rnd.startDate+' ~ '+rnd.endDate+' · '+modeLabel(rnd.isFullRound)+'</span><br>';
    if(setBreaks[rnd.round]){
      html += '<div style="text-align:center;font-size:10px;color:var(--muted);margin:5px 0;border-top:1px dashed var(--border);padding-top:5px;">'+setBreaks[rnd.round]+'</div>';
    }
  });
  html += '<br>📅 시험일: <strong>'+examDate+'</strong>';
  el.innerHTML = html;
}

function savePlan(){
  var examDate  = document.getElementById('planExamDate').value;
  var startDate = document.getElementById('planStartDate').value;
  var d1Val     = parseInt(document.getElementById('planD1').value||'21');
  var goal      = planGoalRounds||9;
  if(!examDate||!startDate){ alert('시험일과 시작일을 입력하세요.'); return; }
  if(examDate<=startDate){ alert('시험일이 시작일보다 늦어야 합니다.'); return; }
  if(d1Val<3||d1Val>90){ alert('1회독 기간은 3~90일 사이로 입력하세요.'); return; }
  var plan = calcPlan(startDate, examDate, d1Val, goal);
  // 저장 시점의 △·X 비율 + 범위 저장
  plan.savedWrongRatio = plan.wrongRatio;
  plan.scopeMode = planScopeMode;
  plan.scopeIds  = planScopeIds.slice();
  savePlanData(plan);
  closePlanOverlay();
  renderTodayBanner();
  // 플랜 저장 후 항상 대시보드로 전환하고 갱신
  setMode('dash');
  setTimeout(function(){ renderDashboard(); }, 50);
  var summary = plan.rounds.map(function(r){ return r.round+'회독:'+r.days+'일'; }).join(' / ');
  alert('📅 플랜 저장 완료!\n\n목표: '+goal+'회독\n'+summary);
}

// ── 기능2: △·X 비율 변화 감지 + 재조정 알림 ────────────
function checkRatioChange(){
  var plan = loadPlan();
  if(!plan) return null;
  var savedR = plan.savedWrongRatio || 0.5;
  var rInfo = calcWrongRatio();
  var currentR = rInfo.r;
  // 판정 완료율 30% 미만이면 알림 억제 (데이터 부족)
  if(rInfo.completionRate < 0.3) return null;
  var diff = Math.abs(currentR - savedR);
  if(diff < 0.20) return null;
  return {
    savedR:         savedR,
    currentR:       currentR,
    actualR:        rInfo.rActual,
    completionRate: rInfo.completionRate,
    diff:           diff,
    direction:      currentR > savedR ? 'up' : 'down'
  };
}

function renderRatioAlert(){
  var el = document.getElementById('ratioAlertBanner');
  if(!el) return;
  var change = checkRatioChange();
  if(!change){ el.innerHTML=''; el.style.display='none'; return; }
  var savedPct = Math.round(change.savedR*100);
  var curPct   = Math.round(change.currentR*100);
  var msg = change.direction==='up'
    ? '📈 △·X 비율이 예상보다 높아요 ('+savedPct+'% → '+curPct+'%)'
    : '📉 △·X 비율이 예상보다 낮아요 ('+savedPct+'% → '+curPct+'%)';
  var sub = change.direction==='up'
    ? '복습 분량이 늘어납니다. 일정을 재조정하는 게 좋아요.'
    : '복습 분량이 줄었어요! 일정을 재조정하면 더 효율적이에요.';
  el.style.display='block';
  el.innerHTML = '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;margin-bottom:10px;">'
    +'<div style="font-size:12.5px;font-weight:700;color:#92400e;margin-bottom:3px;">'+msg+'</div>'
    +'<div style="font-size:11.5px;color:var(--dim);margin-bottom:8px;">'+sub+'</div>'
    +'<div style="display:flex;gap:6px;">'
    +'<button onclick="replanFromToday()" style="padding:6px 14px;background:#2563eb;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:Pretendard,sans-serif;">📅 지금 재조정</button>'
    +'<button onclick="dismissRatioAlert()" style="padding:6px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;font-size:12px;cursor:pointer;color:var(--dim);font-family:Pretendard,sans-serif;">나중에</button>'
    +'</div></div>';
}

function dismissRatioAlert(){
  // 현재 비율을 savedWrongRatio로 업데이트 (알림 무시)
  var plan = loadPlan();
  if(!plan) return;
  plan.savedWrongRatio = calcWrongRatio().r;
  savePlanData(plan);
  var el = document.getElementById('ratioAlertBanner');
  if(el){ el.innerHTML=''; el.style.display='none'; }
}

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
    var saved = JSON.parse(localStorage.getItem(PLAN_KEY)||'null');
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
    setMode(m);
    renderAll();
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
