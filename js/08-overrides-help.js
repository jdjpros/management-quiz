// ═══════════════════════════════════════════
// 08-overrides-help.js — 주말 옵션 · 회독 알고리즘 오버라이드 · 설명서 패널
// (index.html에서 분리 — 로드 순서 유지 필수)
// ═══════════════════════════════════════════
// ════════════════════════════════════════
// ② 주말 제외 옵션
// ════════════════════════════════════════
var planIncludeWeekend = true;

function selectWeekend(include){
  planIncludeWeekend = include;
  var btnY = document.getElementById('weekendBtnY');
  var btnN = document.getElementById('weekendBtnN');
  var note = document.getElementById('weekendNote');
  if(btnY) btnY.className = 'plan-goal-btn'+(include?' act':'');
  if(btnN) btnN.className = 'plan-goal-btn'+(!include?' act':'');
  if(note){
    if(!include){
      var startDate = document.getElementById('planStartDate').value;
      var examDate  = document.getElementById('planExamDate').value;
      if(startDate&&examDate){
        var wd = countWeekdays(startDate, examDate);
        note.textContent = '평일만 '+wd+'일 학습 (주말 제외)';
      }
    } else { note.textContent=''; }
  }
  updatePlanPreview();
}

// 두 날짜 사이 평일 수 계산
function countWeekdays(start, end){
  var d = parseDate(start), e = parseDate(end), cnt = 0;
  while(d <= e){ var day = d.getDay(); if(day!==0&&day!==6) cnt++; d.setDate(d.getDate()+1); }
  return cnt;
}

// 평일 기준 N일 후 날짜
function addWeekdays(startStr, n){
  var d = parseDate(startStr), cnt = 0;
  while(cnt < n){ d.setDate(d.getDate()+1); var day=d.getDay(); if(day!==0&&day!==6) cnt++; }
  return dateStr(d);
}

// 가용 학습일수 (주말 제외 옵션 반영)
function getAvailStudyDays(startStr, endStr){
  return planIncludeWeekend
    ? diffDays(startStr, endStr)
    : countWeekdays(startStr, endStr);
}

// 학습일수 기준 날짜 계산

// ═══════════════════════════════════════════
// 다음 단원 계산 헬퍼
// ═══════════════════════════════════════════
function getNextUnit(){
  // 현재 단원의 다음 단원 반환 {parent, mid, sub} 또는 null
  var par = MENU.find(function(p){ return p.id===curParent; });
  if(!par) return null;
  var midIdx = par.mids.findIndex(function(m){ return m.id===curMid; });

  if(par.mids[midIdx] && par.mids[midIdx].hasSub){
    var sub = par.mids[midIdx].subs;
    var subIdx = sub.findIndex(function(s){ return s.id===curSubId; });
    if(subIdx < sub.length-1) return {parent:curParent, mid:curMid, sub:sub[subIdx+1].id, label:sub[subIdx+1].label};
    if(midIdx < par.mids.length-1){
      var nm = par.mids[midIdx+1];
      return {parent:curParent, mid:nm.id, sub:nm.hasSub?nm.subs[0].id:null, label:nm.label};
    }
  } else {
    if(midIdx < par.mids.length-1){
      var nm2 = par.mids[midIdx+1];
      return {parent:curParent, mid:nm2.id, sub:nm2.hasSub?nm2.subs[0].id:null, label:nm2.label};
    }
  }
  // 다음 대단원
  var parIdx = MENU.findIndex(function(p){ return p.id===curParent; });
  if(parIdx < MENU.length-1){
    var np = MENU[parIdx+1];
    var nm3 = np.mids[0];
    return {parent:np.id, mid:nm3.id, sub:nm3.hasSub?nm3.subs[0].id:null, label:np.label+' > '+nm3.label};
  }
  return null;
}

// ════════════════════════════════════════
// ④ 회독 알고리즘 수정
// 2차/3차는 "오늘 분량 중 △·X" 가 아니라
// "이 세트(1/4/7회독)에서 발생한 전체 △·X" 기준
// ════════════════════════════════════════

// 현재 세트의 기준 회독이 초기화된 이후 생긴 △·X 전체
function getSetWrongQs(){
  var allQ = getAllQuestions();
  return allQ.filter(function(q){ return hasWrongOrConfused(q); });
}

// getPassQuestions는 07-plan.js로 이동됨 (부트스트랩이 로드 시점에 호출하므로 07에 있어야 함)

// ════════════════════════════════════════
// ① 플랜 저장 버그 수정 (wrongRatio 키 통일)
// ════════════════════════════════════════
// savePlan에서 wrongRatio 저장 시 .r 키 기준으로 통일
// (calcPlan에서 wrongRatio: r 로 저장하므로 일치)

