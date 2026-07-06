// ═══════════════════════════════════════════
// 02-tabs-modes.js — 메뉴 헬퍼 · 탭 렌더링 · 모드 전환 · 필터 · 검색 · BULK · needsReview · parseBoxStem
// (index.html에서 분리 — 로드 순서 유지 필수)
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// 메뉴 헬퍼
// ═══════════════════════════════════════════
function getCurrentData(){
  var p=MENU.find(function(x){return x.id===curParent;}); if(!p) return [];
  var m=p.mids.find(function(x){return x.id===curMid;}); if(!m) return [];
  if(m.hasSub){ var s=m.subs.find(function(x){return x.id===curSubId;}); return s?s.data:(m.subs[0]?m.subs[0].data:[]); }
  return m.data||[];
}
function getCurrentLabel(){
  var p=MENU.find(function(x){return x.id===curParent;}); if(!p) return '';
  var m=p.mids.find(function(x){return x.id===curMid;}); if(!m) return '';
  if(m.hasSub){ var s=m.subs.find(function(x){return x.id===curSubId;}); return s?s.label:m.label; }
  return m.label;
}

// ═══════════════════════════════════════════
// 대단원 탭 가로 스크롤 화살표
// ═══════════════════════════════════════════
function scrollParentTabs(dir){
  var el=document.getElementById('parentTabs');
  if(el) el.scrollBy({left: dir*120, behavior:'smooth'});
}
(function(){
  var el=document.getElementById('parentTabs');
  if(!el) return;
  el.addEventListener('wheel',function(e){
    if(Math.abs(e.deltaX)>Math.abs(e.deltaY)) return;
    e.preventDefault();
    el.scrollBy({left: e.deltaY*1.2, behavior:'auto'});
  },{passive:false});
})();

// ═══════════════════════════════════════════
// 탭 렌더링
// ═══════════════════════════════════════════
function renderTabs(){
  var pt=document.getElementById('parentTabs'); pt.innerHTML='';
  MENU.forEach(function(p){
    var el=document.createElement('div');
    el.className='ptab'+(p.id===curParent?' act':'');
    el.textContent=p.label;
    el.onclick=function(){ curParent=p.id; selectMid(p.mids[0]); };
    pt.appendChild(el);
  });
  // 활성 탭이 보이도록 스크롤
  setTimeout(function(){
    var actTab=pt.querySelector('.ptab.act');
    if(actTab) actTab.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
  },50);
  var mt=document.getElementById('midTabs'); mt.innerHTML='';
  var par=MENU.find(function(p){return p.id===curParent;}); if(!par) return;
  par.mids.forEach(function(m,mi){
    var el=document.createElement('div');
    var isAct=m.id===curMid;
    el.className='mtab'+(m.hasSub?' has-sub':'')+(isAct?' act':'');
    var cnt=m.hasSub?m.subs.reduce(function(a,s){return a+s.data.length;},0):(m.data||[]).length;
    el.innerHTML=m.label+' <span class="mbadge">'+cnt+'</span>';
    el.onclick=function(){ selectMid(m); };
    mt.appendChild(el);
  });
  var subBar=document.getElementById('subBar');
  var st=document.getElementById('subTabs'); st.innerHTML='';
  var mid=par.mids.find(function(m){return m.id===curMid;});
  if(mid&&mid.hasSub){
    subBar.classList.remove('hidden');
    mid.subs.forEach(function(s){
      var el=document.createElement('div');
      el.className='stab'+(s.id===curSubId?' act':'');
      el.innerHTML=s.label+' <span class="sbadge">'+s.data.length+'</span>';
      el.onclick=function(){ selectSub(s.id); };
      st.appendChild(el);
    });
  } else { subBar.classList.add('hidden'); }
}
function selectMid(mid){ curMid=mid.id; curSubId=mid.hasSub?mid.subs[0].id:null; masteryFilter=null; clearSearch(); renderTabs(); renderAll(); }
function selectSub(subId){ curSubId=subId; masteryFilter=null; clearSearch(); renderTabs(); renderAll(); }

