// ═══════════════════════════════════════════
// 03-state-judge.js — 판정 저장/조회 (opt/box/gn · rv · fc) · isQDone/isQRvDone
// (index.html에서 분리 — 로드 순서 유지 필수)
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// STATE helpers
// ═══════════════════════════════════════════
// ── 원본 판정 (학습모드 / 파이널체크용) ──────────────────
function getOptJudge(qId,idx){ return (state[qId+'_j']||{})[idx]||null; }

// ── 복습모드 임시 판정 (원본 영향 없음, 차수마다 리셋) ───
// 키: localStorage, 오늘날짜+passNum 기반 → 차수 바뀌면 자동 소멸
// ── _rvKey 캐시 ──
// 복습모드 렌더 1회에 지문마다 호출(수천 회)돼 매번 플랜 JSON.parse → 프리즈 원인.
// 날짜가 같으면 캐시 재사용. 차수/플랜 변경 시 _invalidateRvKeyCache() 필수
// (호출처: setTodayPassNum, savePlanData, resetPlanAll, 클라우드 플랜 복원, renderAll 진입)
var _rvKeyCache = null, _rvKeyCacheDay = null;
function _invalidateRvKeyCache(){ _rvKeyCache = null; }
function _rvKey(){
  // ⚠️ getTodayPlan() 직접 호출 금지 — 무한 재귀 발생
  // 재귀 고리: getTodayPlan → isQRvDone → getRvGnJudge/getRvBoxJudge/getRvJudge → _rvKey → getTodayPlan
  // △·X 데이터가 많은 계정에서 페이지 freeze 원인
  var today = todayStr();
  if(_rvKeyCache && _rvKeyCacheDay === today) return _rvKeyCache;
  var key = 'rv_'+today+'_px';
  var plan = (typeof loadPlan==='function') && loadPlan();
  if(plan && plan.rounds){
    for(var ri=0; ri<plan.rounds.length; ri++){
      var r = plan.rounds[ri];
      if(today >= r.startDate && today <= r.endDate){
        key = 'rv_'+today+'_p'+getTodayPassNum(today, ri);
        break;
      }
    }
  }
  _rvKeyCacheDay = today;
  _rvKeyCache = key;
  return key;
}
function getRvJudge(qId,idx){
  try{ var d=JSON.parse(localStorage.getItem(_rvKey()+'_j_'+qId)||'{}'); return d[idx]||null; }catch(e){return null;}
}
function setRvJudge(qId,idx,level){
  try{
    var k=_rvKey()+'_j_'+qId;
    var d=JSON.parse(localStorage.getItem(k)||'{}');
    if(d[idx]===level) delete d[idx]; else d[idx]=level;
    localStorage.setItem(k,JSON.stringify(d));
  }catch(e){}
}
function getRvBoxJudge(qId,label){
  try{ var d=JSON.parse(localStorage.getItem(_rvKey()+'_bj_'+qId)||'{}'); return d[label]||null; }catch(e){return null;}
}
function setRvBoxJudge(qId,label,level){
  try{
    var k=_rvKey()+'_bj_'+qId;
    var d=JSON.parse(localStorage.getItem(k)||'{}');
    if(d[label]===level) delete d[label]; else d[label]=level;
    localStorage.setItem(k,JSON.stringify(d));
  }catch(e){}
}
function getRvGnJudge(qId,idx){
  try{ return localStorage.getItem(_rvKey()+'_gj_'+qId+'_'+idx)||null; }catch(e){return null;}
}
function setRvGnJudge(qId,idx,level){
  try{
    var k=_rvKey()+'_gj_'+qId+'_'+idx;
    var cur=localStorage.getItem(k);
    if(cur===level) localStorage.removeItem(k); else localStorage.setItem(k,level);
  }catch(e){}
}
// ── 파이널체크 전용 판정 (원본 영향 없음, 기기 간 동기화) ───
var FC_KEY = 'fc_state';
var _fcRenderedMastered = {}; // renderAll 시점 스냅샷 (세션 내 제거 방지용)