// ════════════════════════════════════════
// ⑥ 진도 미달 처리 옵션 강화
// ════════════════════════════════════════
// ════════════════════════════════════════
// ⑤ 설명서 탭
// ════════════════════════════════════════
function renderHelpPanel(){
  var el = document.getElementById('helpPanel');
  if(!el) return;
  if(!document.getElementById('hvw-styles')){
    var st = document.createElement('style');
    st.id = 'hvw-styles';
    st.textContent =
      '.hvw .vssec{margin:0 0 44px}' +
      '.hvw .vssec-t{font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:14px;display:flex;align-items:center;gap:8px}' +
      '.hvw .vssec-t::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.1)}' +
      '.hvw .vscard{background:#1a2035;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:22px}' +
      '.hvw .vshead{font-size:16px;font-weight:800;color:#fff;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:8px}' +
      '.hvw .jcards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}' +
      '.hvw .jcard{border-radius:12px;padding:20px 14px;text-align:center}' +
      '.hvw .jcard.jo{background:rgba(34,197,94,.15);border:1.5px solid rgba(34,197,94,.4)}' +
      '.hvw .jcard.jtr{background:rgba(249,115,22,.13);border:1.5px solid rgba(249,115,22,.4)}' +
      '.hvw .jcard.jx{background:rgba(239,68,68,.15);border:1.5px solid rgba(239,68,68,.4)}' +
      '.hvw .jicon{font-size:28px;margin-bottom:8px}' +
      '.hvw .jbtn{display:inline-block;padding:5px 16px;border-radius:20px;font-size:15px;font-weight:800;margin-bottom:10px}' +
      '.hvw .jcard.jo .jbtn{background:rgba(34,197,94,.25);color:#4ade80}' +
      '.hvw .jcard.jtr .jbtn{background:rgba(249,115,22,.22);color:#fb923c}' +
      '.hvw .jcard.jx .jbtn{background:rgba(239,68,68,.22);color:#f87171}' +
      '.hvw .jmean{font-size:16px;font-weight:700;color:#fff;margin-bottom:5px}' +
      '.hvw .jsub{font-size:12.5px;color:rgba(255,255,255,.5);margin:4px 0 10px}' +
      '.hvw .jtag{font-size:13px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block}' +
      '.hvw .jcard.jo .jtag{background:rgba(34,197,94,.2);color:#86efac}' +
      '.hvw .jcard.jtr .jtag{background:rgba(249,115,22,.18);color:#fdba74}' +
      '.hvw .jcard.jx .jtag{background:rgba(239,68,68,.18);color:#fca5a5}' +
      '.hvw .jflow{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);border-radius:10px;padding:14px 18px;font-size:13.5px;color:rgba(255,255,255,.7);flex-wrap:wrap}' +
      '.hvw .jflow b{color:#fff}' +
      '.hvw .jfa{color:rgba(255,255,255,.3);font-size:18px}' +
      '.hvw .flwrap{display:flex;align-items:stretch;gap:0;margin-bottom:14px}' +
      '.hvw .fnode{flex:1;border-radius:12px;padding:16px 10px;text-align:center}' +
      '.hvw .fnode.fp1{background:rgba(59,130,246,.18);border:1.5px solid rgba(59,130,246,.4)}' +
      '.hvw .fnode.fp2{background:rgba(249,115,22,.13);border:1.5px solid rgba(249,115,22,.35)}' +
      '.hvw .fnode.fp3{background:rgba(168,85,247,.15);border:1.5px solid rgba(168,85,247,.35)}' +
      '.hvw .fnode.fdone{background:rgba(34,197,94,.15);border:1.5px solid rgba(34,197,94,.4)}' +
      '.hvw .farr{display:flex;align-items:center;padding:0 5px;color:rgba(255,255,255,.3);font-size:20px;flex-shrink:0}' +
      '.hvw .fpass{font-size:13px;font-weight:700;letter-spacing:1px;margin-bottom:8px}' +
      '.hvw .fnode.fp1 .fpass{color:#93c5fd}' +
      '.hvw .fnode.fp2 .fpass{color:#fdba74}' +
      '.hvw .fnode.fp3 .fpass{color:#d8b4fe}' +
      '.hvw .fnode.fdone .fpass{color:#86efac}' +
      '.hvw .fic{font-size:24px;margin-bottom:6px}' +
      '.hvw .flbl{font-size:15px;font-weight:800;color:#fff;margin-bottom:5px}' +
      '.hvw .fsub{font-size:12.5px;color:rgba(255,255,255,.6);line-height:1.6}' +
      '.hvw .ftag{display:inline-block;margin-top:8px;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px}' +
      '.hvw .fnode.fp1 .ftag{background:rgba(59,130,246,.25);color:#93c5fd}' +
      '.hvw .fnode.fp2 .ftag{background:rgba(249,115,22,.2);color:#fdba74}' +
      '.hvw .fnode.fp3 .ftag{background:rgba(168,85,247,.2);color:#d8b4fe}' +
      '.hvw .fnode.fdone .ftag{background:rgba(34,197,94,.2);color:#86efac}' +
      '.hvw .fnote{background:rgba(255,255,255,.05);border-radius:10px;padding:12px 16px;font-size:13px;color:rgba(255,255,255,.6);display:flex;gap:12px;flex-wrap:wrap;line-height:1.7}' +
      '.hvw .fnote b{color:#fff}' +
      '.hvw .rgrid{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}' +
      '.hvw .rset{display:flex;align-items:stretch;gap:8px}' +
      '.hvw .rset-l{width:50px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:rgba(255,255,255,.55);flex-shrink:0;background:rgba(255,255,255,.05);border-radius:8px;padding:4px 6px;text-align:center}' +
      '.hvw .rblocks{display:flex;gap:6px;flex:1}' +
      '.hvw .rblk{flex:1;border-radius:10px;padding:12px 6px;text-align:center}' +
      '.hvw .rblk.rf1{background:rgba(59,130,246,.2);border:1.5px solid rgba(59,130,246,.45)}' +
      '.hvw .rblk.rf2{background:rgba(52,211,153,.15);border:1.5px solid rgba(52,211,153,.4)}' +
      '.hvw .rblk.rf3{background:rgba(249,115,22,.15);border:1.5px solid rgba(249,115,22,.38)}' +
      '.hvw .rblk.rev{background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.15)}' +
      '.hvw .rblk.rst{position:relative}' +
      '.hvw .rblk.rst::before{content:"🔄 초기화";position:absolute;top:-9px;left:50%;transform:translateX(-50%);font-size:9px;font-weight:700;background:#374151;color:#9ca3af;padding:2px 6px;border-radius:4px;white-space:nowrap}' +
      '.hvw .rnum{font-size:16px;font-weight:800;color:#fff;margin-bottom:3px}' +
      '.hvw .ric{font-size:16px;margin-bottom:4px}' +
      '.hvw .rlbl{font-size:12.5px;font-weight:600;color:rgba(255,255,255,.65)}' +
      '.hvw .rleg{display:flex;gap:14px;flex-wrap:wrap;font-size:12.5px;color:rgba(255,255,255,.6)}' +
      '.hvw .rleg span{display:flex;align-items:center;gap:5px}' +
      '.hvw .ldot{width:10px;height:10px;border-radius:3px;flex-shrink:0}' +
      '.hvw .qwrap{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;margin-bottom:14px}' +
      '.hvw .qlbl{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.4);text-align:center;margin-bottom:8px}' +
      '.hvw .qdays{display:flex;flex-direction:column;gap:6px}' +
      '.hvw .qday{border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700}' +
      '.hvw .qday.qm{background:rgba(239,68,68,.13);border:1px solid rgba(239,68,68,.3);color:#fca5a5}' +
      '.hvw .qday.qt{background:rgba(59,130,246,.18);border:1px solid rgba(59,130,246,.4);color:#93c5fd}' +
      '.hvw .qday.qd{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.35);color:#86efac}' +
      '.hvw .qdn{color:rgba(255,255,255,.8);font-weight:600;font-size:13px}' +
      '.hvw .qdc{font-family:monospace}' +
      '.hvw .qdb{font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px}' +
      '.hvw .qday.qm .qdb{background:rgba(239,68,68,.2);color:#f87171}' +
      '.hvw .qday.qt .qdb{background:rgba(59,130,246,.2);color:#60a5fa}' +
      '.hvw .qday.qd .qdb{background:rgba(34,197,94,.2);color:#4ade80}' +
      '.hvw .qarr{display:flex;flex-direction:column;align-items:center;gap:4px;color:rgba(255,255,255,.35)}' +
      '.hvw .qarr small{font-size:10px;font-weight:700;letter-spacing:1px;color:rgba(255,255,255,.3)}' +
      '.hvw .qnote{display:flex;align-items:flex-start;gap:10px;background:rgba(249,115,22,.08);border:1px solid rgba(249,115,22,.25);border-radius:10px;padding:12px 14px;font-size:13px;color:rgba(255,255,255,.7);line-height:1.7}' +
      '.hvw .qnote b{color:#fb923c}' +
      '.hvw .sgrid{display:flex;flex-direction:column}' +
      '.hvw .srow{display:flex;align-items:stretch}' +
      '.hvw .sline{display:flex;flex-direction:column;align-items:center;width:44px;flex-shrink:0}' +
      '.hvw .scirc{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;z-index:1}' +
      '.hvw .scon{width:2px;flex:1;background:rgba(255,255,255,.1);min-height:14px}' +
      '.hvw .scon.last{background:transparent}' +
      '.hvw .sbody{flex:1;padding:2px 0 20px 4px}' +
      '.hvw .stitle{font-size:15px;font-weight:800;color:#fff;margin-bottom:4px;line-height:32px}' +
      '.hvw .sdesc{font-size:13px;color:rgba(255,255,255,.6);line-height:1.7}' +
      '.hvw .srow:nth-child(1) .scirc{background:rgba(59,130,246,.3);color:#93c5fd;border:1.5px solid rgba(59,130,246,.5)}' +
      '.hvw .srow:nth-child(2) .scirc{background:rgba(59,130,246,.3);color:#93c5fd;border:1.5px solid rgba(59,130,246,.5)}' +
      '.hvw .srow:nth-child(3) .scirc{background:rgba(59,130,246,.25);color:#93c5fd;border:1.5px solid rgba(59,130,246,.4)}' +
      '.hvw .srow:nth-child(4) .scirc{background:rgba(249,115,22,.22);color:#fb923c;border:1.5px solid rgba(249,115,22,.45)}' +
      '.hvw .srow:nth-child(5) .scirc{background:rgba(168,85,247,.22);color:#c084fc;border:1.5px solid rgba(168,85,247,.45)}' +
      '.hvw .srow:nth-child(6) .scirc{background:rgba(34,197,94,.22);color:#4ade80;border:1.5px solid rgba(34,197,94,.45)}' +
      '.hvw .srow:nth-child(7) .scirc{background:rgba(249,115,22,.22);color:#fb923c;border:1.5px solid rgba(249,115,22,.45)}';
    document.head.appendChild(st);
  }
  el.innerHTML = '<div style="max-width:920px;margin:0 auto;padding:16px 14px 60px;">'
  + '<div class="dash-section">'
  + '<div class="dash-title">📖 경영학 기출문제집 OX풀이 사용 설명서</div>'
  + '<p style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--dim);margin:4px 0 20px;display:flex;align-items:center;gap:10px;">🖼 한 눈에 보기 <span style="flex:1;height:1px;background:var(--border);display:inline-block;"></span></p>'
  + '<div class="hvw">'
  // ① 판정 버튼
  + '<div class="vssec"><div class="vssec-t">① O / △ / X 판정 버튼</div><div class="vscard">'
  + '<div class="vshead">🔘 판정 버튼 — 각 지문마다 학습 상태를 기록합니다</div>'
  + '<div class="jcards">'
  + '<div class="jcard jo"><div class="jicon">✅</div><div class="jbtn">O</div><div class="jmean">완벽히 알겠다</div><div class="jsub">확실히 이해됨</div><div class="jtag">복습 제외</div></div>'
  + '<div class="jcard jtr"><div class="jicon">🔁</div><div class="jbtn">△</div><div class="jmean">한 번 더 볼게</div><div class="jsub">애매하게 알겠음</div><div class="jtag">복습 포함</div></div>'
  + '<div class="jcard jx"><div class="jicon">❌</div><div class="jbtn">X</div><div class="jmean">모르겠다 / 틀렸다</div><div class="jsub">확실히 모름</div><div class="jtag">복습 포함</div></div>'
  + '</div>'
  + '<div class="jflow"><b>판정 버튼 클릭</b><span class="jfa">→</span>해설 자동 펼침<span class="jfa">→</span><b>△·X 지문</b>은 2차·3차 복습에 자동 포함<span class="jfa">→</span>원본 데이터에 저장</div>'
  + '</div></div>'
  // ② 하루 학습 흐름
  + '<div class="vssec"><div class="vssec-t">② 하루 학습 흐름 (1차 → 2차 → 3차)</div><div class="vscard">'
  + '<div class="vshead">📅 하루 차수 진행 흐름</div>'
  + '<div class="flwrap">'
  + '<div class="fnode fp1"><div class="fpass">1차</div><div class="fic">📖</div><div class="flbl">학습모드</div><div class="fsub">전체 지문<br>O/△/X 판정<br>해설 확인</div><div class="ftag">원본 저장</div></div>'
  + '<div class="farr">→</div>'
  + '<div class="fnode fp2"><div class="fpass">2차</div><div class="fic">🔁</div><div class="flbl">복습모드</div><div class="fsub">△·X 지문만<br>닫힌 상태로 재도전<br>임시 판정</div><div class="ftag">원본 보존</div></div>'
  + '<div class="farr">→</div>'
  + '<div class="fnode fp3"><div class="fpass">3차</div><div class="fic">🔁</div><div class="flbl">복습모드</div><div class="fsub">2차에서 남은<br>△·X 지문 점검<br>임시 판정 리셋</div><div class="ftag">원본 보존</div></div>'
  + '<div class="farr">→</div>'
  + '<div class="fnode fdone"><div class="fpass">완료</div><div class="fic">🎉</div><div class="flbl">오늘 종료</div><div class="fsub">녹색 완료<br>메시지 표시<br>푹 쉬세요</div><div class="ftag">다음날 자동 이어짐</div></div>'
  + '</div>'
  + '<div class="fnote"><div>📌 <b>1차</b>는 원본 O/△/X 데이터에 저장 &nbsp;|&nbsp; <b>2·3차</b>는 임시 판정(rv_*)으로만 저장 — 원본 영향 없음</div><div>💡 대시보드 <b>📚 이어서 학습 시작</b> 버튼 하나로 1차→2차→3차 자동 안내</div></div>'
  + '</div></div>'
  // ③ 9회독 구조
  + '<div class="vssec"><div class="vssec-t">③ 9회독 구조</div><div class="vscard">'
  + '<div class="vshead">🔄 3세트 × 3회독 구조</div>'
  + '<div class="rgrid">'
  + '<div class="rset"><div class="rset-l">세트 1</div><div class="rblocks"><div class="rblk rf1"><div class="ric">📖</div><div class="rnum">1회독</div><div class="rlbl">전체 학습</div></div><div class="rblk rev"><div class="ric">🔁</div><div class="rnum">2회독</div><div class="rlbl">△·X 복습</div></div><div class="rblk rev"><div class="ric">🔁</div><div class="rnum">3회독</div><div class="rlbl">△·X 마무리</div></div></div></div>'
  + '<div class="rset" style="margin-top:18px;"><div class="rset-l">세트 2</div><div class="rblocks"><div class="rblk rf2 rst"><div class="ric">📖</div><div class="rnum">4회독</div><div class="rlbl">전체 재학습</div></div><div class="rblk rev"><div class="ric">🔁</div><div class="rnum">5회독</div><div class="rlbl">△·X 복습</div></div><div class="rblk rev"><div class="ric">🔁</div><div class="rnum">6회독</div><div class="rlbl">△·X 마무리</div></div></div></div>'
  + '<div class="rset" style="margin-top:18px;"><div class="rset-l">세트 3</div><div class="rblocks"><div class="rblk rf3 rst"><div class="ric">📖</div><div class="rnum">7회독</div><div class="rlbl">전체 재학습</div></div><div class="rblk rev"><div class="ric">🔁</div><div class="rnum">8회독</div><div class="rlbl">△·X 복습</div></div><div class="rblk rev"><div class="ric">🔁</div><div class="rnum">9회독</div><div class="rlbl">최종 마무리</div></div></div></div>'
  + '</div>'
  + '<div class="rleg"><span><div class="ldot" style="background:rgba(59,130,246,.65);"></div> 전체 학습 (학습모드)</span><span><div class="ldot" style="background:rgba(255,255,255,.25);"></div> △·X 복습 (복습모드)</span><span><div class="ldot" style="background:#374151;"></div> 🔄 시작 시 판정 데이터 자동 초기화</span></div>'
  + '</div></div>'
  // ④ 이월
  + '<div class="vssec"><div class="vssec-t">④ 이월(밀린 진도) 자동 처리</div><div class="vscard">'
  + '<div class="vshead">📦 밀린 진도는 다음날 큐에 자동 합산됩니다</div>'
  + '<div class="qwrap">'
  + '<div><div class="qlbl">❌ 이전 방식</div><div class="qdays"><div class="qday qm"><span class="qdn">10일</span><span class="qdc">10 / 18</span><span class="qdb">8개 미완</span></div><div class="qday qt"><span class="qdn">11일 큐</span><span class="qdc">18개</span><span class="qdb">새 것만</span></div><div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:10px 12px;font-size:13px;color:#f87171;margin-top:4px;line-height:1.6;">⚠ 10일 잔여 8개가 계속 밀림<br>영원히 뒤처진 상태 지속</div></div></div>'
  + '<div class="qarr"><span style="font-size:26px;">→</span><small>수정 후</small></div>'
  + '<div><div class="qlbl">✅ 현재 방식</div><div class="qdays"><div class="qday qm"><span class="qdn">10일</span><span class="qdc">10 / 18</span><span class="qdb">8개 이월</span></div><div class="qday qt"><span class="qdn">11일 큐</span><span class="qdc">26개</span><span class="qdb">8이월+18</span></div><div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:8px;padding:10px 12px;font-size:13px;color:#4ade80;margin-top:4px;line-height:1.6;">✓ 26개 완료 시<br>10일 🟢 + 11일 🟢 동시 완료</div></div></div>'
  + '</div>'
  + '<div class="qnote"><span style="font-size:15px;">⚠</span><div><b>한도 1.5배 초과 시 자동 알림</b> — 밀린 양이 너무 많아 하루 목표의 1.5배를 넘으면 대시보드에 경고 배너와 <b>📅 일정 재조정</b> 버튼이 자동 표시됩니다<br><span style="color:rgba(255,255,255,.45);font-size:12px;">예: 하루 18문제 기준 → 한도 27문제. 초과 시 알림 발동</span></div></div>'
  + '</div></div>'
  // ⑤ 권장 학습 순서
  + '<div class="vssec"><div class="vssec-t">⑤ 권장 학습 순서</div><div class="vscard">'
  + '<div class="vshead">🗺 이 순서대로 하면 됩니다</div>'
  + '<div class="sgrid">'
  + '<div class="srow"><div class="sline"><div class="scirc">1</div><div class="scon"></div></div><div class="sbody"><div class="stitle">📅 회독 플랜 설정</div><div class="sdesc">대시보드 → 시험일 + 학습 범위 입력 → 9회독 전체 일정 자동 계산</div></div></div>'
  + '<div class="srow"><div class="sline"><div class="scirc">2</div><div class="scon"></div></div><div class="sbody"><div class="stitle">📚 이어서 학습 시작</div><div class="sdesc">대시보드의 버튼 하나 클릭 → 시스템이 오늘 차수와 모드를 자동 안내</div></div></div>'
  + '<div class="srow"><div class="sline"><div class="scirc">3</div><div class="scon"></div></div><div class="sbody"><div class="stitle">📖 1차 — 학습모드</div><div class="sdesc">오늘 분량 지문 읽기 → O / △ / X 판정 → 해설 확인 → 원본 저장</div></div></div>'
  + '<div class="srow"><div class="sline"><div class="scirc">4</div><div class="scon"></div></div><div class="sbody"><div class="stitle">🔁 2차 — 복습모드</div><div class="sdesc">1차에서 △·X 표시한 지문을 닫힌 상태로 다시 풀기 (임시 판정, 원본 보존)</div></div></div>'
  + '<div class="srow"><div class="sline"><div class="scirc">5</div><div class="scon"></div></div><div class="sbody"><div class="stitle">🔁 3차 — 복습모드</div><div class="sdesc">2차에서 남은 △·X 지문 마지막 점검 → 모두 완료 시 차수 자동 종료</div></div></div>'
  + '<div class="srow"><div class="sline"><div class="scirc">6</div><div class="scon"></div></div><div class="sbody"><div class="stitle">🎉 오늘 완료 — 쉬기</div><div class="sdesc">녹색 완료 메시지 확인 후 오늘 학습 종료. 앞당기지 않아도 됩니다</div></div></div>'
  + '<div class="srow"><div class="sline"><div class="scirc">7</div><div class="scon last"></div></div><div class="sbody"><div class="stitle">🎯 파이널체크 (시험 직전)</div><div class="sdesc">남은 △·X 지문 해설 읽고 O/△/X 판정 → O로 맞힌 지문은 다음 세션에서 자동 제외</div></div></div>'
  + '</div>'
  + '</div></div>'
  + '</div>' // end .hvw
  // 구분선
  + '<div style="display:flex;align-items:center;gap:12px;margin:36px 0 28px;">'
  + '<div style="flex:1;height:1px;background:var(--border);"></div>'
  + '<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--dim);">📋 항목별 상세 설명</span>'
  + '<div style="flex:1;height:1px;background:var(--border);"></div>'
  + '</div>'
  + '<div style="font-size:13px;color:var(--dim);line-height:1.9;">'

  // ① 판정 버튼
  + '<p style="font-weight:800;color:var(--text);font-size:14px;margin:16px 0 6px;padding-bottom:4px;border-bottom:2px solid var(--border);">① 판정 버튼 (O / △ / X)</p>'
  + '<p style="margin-bottom:8px;">각 지문마다 판정 버튼을 눌러 학습 상태를 기록합니다. 판정 후 해당 지문의 해설이 펼쳐집니다.</p>'
  + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin:0 0 6px;">'
  + '<tr style="background:var(--surface2);"><th style="padding:7px 10px;text-align:left;border:1px solid var(--border);">버튼</th><th style="padding:7px 10px;text-align:left;border:1px solid var(--border);">의미</th><th style="padding:7px 10px;text-align:left;border:1px solid var(--border);">복습 대상</th></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);">✅ O</td><td style="padding:7px 10px;border:1px solid var(--border);">완벽히 알겠다</td><td style="padding:7px 10px;border:1px solid var(--border);">제외</td></tr>'
  + '<tr style="background:var(--surface2);"><td style="padding:7px 10px;border:1px solid var(--border);">🔁 △</td><td style="padding:7px 10px;border:1px solid var(--border);">한 번 더 볼게</td><td style="padding:7px 10px;border:1px solid var(--border);">포함</td></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);">❌ X</td><td style="padding:7px 10px;border:1px solid var(--border);">모르겠다 / 틀렸다</td><td style="padding:7px 10px;border:1px solid var(--border);">포함</td></tr>'
  + '</table>'
  + '<p style="font-size:11.5px;color:var(--muted);margin-bottom:4px;">💡 △와 X로 표시한 지문이 복습모드와 파이널체크의 대상이 됩니다.</p>'

  // ② 상단 진도 표시
  + '<p style="font-weight:800;color:var(--text);font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid var(--border);">② 상단 진도 표시 (실시간)</p>'
  + '<p style="margin-bottom:6px;">화면 상단의 칩(진도/완벽/헷갈림/모름)은 <b>현재 모드와 플랜 상태에 따라 자동으로 기준이 바뀝니다.</b></p>'
  + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin:0 0 8px;">'
  + '<tr style="background:var(--surface2);"><th style="padding:7px 10px;text-align:left;border:1px solid var(--border);">상황</th><th style="padding:7px 10px;text-align:left;border:1px solid var(--border);">진도 칩 기준</th></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);">플랜 있고 1차 (학습모드)</td><td style="padding:7px 10px;border:1px solid var(--border);"><b>오늘 분량 문항 수</b> (예: 12/28)</td></tr>'
  + '<tr style="background:var(--surface2);"><td style="padding:7px 10px;border:1px solid var(--border);">플랜 있고 2·3차 (복습모드)</td><td style="padding:7px 10px;border:1px solid var(--border);"><b>오늘 △·X 문항 수</b> (예: 5/14)</td></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);">플랜 없고 학습모드</td><td style="padding:7px 10px;border:1px solid var(--border);">현재 선택 단원 전체</td></tr>'
  + '<tr style="background:var(--surface2);"><td style="padding:7px 10px;border:1px solid var(--border);">파이널체크</td><td style="padding:7px 10px;border:1px solid var(--border);">플랜 범위 전체</td></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);">대시보드</td><td style="padding:7px 10px;border:1px solid var(--border);">플랜 범위 전체 (실시간 갱신)</td></tr>'
  + '</table>'
  + '<p style="font-size:11.5px;color:var(--muted);margin-bottom:4px;">💡 오늘 분량을 모두 완료하면 완료 배너가 표시됩니다.</p>'

  // ③ 4가지 모드
  + '<p style="font-weight:800;color:var(--text);font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid var(--border);">③ 4가지 학습 모드</p>'

  + '<p style="font-weight:700;color:var(--c0);margin:10px 0 3px;">📖 학습모드</p>'
  + '<ul style="padding-left:18px;margin:0 0 8px;">'
  + '<li>단원별 <b>전체 지문</b>을 처음부터 학습합니다 (1·4·7회독 1차에 해당)</li>'
  + '<li>판정 버튼(O/△/X)을 누르면 해설이 펼쳐지고 <b>원본 데이터에 저장</b>됩니다</li>'
  + '<li>모든 지문을 판정하면 해당 문제의 풀이 팁이 표시됩니다</li>'
  + '<li>플랜이 있으면 상단 칩이 <b>오늘 분량 기준</b>으로 표시됩니다</li>'
  + '</ul>'

  + '<p style="font-weight:700;color:var(--c2);margin:10px 0 3px;">🔁 복습모드</p>'
  + '<ul style="padding-left:18px;margin:0 0 8px;">'
  + '<li>학습모드에서 <b>△(한 번 더 볼게)</b> 또는 <b>X를 눌렀는데 실제 지문이 O인 경우</b>(=틀린 지문)만 복습 대상으로 표시됩니다</li>'
  + '<li>지문 자체가 X이고 X로 판정한 경우(=맞은 것)는 복습 대상에서 제외됩니다</li>'
  + '<li>지문은 <b>닫힌 상태</b>로 시작 — 판정 버튼을 눌러야 해설이 열립니다</li>'
  + '<li>복습모드의 O/△/X 판정은 <b>임시 저장</b>으로, 원본 데이터에 영향을 주지 않습니다</li>'
  + '<li>다음 차수(예: 2차→3차)가 되면 임시 판정이 리셋되어 <b>지문이 다시 닫힌 상태</b>로 나타납니다</li>'
  + '<li>플랜이 있으면 상단 칩이 <b>오늘 △·X 문항 기준</b>으로 표시됩니다</li>'
  + '<li><b>🗑 복습 초기화</b> 버튼(상단 액션 바)을 누르면 임시 판정만 삭제 — 원본 데이터(△·X 지문 목록) 보존</li>'
  + '</ul>'

  + '<p style="font-weight:700;color:var(--correct);margin:10px 0 3px;">🎯 파이널체크</p>'
  + '<ul style="padding-left:18px;margin:0 0 8px;">'
  + '<li>전체 단원에서 현재 △·X로 남아있는 <b>모든 지문</b>을 한 번에 모아서 보여줍니다</li>'
  + '<li>해설이 <b>처음부터 펼쳐진 상태</b>로 표시 — 읽고 암기하는 용도</li>'
  + '<li>O/△/X 버튼으로 판정 — <b>원본 데이터에 영향 없음</b> (파이널 전용 저장소)</li>'
  + '<li><b>O로 맞힌 지문</b>은 다음 파이널체크 진입 시 자동 제외 (졸업)</li>'
  + '<li>△·X는 계속 남아있어 반복해서 읽을 수 있습니다</li>'
  + '<li>🔄 다시 풀기: 졸업 지문 유지하고 나머지 판정만 초기화</li>'
  + '<li>상단 카운터로 <b>졸업 / 남은 / 전체</b> 수를 실시간 확인</li>'
  + '<li>시험 직전 최종 암기 점검용으로 사용하세요</li>'
  + '</ul>'

  + '<p style="font-weight:700;color:var(--c1);margin:10px 0 3px;">📊 대시보드</p>'
  + '<ul style="padding-left:18px;margin:0 0 8px;">'
  + '<li>오늘의 회독 플랜 현황 및 진행률 확인 (통합 다크 카드)</li>'
  + '<li><b>📚 이어서 학습 시작</b> 버튼 하나로 차수 자동 진행 (1차 → 2차 → 3차)</li>'
  + '<li>밀린 분량은 자동으로 흡수 — 별도 조작 불필요</li>'
  + '<li>밀린 분량이 일일 목표의 <b>1.5배 초과</b> 시 한도 알림 + 📅 재조정 버튼 자동 표시</li>'
  + '<li>3차 완료 시 🎉 녹색 완료 메시지 표시 — 충분한 휴식 권장</li>'
  + '<li>회독별 일일 학습현황 (회독 탭 + 다크 캘린더, 날짜 클릭 시 해당 범위 학습 가능)</li>'
  + '<li>단원별 진도율 (다크 한 줄 압축, 기본 접힘 — 제목 클릭으로 펼침/접기)</li>'
  + '<li>단원 선택 범위 설정 시 범위 밖 단원은 흐리게 표시</li>'
  + '</ul>'

  // ④ 9회독 구조
  + '<p style="font-weight:800;color:var(--text);font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid var(--border);">④ 9회독 구조</p>'
  + '<p style="margin-bottom:8px;">3개 세트로 나뉘며, 각 세트는 <b>1차(전체 학습)</b> + <b>2·3차(복습)</b>로 구성됩니다.<br>4회독과 7회독 시작 시 판정 데이터가 초기화되고 전체를 다시 학습합니다.</p>'
  + '<table style="width:100%;border-collapse:collapse;font-size:12px;margin:0 0 8px;">'
  + '<tr style="background:var(--surface2);"><th style="padding:7px 10px;text-align:left;border:1px solid var(--border);">세트</th><th style="padding:7px 10px;text-align:left;border:1px solid var(--border);">회독</th><th style="padding:7px 10px;text-align:left;border:1px solid var(--border);">모드</th><th style="padding:7px 10px;text-align:left;border:1px solid var(--border);">비고</th></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);" rowspan="3">세트1</td><td style="padding:7px 10px;border:1px solid var(--border);">1회독</td><td style="padding:7px 10px;border:1px solid var(--border);">📖 학습모드 (전체)</td><td style="padding:7px 10px;border:1px solid var(--border);">-</td></tr>'
  + '<tr style="background:var(--surface2);"><td style="padding:7px 10px;border:1px solid var(--border);">2회독</td><td style="padding:7px 10px;border:1px solid var(--border);">🔁 복습모드 (△·X)</td><td style="padding:7px 10px;border:1px solid var(--border);">-</td></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);">3회독</td><td style="padding:7px 10px;border:1px solid var(--border);">🔁 복습모드 (△·X)</td><td style="padding:7px 10px;border:1px solid var(--border);">-</td></tr>'
  + '<tr style="background:var(--surface2);"><td style="padding:7px 10px;border:1px solid var(--border);" rowspan="3">세트2</td><td style="padding:7px 10px;border:1px solid var(--border);">4회독</td><td style="padding:7px 10px;border:1px solid var(--border);">📖 학습모드 (전체)</td><td style="padding:7px 10px;border:1px solid var(--border);">🔄 자동 초기화</td></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);">5회독</td><td style="padding:7px 10px;border:1px solid var(--border);">🔁 복습모드 (△·X)</td><td style="padding:7px 10px;border:1px solid var(--border);">-</td></tr>'
  + '<tr style="background:var(--surface2);"><td style="padding:7px 10px;border:1px solid var(--border);">6회독</td><td style="padding:7px 10px;border:1px solid var(--border);">🔁 복습모드 (△·X)</td><td style="padding:7px 10px;border:1px solid var(--border);">-</td></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);" rowspan="3">세트3</td><td style="padding:7px 10px;border:1px solid var(--border);">7회독</td><td style="padding:7px 10px;border:1px solid var(--border);">📖 학습모드 (전체)</td><td style="padding:7px 10px;border:1px solid var(--border);">🔄 자동 초기화</td></tr>'
  + '<tr style="background:var(--surface2);"><td style="padding:7px 10px;border:1px solid var(--border);">8회독</td><td style="padding:7px 10px;border:1px solid var(--border);">🔁 복습모드 (△·X)</td><td style="padding:7px 10px;border:1px solid var(--border);">-</td></tr>'
  + '<tr><td style="padding:7px 10px;border:1px solid var(--border);">9회독</td><td style="padding:7px 10px;border:1px solid var(--border);">🔁 복습모드 (△·X)</td><td style="padding:7px 10px;border:1px solid var(--border);">최종 마무리</td></tr>'
  + '</table>'

  // ⑤ 회독 플랜 설정
  + '<p style="font-weight:800;color:var(--text);font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid var(--border);">⑤ 회독 플랜 설정</p>'
  + '<ul style="padding-left:18px;margin:0 0 8px;">'
  + '<li>시험일과 시작일을 입력하면 <b>9회독 전체 일정을 자동 계산</b>합니다</li>'
  + '<li>남은 기간에 따라 3회독 / 6회독 / 9회독 중 달성 가능한 목표를 추천합니다</li>'
  + '<li><b>주말 포함/제외</b> 선택 가능 (평일만 학습할 경우)</li>'
  + '<li>1회독 목표 기간을 직접 설정할 수 있습니다 (기본 21일 권장)</li>'
  + '<li>회독 일수 기준: 1회독 D1, 4회독 D1×0.85, 7회독 D1×0.70 (반복으로 속도 증가)</li>'
  + '<li>2·3회독은 1회독에서 체크된 △·X 지문 수가 고정이므로 동일한 양을 봅니다</li>'
  + '<li>△·X 비율이 ±20% 이상 변하면 일정 재조정 알림이 표시됩니다</li>'
  + '<li><b>⚠ 한도 1.5배 초과 알림</b> — 오늘 분량(밀린 분량 포함)이 일일 목표의 1.5배를 넘으면 대시보드에 경고 알림과 <b>📅 일정 재조정</b> 버튼이 자동으로 표시됩니다 (예: 평소 30문제/일 → 한도 45문제)</li>'
  + '<li>플랜 설정 탭의 <b>🗑 전체 초기화</b> 버튼으로 플랜만 삭제 (학습 데이터 보존)</li>'
  + '<li>로그인한 사용자마다 <b>독립적인 플랜</b>을 가집니다</li>'
  + '</ul>'

  // ⑥ 단원 선택 범위
  + '<p style="font-weight:800;color:var(--text);font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid var(--border);">⑥ 단원 선택 범위</p>'
  + '<ul style="padding-left:18px;margin:0 0 8px;">'
  + '<li>플랜 설정에서 <b>🌐 전범위</b> 또는 <b>📂 단원 선택</b>으로 학습 범위를 지정할 수 있습니다</li>'
  + '<li>단원 선택 시 대단원 전체 선택/해제 버튼과 중단원 체크박스로 세부 조정 가능</li>'
  + '<li>선택된 문항 수와 권장 1회독 기간이 실시간으로 표시됩니다</li>'
  + '<li>선택 범위는 플랜 일수 계산, 대시보드 진도, 파이널체크 등 모든 곳에 반영됩니다</li>'
  + '<li>플랜 진행 중 범위를 변경하면 경고 팝업이 표시됩니다</li>'
  + '<li>대시보드 캘린더 상단에 현재 선택 범위가 표시됩니다</li>'
  + '<li>학습 화면 상단 단원 사이드바에는 <b>좌우 화살표(‹ ›)</b>가 있어 대단원/중단원/소단원 탭이 화면을 넘칠 때 가로 스크롤로 이전·다음 단원을 빠르게 이동할 수 있습니다</li>'
  + '</ul>'

  // ⑦ 동기화 및 계정
  + '<p style="font-weight:800;color:var(--text);font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid var(--border);">⑦ 동기화 및 계정</p>'
  + '<ul style="padding-left:18px;margin:0 0 8px;">'
  + '<li><b>구글 로그인</b> 시 모든 기기에서 자동 동기화 (변경 후 0.5초)</li>'
  + '<li>로그인한 계정마다 학습 데이터와 회독 플랜이 독립적으로 저장됩니다</li>'
  + '<li>오프라인에서 학습 후 접속 시 로컬과 클라우드 중 <b>더 많이 진행된 데이터</b>를 선택할 수 있습니다</li>'
  + '<li>로그인 없이 시작 시 이 기기 로컬에만 저장됩니다</li>'
  + '<li>카카오톡·네이버 앱 내 브라우저에서는 Google 로그인이 제한됩니다 — 안내 화면에서 주소를 복사해 Chrome/Safari로 열어주세요</li>'
  + '<li>삼성 인터넷 브라우저에서도 구글 로그인이 지원됩니다</li>'
  + '</ul>'

  // ⑧ 기타 기능
  + '<p style="font-weight:800;color:var(--text);font-size:14px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid var(--border);">⑧ 기타 기능</p>'
  + '<ul style="padding-left:18px;margin:0 0 16px;">'
  + '<li><b>🔍 검색</b> — 지문, 선택지, 해설 전체를 키워드로 검색</li>'
  + '<li><b>🗑 복습 초기화</b> — 복습모드의 임시 판정만 삭제. 원본 데이터(△·X 지문 목록)는 유지됩니다 (학습/복습 화면 상단 액션 바)</li>'
  + '<li><b>📊 단원별 진도율 카드 접기/펼치기</b> — 대시보드 단원별 진도율 카드는 <b>기본 접힘 상태</b>로 시작합니다. 카드 제목을 클릭하면 펼쳐지고, 펼친 상태는 다음 진입까지 유지됩니다</li>'
  + '<li><b>전체 초기화</b> — 모든 O/△/X 판정 데이터를 완전히 삭제 (학습 처음부터 다시 시작)</li>'
  + '<li><b>뒤로가기 버튼</b> — 앱이 닫히지 않도록 방지됩니다</li>'
  + '<li><b>🎯 새 학습 흐름 안내 (마이그레이션)</b> — 새 버전 첫 진입 시, 기존에 누락된 2/3차 복습 분량을 분석해 처리 방법을 선택할 수 있습니다 (📅 자동 분산 / ⏭ 건너뛰기 / 나중에 결정). 나중에 결정한 경우 경과 기간에 따라 작은 점 → 배너 → 모달 순서로 안내가 점진적으로 강해집니다</li>'
  + '</ul>'

  // 권장 학습 순서
  + '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 14px;margin-top:4px;">'
  + '<p style="font-weight:700;color:#166534;margin-bottom:6px;">💡 권장 학습 순서</p>'
  + '<ol style="padding-left:18px;margin:0;font-size:12.5px;color:var(--dim);line-height:2.2;">'
  + '<li>📅 대시보드에서 <b>회독 플랜 설정</b> (시험일 + 학습 범위 입력)</li>'
  + '<li>📚 대시보드의 <b>이어서 학습 시작</b> 버튼을 눌러 오늘 차수 학습 시작 (시스템이 자동으로 1차→2차→3차 안내)</li>'
  + '<li>📖 <b>1차 (학습모드)</b> — 오늘 분량 지문 읽고 O/△/X 판정 → 해설 확인 → 원본 저장</li>'
  + '<li>🔁 <b>2차 (복습모드)</b> — △·X 지문을 닫힌 상태로 다시 풀기 (임시 판정, 원본 보존)</li>'
  + '<li>🔁 <b>3차 (복습모드)</b> — 2차에서 남은 △·X 지문 마지막 점검</li>'
  + '<li>🎉 3차 완료 후 녹색 완료 메시지 확인 — 오늘 학습 종료, 푹 쉬기</li>'
  + '<li>🎯 시험 직전 <b>파이널체크</b>에서 남은 △·X 지문 O/△/X 판정 → O 맞힌 지문은 다음 세션에서 자동 제외</li>'
  + '</ol>'
  + '</div>'

  + '</div>'
  + '</div>'
  + '</div>';
}

// 설명서 탭 버튼 추가 (setMode 연동)