// ═══════════════════════════════════════════
// 모드
// ═══════════════════════════════════════════
function setMode(m){
  mode=m;
  document.getElementById('btnDash').className='tbtn'+(m==='dash'?' act':'');
  document.getElementById('btnAll').className='tbtn'+(m==='all'?' act':'');
  document.getElementById('btnReview').className='tbtn'+(m==='review'?' ract':'');
  document.getElementById('btnGlobalReview').className='tbtn'+(m==='final'?' act':'');
  document.getElementById('btnHelp').className='tbtn'+(m==='help'?' act':'');
  document.getElementById('btnReviewReset').style.display=(m==='review')?'inline-block':'none';
  document.getElementById('btnFcReset').style.display=(m==='final')?'inline-block':'none';
  document.getElementById('btnResetAll').style.display=(m==='all'||m==='plan')?'inline-block':'none';
  document.getElementById('btnRoundReset').style.display=(m==='dash')?'inline-block':'none';
  var dashPanel=document.getElementById('dashPanel');
  var helpPanel=document.getElementById('helpPanel');
  var mainCont=document.getElementById('qContainer');
  var progWrap=document.querySelector('.prog-wrap');
  var resultBanner=document.getElementById('resultBanner');
  var bulkBar=document.getElementById('bulkBar');
  var todayBanner=document.getElementById('todayPlanBanner');
  // 모든 패널 초기화
  if(dashPanel) dashPanel.className='dash-panel';
  if(helpPanel) helpPanel.style.display='none';
  if(m==='dash'){
    if(dashPanel) dashPanel.className='dash-panel active';
    if(mainCont) mainCont.style.display='none';
    if(progWrap) progWrap.style.display='none';
    if(resultBanner) resultBanner.style.display='none';
    if(bulkBar) bulkBar.style.display='none';
    if(todayBanner) todayBanner.style.display='none';
    // 대시보드에서는 단원 탭/검색바 전부 숨김 (겹침 방지 + 불필요 제거)
    var _pb=document.querySelector('.parent-bar');
    var _mb=document.querySelector('.mid-bar');
    var _sb=document.getElementById('subBar');
    var _srch=document.getElementById('searchBar');
    if(_pb) _pb.style.display='none';
    if(_mb) _mb.style.display='none';
    if(_sb) _sb.style.display='none';
    if(_srch) _srch.style.display='none';
    renderDashboard();
  } else if(m==='help'){
    if(helpPanel){ helpPanel.style.display='block'; renderHelpPanel(); }
    if(mainCont) mainCont.style.display='none';
    if(progWrap) progWrap.style.display='none';
    if(resultBanner) resultBanner.style.display='none';
    if(bulkBar) bulkBar.style.display='none';
    if(todayBanner) todayBanner.style.display='none';
  } else {
    if(mainCont) mainCont.style.display='';
    if(progWrap) progWrap.style.display='';
    if(resultBanner) resultBanner.style.display='';
    if(todayBanner) todayBanner.style.display='';
    // 파이널체크는 전범위이므로 단원 탭 숨김
    var parentBar=document.querySelector('.parent-bar');
    var midBar=document.querySelector('.mid-bar');
    var subBar2=document.getElementById('subBar');
    var searchBar=document.getElementById('searchBar');
    if(m==='final'){
      if(parentBar) parentBar.style.display='none';
      if(midBar) midBar.style.display='none';
      if(subBar2) subBar2.style.display='none';
      if(searchBar) searchBar.style.display='none';
    } else {
      if(parentBar) parentBar.style.display='';
      if(midBar) midBar.style.display='';
      if(subBar2) subBar2.style.display='';
      if(searchBar) searchBar.style.display='';
    }
    renderAll();
  }
}
function resetAll(){
  if(!confirm('⚠️ 전체 초기화\n\n모든 O/△/X 판단, 해설 열람 기록이\n완전히 삭제됩니다.\n\n정말 초기화하시겠습니까?')) return;
  state={}; saveState(); mode='all';
  document.getElementById('btnDash').className='tbtn';
  document.getElementById('btnAll').className='tbtn act';
  document.getElementById('btnReview').className='tbtn';
  document.getElementById('btnReviewReset').style.display='none';
  document.getElementById('btnResetAll').style.display='inline-block';
  renderAll(); updateProg();
}
function resetReview(){
  if(!confirm('⚠️ 복습 초기화\n\n이번 복습 세션의 임시 판정이 초기화됩니다.\n(학습모드의 O/△/X 원본 데이터는 유지)\n\n초기화하시겠습니까?')) return;
  // 임시 판정 키(rv_*)만 삭제 → 원본 state 영향 없음
  var rvPrefix = 'rv_';
  Object.keys(localStorage).forEach(function(k){
    if(k.indexOf(rvPrefix)===0) localStorage.removeItem(k);
  });
  renderAll(); updateProg();
}