// 파이널모드 렌더 시 지문마다 JSON.parse 반복 방지용 캐시 (외부 변경 시 _invalidateFcCache 필수)
var _fcStateCache = null;
function _invalidateFcCache(){ _fcStateCache = null; }
function loadFcState(){
  if(_fcStateCache) return _fcStateCache;
  try{ _fcStateCache = JSON.parse(localStorage.getItem(FC_KEY)||'{}'); }catch(e){ _fcStateCache = {}; }
  return _fcStateCache;
}
function saveFcState(fc){ _fcStateCache = fc; try{ localStorage.setItem(FC_KEY, JSON.stringify(fc)); }catch(e){} saveFcToCloud(); }

function getFcOptJudge(qId,idx){ return loadFcState()[qId+'_opt_'+idx]||null; }
function getFcBoxJudge(qId,label){ return loadFcState()[qId+'_box_'+label]||null; }
function getFcGnJudge(qId,idx){ return loadFcState()[qId+'_gn_'+idx]||null; }

function setFcOptJudge(qId,idx,level){
  var fc=loadFcState(); fc[qId+'_opt_'+idx]=level; saveFcState(fc);
  refreshOptFc(qId,idx);
}
function setFcBoxJudge(qId,label,level){
  var fc=loadFcState(); fc[qId+'_box_'+label]=level; saveFcState(fc);
  refreshBoxFc(qId,label);
}
function setFcGnJudge(qId,idx,level){
  var fc=loadFcState(); fc[qId+'_gn_'+idx]=level; saveFcState(fc);
  refreshGnFc(qId,idx);
}

// renderAll 시점 fc_state 스냅샷을 기준으로 이 세션에서 이미 mastered였는지 확인
function _isFcSessionMastered(key){ return !!_fcRenderedMastered[key]; }

// 해당 문제의 모든 △·X 지문이 이전 세션에서 mastered였는지 (문제 제외 여부)
function isFcDone(qId){
  var q=getQById(qId); if(!q) return false;
  var lmap={'A':0,'B':1,'C':2,'D':3,'E':4,'ㄱ':0,'ㄴ':1,'ㄷ':2,'ㄹ':3,'ㅁ':4,'ㅂ':5,'ㅅ':6,'ㅇ':7,'ㅈ':8,'가':0,'나':1,'다':2,'라':3,'마':4,'바':5,'사':6,'아':7,'자':8};
  if(Q_OPTS_BOX.has(qId)||Q_EXPS_BOX.has(qId)){
    for(var i=0;i<q.exps.length;i++){
      var ox0=(q.exps[i]&&q.exps[i].ox)||'O';
      var orig0=getGnJudge(qId,i);
      if(!_isReviewTarget(orig0,ox0)) continue;
      if(!_isFcSessionMastered(qId+'_gn_'+i)) return false;
    }
    return true;
  }
  var parsed=parseBoxStem(q.stem);
  if(parsed.items.length>0&&!Q3_TYPE.has(qId)){
    for(var j=0;j<parsed.items.length;j++){
      var it=parsed.items[j];
      var li=(lmap[it.label]!==undefined?lmap[it.label]:0);
      var bexp=(q.bexps&&q.bexps[li])||null;
      var exp=bexp||q.exps[li]||{ox:'O'};
      var ox1=exp.ox||'O';
      var orig1=getBoxJudge(qId,it.label);
      if(!_isReviewTarget(orig1,ox1)) continue;
      if(!_isFcSessionMastered(qId+'_box_'+it.label)) return false;
    }
    return true;
  }
  var isOtype=O_TYPE.has(qId);
  for(var k=1;k<=q.opts.length;k++){
    var isAns=(k===q.ans);
    var ox2=isOtype?(isAns?'O':'X'):(isAns?'X':'O');
    var orig2=getOptJudge(qId,k);
    if(!_isReviewTarget(orig2,ox2)) continue;
    if(!_isFcSessionMastered(qId+'_opt_'+k)) return false;
  }
  return true;
}

function resetFcState(){
  if(!confirm('🔄 파이널체크 다시 풀기\n\n정답을 맞힌(졸업) 지문은 유지하고 나머지 판정만 초기화합니다.\n미졸업 지문을 처음 상태로 되돌려 다시 풀 수 있습니다.\n\n※ 학습모드·복습모드 데이터는 전혀 영향받지 않습니다.\n\n진행할까요?')) return;
  var fc=loadFcState();
  Object.keys(fc).forEach(function(k){ if(fc[k]!=='mastered') delete fc[k]; });
  saveFcState(fc);
  renderAll();
}
function resetFcStateAll(){
  if(!confirm('⚠️ 파이널체크 전체 초기화\n\n모든 졸업 처리를 포함하여 파이널체크 판정을 완전 삭제합니다.\n처음부터 다시 시작합니다.\n\n※ 학습모드·복습모드 데이터는 전혀 영향받지 않습니다.\n\n정말 초기화하시겠습니까?')) return;
  localStorage.removeItem(FC_KEY);
  _invalidateFcCache();
  saveFcToCloud();
  renderAll();
}

function saveFcToCloud(){
  if(!currentUser||!currentUser.uid||!firebaseReady||!fbDb) return;
  var fc=loadFcState();
  fbDb.ref('users/'+currentUser.uid+'/fc').set(Object.keys(fc).length>0?fc:null).catch(function(){});
}

// 복습모드에서 문제 전체 판정 완료 여부 — 1차에서 틀린 지문만 rv 판정 요구 (행정법 a9e93eb 기준)
function isQRvDone(q){
  // 유형2/3: ㄱㄴㄷ형 — 1차에서 틀린 지문만 rv 판정 요구
  if(Q_OPTS_BOX.has(q.id)||Q_EXPS_BOX.has(q.id)){
    var cnt=q.exps.length; if(!cnt) return false;
    var any2=false;
    for(var i=0;i<cnt;i++){
      var jv2=getGnJudge(q.id,i);
      var ox2=(q.exps[i]&&q.exps[i].ox)||'O';
      if(_isReviewTarget(jv2,ox2)){
        any2=true;
        if(getRvGnJudge(q.id,i)===null) return false;
      }
    }
    return true; // 복습 대상 없거나 모두 완료
  }
  // 유형1: 박스형 — 1차에서 틀린 라벨만 rv 판정 요구
  var parsed=parseBoxStem(q.stem);
  var boxMode=parsed.items.length>0&&!Q3_TYPE.has(q.id);
  if(boxMode){
    var _lmapR={'A':0,'B':1,'C':2,'D':3,'E':4,'ㄱ':0,'ㄴ':1,'ㄷ':2,'ㄹ':3,'ㅁ':4,'ㅂ':5,'ㅅ':6,'ㅇ':7,'ㅈ':8,'가':0,'나':1,'다':2,'라':3,'마':4,'바':5,'사':6,'아':7,'자':8};
    for(var bi=0;bi<parsed.items.length;bi++){
      var it=parsed.items[bi];
      var jvB=getBoxJudge(q.id,it.label);
      var liR=(_lmapR[it.label]!==undefined?_lmapR[it.label]:0);
      var bexpR=(q.bexps&&q.bexps[liR])||null;
      var expR=bexpR||q.exps[liR]||{ox:'O'};
      var oxR=expR.ox||'O';
      if(_isReviewTarget(jvB,oxR)){
        if(getRvBoxJudge(q.id,it.label)===null) return false;
      }
    }
    return true; // 복습 대상 없거나 모두 완료
  }
  // 일반 4지선다 — 1차에서 틀린 지문만 rv 판정 요구
  if(!q.opts||q.opts.length===0) return false;
  var isOtypeR=O_TYPE.has(q.id);
  for(var k=1;k<=q.opts.length;k++){
    var jvO=getOptJudge(q.id,k);
    var isAnsR=(k===q.ans);
    var oxR2=isOtypeR?(isAnsR?'O':'X'):(isAnsR?'X':'O');
    if(_isReviewTarget(jvO,oxR2)){
      if(getRvJudge(q.id,k)===null) return false;
    }
  }
  return true; // 복습 대상 없거나 모두 완료
}
// 복습모드에서 해당 지문이 임시 O 처리됐는지
function isRvDone(qId,idx,type){
  if(type==='opt') return getRvJudge(qId,idx)==='mastered';
  if(type==='box') return getRvBoxJudge(qId,idx)==='mastered';
  if(type==='gn')  return getRvGnJudge(qId,idx)==='mastered';
  return false;
}
function setOptJudge(qId,idx,level){
  if(!state[qId+'_j']) state[qId+'_j']={};
  if(state[qId+'_j'][idx]===level) delete state[qId+'_j'][idx]; else state[qId+'_j'][idx]=level;
  if(!state[qId+'_e']) state[qId+'_e']={};
  var wasNew = !state[qId+'_e'][idx];
  state[qId+'_e'][idx]=true;
  if(wasNew){
    var _q1 = getQById(qId);
    if(_q1 && isQDone(_q1)) recordActivity(getQOwnerDate(qId));
    setSrsState(qId, level==='mastered'); renderTodayBanner();
  }
  saveState(); refreshOpt(qId,idx); updateProg();
}
function getOptReview(qId,idx){ return !!(state[qId+'_r']||{})[idx]; }
function setOptReview(qId,idx){
  if(!state[qId+'_r']) state[qId+'_r']={};
  state[qId+'_r'][idx]=!state[qId+'_r'][idx];
  saveState(); refreshOpt(qId,idx); updateProg();
}
function getBoxJudge(qId,label){ return (state[qId+'_bj']||{})[label]||null; }
function setBoxJudge(qId,label,level){
  var k=qId+'_bj'; if(!state[k]) state[k]={};
  if(state[k][label]===level) delete state[k][label]; else state[k][label]=level;
  var ek=qId+'_be'; if(!state[ek]) state[ek]={};
  var wasNew = !state[ek][label];
  state[ek][label]=true;
  if(wasNew){
    var _q2 = getQById(qId);
    if(_q2 && isQDone(_q2)) recordActivity(getQOwnerDate(qId));
    setSrsState(qId, level==='mastered'); renderTodayBanner();
  }
  saveState(); refreshBoxItem(qId,label); updateProg();
}
function getBoxExp(qId,label){ return !!(state[qId+'_be']||{})[label]; }
function setBoxReview(qId,label){
  var k=qId+'_br'; if(!state[k]) state[k]={};
  state[k][label]=!state[k][label];
  saveState(); refreshBoxItem(qId,label); updateProg();
}
function getBoxReview(qId,label){ return !!(state[qId+'_br']||{})[label]; }
// 유형2/3용 (index 기반)
function getGnJudge(qId,idx){ return state[qId+'_bj_'+idx]||null; }
function setGnJudge(qId,idx,level){
  var wasNew = !state[qId+'_be_'+idx];
  if(state[qId+'_bj_'+idx]===level) delete state[qId+'_bj_'+idx]; else state[qId+'_bj_'+idx]=level;
  state[qId+'_be_'+idx]=true;
  if(wasNew){
    var _q3 = getQById(qId);
    if(_q3 && isQDone(_q3)) recordActivity(getQOwnerDate(qId));
    setSrsState(qId, level==='mastered'); renderTodayBanner();
  }
  saveState(); refreshGnRow(qId,idx); updateProg();
  _maybeShowBoxAns(qId);
}
function _maybeShowBoxAns(qId){
  if(!Q_EXPS_BOX.has(qId)) return;
  var q=_findQ(qId); if(!q) return;
  var allDone=q.exps.every(function(e,i){ return getGnJudge(qId,i)!==null; });
  if(allDone){ var el=document.getElementById('boxans-'+qId); if(el) el.style.display=''; }
}
function getGnExp(qId,idx){ return !!state[qId+'_be_'+idx]; }
function setGnReview(qId,idx){
  state[qId+'_br_'+idx]=!state[qId+'_br_'+idx];
  saveState(); refreshGnRow(qId,idx); updateProg();
}
function getGnReview(qId,idx){ return !!state[qId+'_br_'+idx]; }

// ── 학습(원본) 전체완료 판정 — 06-dashboard.js에서 이동 (2026-07-06) ──
function isQDone(q){
  // 유형2/3: Q_OPTS_BOX, Q_EXPS_BOX (exp 열람 기준)
  if(Q_OPTS_BOX.has(q.id)||Q_EXPS_BOX.has(q.id)){
    var cnt=q.exps.length; if(!cnt) return false;
    for(var i=0;i<cnt;i++){if(!getGnExp(q.id,i))return false;}
    return true;
  }
  // 유형1: A~E, ㄱ~ㅈ 박스형 (boxExp 열람 기준)
  var parsed=parseBoxStem(q.stem);
  var boxMode=parsed.items.length>0&&!Q3_TYPE.has(q.id);
  if(boxMode){
    if(parsed.items.length===0) return false; // 빈 배열 오판 방지
    return parsed.items.every(function(it){return getBoxExp(q.id,it.label);});
  }
  // 일반 4지선다: _e 해설 열람 기준 (opts 빈 배열이면 false)
  if(!q.opts||q.opts.length===0) return false;
  return q.opts.every(function(o,i){return !!(state[q.id+'_e']||{})[i+1];});
}