// 학습모드 탭 클릭 - 복습 차수 중이면 경고
function onClickStudyMode(){
  var tp = (typeof getTodayPlan==='function') ? getTodayPlan() : null;
  if(tp && tp.status==='active' && !tp.isFullPass){
    if(!confirm(
      '⚠️ 현재 '+tp.round+'회독 '+tp.passNum+'차 (복습 차수)입니다.\n\n'
      +'학습모드로 이동하면 오늘 범위 전체 지문이 표시되며\n'
      +'O/△/X 판정이 원본 데이터에 저장됩니다.\n\n'
      +'복습 진행 중에는 🔁 복습모드를 권장합니다.\n\n'
      +'그래도 학습모드로 이동할까요?'
    )) return;
  }
  setMode('all');
}

// ═══════════════════════════════════════════
// 필터
// ═══════════════════════════════════════════
function setMasteryFilter(level){
  masteryFilter=(masteryFilter===level)?null:level;
  renderBulkBar(); renderAll();
}
function applyMasteryFilter(){
  if(!masteryFilter){ document.querySelectorAll('#qContainer .qcard').forEach(function(c){c.style.display='';}); return; }
  var Qs=getCurrentData(); var cnt=0;
  document.querySelectorAll('#qContainer .qcard').forEach(function(card){
    var qId=card.id.replace('q-','');
    var q=Qs.find(function(x){return x.id===qId;});
    if(!q){card.style.display='none';return;}
    var mv=gq(qId).mastery||null;
    if(mv===masteryFilter){card.style.display='';cnt++;}else{card.style.display='none';}
  });
  var info=document.getElementById('filterInfo'); if(info) info.textContent=cnt+'문제';
}

// ═══════════════════════════════════════════
// 검색
// ═══════════════════════════════════════════
// 검색 debounce — 한글 IME는 자모 조합마다 input 이벤트 발생 → 매 타이핑 전체 재렌더링 방지
var _searchTimer=null;
function onSearch(){
  searchQuery=document.getElementById('searchInput').value.trim();
  document.getElementById('searchClear').style.display=searchQuery?'inline-block':'none';
  clearTimeout(_searchTimer);
  _searchTimer=setTimeout(function(){ renderAll(); }, 250);
}
function clearSearch(){
  searchQuery=''; document.getElementById('searchInput').value='';
  document.getElementById('searchClear').style.display='none';
  document.getElementById('searchCount').textContent='';
  document.getElementById('searchCount').className='search-count';
  document.querySelectorAll('#qContainer .qcard').forEach(function(c){c.style.display='';});
  // 제목에 남은 하이라이트 스팬만 안전하게 unwrap (qsrc/srs-badge 등 다른 마크업은 보존)
  document.querySelectorAll('#qContainer .qtitle .highlight').forEach(function(span){
    var parent=span.parentNode; if(!parent) return;
    while(span.firstChild){ parent.insertBefore(span.firstChild, span); }
    parent.removeChild(span);
    parent.normalize(); // 분리된 텍스트 노드 병합
  });
}
function matchesSearch(q,query){
  var lo=query.toLowerCase();
  if(q.stem&&q.stem.toLowerCase().indexOf(lo)>=0) return true;
  if(q.opts&&q.opts.some(function(o){return o.toLowerCase().indexOf(lo)>=0;})) return true;
  if(q.exps&&q.exps.some(function(e){return e.t&&e.t.toLowerCase().indexOf(lo)>=0;})) return true;
  if(q.tip&&q.tip.toLowerCase().indexOf(lo)>=0) return true;
  return false;
}
function applySearch(){
  var query=searchQuery; var Qs=getCurrentData(); var cnt=0;
  document.querySelectorAll('#qContainer .qcard').forEach(function(card){
    var qId=card.id.replace('q-','');
    var q=Qs.find(function(x){return x.id===qId;});
    if(!q){card.style.display='none';return;}
    if(matchesSearch(q,query)){
      card.style.display=''; cnt++;
      var titleEl=card.querySelector('.qtitle');
      if(titleEl){
        var head=parseStemHeader(q.stem,q.id);
        var orig=head.title+(head.badge?(' ['+head.badge+']'):'');
        titleEl.innerHTML=orig.replace(new RegExp('('+query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<span class="highlight">$1</span>');
      }
    } else { card.style.display='none'; }
  });
  var countEl=document.getElementById('searchCount');
  countEl.textContent=cnt>0?cnt+'개 검색됨':'결과 없음';
  countEl.className='search-count'+(cnt>0?' has-result':'');
}

// ═══════════════════════════════════════════
// BULK 마스터리
// ═══════════════════════════════════════════
function getBulkMastery(){ return state['__bulk__'+(curSubId||curMid)]||null; }
function setBulkMastery(level){
  var k='__bulk__'+(curSubId||curMid);
  if(state[k]===level) delete state[k]; else state[k]=level;
  saveState(); renderBulkBar(); updateProg();
}
function renderBulkBar(){
  var bar=document.getElementById('bulkBar'); if(!bar) return;
  var cur=masteryFilter;
  var keys=['M','C','F','All'];
  for(var ki=0;ki<keys.length;ki++){
    var el2=document.getElementById('filterBtn'+keys[ki]);
    if(el2) el2.className=el2.className.replace(' sel','');
  }
  var map={mastered:'M',confused:'C',failed:'F'};
  var selKey=(cur&&map[cur])?map[cur]:'All';
  var selEl=document.getElementById('filterBtn'+selKey);
  if(selEl) selEl.className+=' sel';
  var info=document.getElementById('filterInfo');
  if(info){
    var Qs=getCurrentData(); var cnt=0;
    for(var qi=0;qi<Qs.length;qi++){
      var mv=gq(Qs[qi].id).mastery||getBulkMastery()||null;
      if(!cur||mv===cur) cnt++;
    }
    info.textContent=cur?cnt+'문제':'전체 '+Qs.length+'문제';
  }
}

// ═══════════════════════════════════════════
// needsReview
// ═══════════════════════════════════════════
// 복습 대상 판정 기준:
//   △(confused)  → 항상 복습 대상
//   X(failed)    → 내가 X 판정 + 실제 정답이 O → 틀림 → 복습
//   O(mastered)  → 내가 O 판정 + 실제 정답이 X → 틀림 → 복습
//   그 외 (O판정+실제O, X판정+실제X) → 맞음 → 복습 불필요

// [헬퍼] 지문 판정(jv)이 복습 대상인지 확인
// ox: 실제 정답 ('O' 또는 'X')
function _isReviewTarget(jv, ox){
  if(jv === 'confused') return true;
  if(jv === 'failed')   return ox === 'O'; // 내가 X → 실제 O → 틀림
  if(jv === 'mastered') return ox === 'X'; // 내가 O → 실제 X → 틀림
  return false;
}

function needsReview(qId){
  var q = getQById(qId); if(!q) return false;
  // 유형2/3: Q_OPTS_BOX, Q_EXPS_BOX (index 기반, exp.ox 사용)
  if(Q_OPTS_BOX.has(qId)||Q_EXPS_BOX.has(qId)){
    for(var i=0;i<q.exps.length;i++){
      var jv=getGnJudge(qId,i);
      var ox=(q.exps[i]&&q.exps[i].ox)||'O';
      if(_isReviewTarget(jv,ox)) return true;
    }
    return false;
  }
  // 유형1: A~E, ㄱ~ㅈ 박스형
  var parsed=parseBoxStem(q.stem);
  if(parsed.items.length>0&&!Q3_TYPE.has(qId)){
    var _lmap={'A':0,'B':1,'C':2,'D':3,'E':4,'ㄱ':0,'ㄴ':1,'ㄷ':2,'ㄹ':3,'ㅁ':4,'ㅂ':5,'ㅅ':6,'ㅇ':7,'ㅈ':8,'가':0,'나':1,'다':2,'라':3,'마':4,'바':5,'사':6,'아':7,'자':8};
    return parsed.items.some(function(it){
      var jv=getBoxJudge(qId,it.label);
      var labelIdx=(_lmap[it.label]!==undefined?_lmap[it.label]:0);
      var bexp=(q.bexps&&q.bexps[labelIdx])||null;
      var exp=bexp||q.exps[labelIdx]||{ox:'O'};
      var ox=exp.ox||'O';
      return _isReviewTarget(jv,ox);
    });
  }
  // 일반 4지선다: isOtype/X_TYPE 구분, ans 기준으로 각 지문 ox 계산
  var isOtype=O_TYPE.has(qId);
  for(var i2=1;i2<=q.opts.length;i2++){
    var jv2=getOptJudge(qId,i2);
    // 지문의 실제 ox: O형 → 정답 번호가 O, X형 → 정답 번호가 X
    var isAns=(i2===q.ans);
    var ox2=isOtype?(isAns?'O':'X'):(isAns?'X':'O');
    if(_isReviewTarget(jv2,ox2)) return true;
  }
  return false;
}

// ═══════════════════════════════════════════
// parseBoxStem - A~E, ㄱ~ㅈ, 가~자 모두 처리
// ═══════════════════════════════════════════
function parseBoxStem(stem){
  var lines=stem.replace(/\\n/g,'\n').split('\n'); var boxItems=[]; var titleLines=[]; var inBox=false; var cur=null;
  for(var li=0;li<lines.length;li++){
    var line=lines[li];
    var bm=line.match(/^([A-E])[.、．]\s*(.*)/);
    var km=line.match(/^([ㄱㄴㄷㄹㅁㅂㅅㅇㅈ])[.]\s*(.*)/);
    var gm=line.match(/^([가나다라마바사아자])[.]\s*(.*)/);
    var hit=bm||km||gm;
    if(hit){ inBox=true; if(cur) boxItems.push(cur); cur={label:hit[1],text:hit[2]}; }
    else if(inBox&&cur&&line.trim()){ cur.text+=' '+line.trim(); }
    else if(!inBox){ titleLines.push(line); }
  }
  if(cur) boxItems.push(cur);
  return {title:titleLines.join('\n').trim(), items:boxItems};
}

function parseStemHeader(stem, id){
  var lines=(stem||'').replace(/\\n/g,'\n').split('\n');
  var firstLine=lines[0].trim();
  var secondLine=lines.length>1?lines[1].trim():'';
  // 형식A: "01 2025년 군무원 7급. 질문..." (한 줄, 마침표 구분)
  // → 질문이 line0에 있으므로 추가 콘텐츠(표 등)는 line1부터 (bodyStart:1)
  var mA=firstLine.match(/^(\d+)\s+(\d{4}년[^.]*)\.\s*(.+)$/);
  if(mA&&mA[2]&&mA[3]){
    return { title:mA[1]+'. '+mA[3].trim(), badge:mA[2].trim(), bodyStart:1 };
  }
  // 형식B: "01 2022년 군무원 7급\n질문..." 또는 "02. 2020년 경영지도사\n질문..."
  // → 질문이 line1이므로 추가 콘텐츠는 line2부터 (bodyStart:2)
  var mB=firstLine.match(/^(\d+)[\.\s]\s*(\d{4}년[^\n]*?)$/);
  if(mB&&mB[2]&&secondLine){
    return { title:mB[1]+'. '+secondLine.trim(), badge:mB[2].trim(), bodyStart:2 };
  }
  // 형식C: stem에 번호 없음 → id에서 번호 추출 (e.g. 'FA01' → '01')
  if(id && !firstLine.match(/^\d+[\.\s]/)){
    var mId=(id||'').match(/(\d+)$/);
    if(mId){ return { title:mId[1]+'. '+firstLine, badge:'', bodyStart:1 }; }
  }
  return { title:firstLine, badge:'', bodyStart:1 };
}
