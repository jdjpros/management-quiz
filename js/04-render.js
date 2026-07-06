// ═══════════════════════════════════════════
// 04-render.js — buildOptRow/buildBoxItemRow/buildGnRow · refresh 헬퍼 · mkCard · renderAll
// (index.html에서 분리 — 로드 순서 유지 필수)
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// buildOptRow - 일반 4지선다
// ═══════════════════════════════════════════

function buildOptRow(q2,i){
  var idx=i+1;
  var isReview=(mode==='review'||mode==='globalReview');
  var isFinal=(mode==='final');

  // 복습모드: 복습 대상 지문만 표시 (O 판정 후에도 사라지지 않고 색만 바뀜)
  if(isReview){
    var orig=getOptJudge(q2.id,idx);
    var _isAns0=(idx===q2.ans); var _isOtype0=O_TYPE.has(q2.id);
    var _ox0=_isOtype0?(_isAns0?'O':'X'):(_isAns0?'X':'O');
    if(!_isReviewTarget(orig,_ox0)) return null;
    // isRvDone 체크 제거 → O 판정해도 지문 유지, 색만 초록으로 표시
  }
  // 파이널모드: △ 또는 (X이면서 실제 지문이 O)인 경우만
  if(isFinal){
    var orig2=getOptJudge(q2.id,idx);
    var _isAns0f=(idx===q2.ans); var _isOtype0f=O_TYPE.has(q2.id);
    var _ox0f=_isOtype0f?(_isAns0f?'O':'X'):(_isAns0f?'X':'O');
    if(!_isReviewTarget(orig2,_ox0f)) return null;
    // 이전 세션에서 mastered 처리된 지문은 표시 안 함
    if(_isFcSessionMastered(q2.id+'_opt_'+idx)) return null;
  }

  // 복습모드에서는 임시 판정, 파이널에서는 fc_state, 그 외엔 원본 판정
  var jv = isFinal ? getFcOptJudge(q2.id,idx) : isReview ? getRvJudge(q2.id,idx) : getOptJudge(q2.id,idx);

  var exp=q2.exps[i]; if(!exp) return null;
  var isAns=(idx===q2.ans); var isOtype=O_TYPE.has(q2.id);
  var isCorrectOx=isOtype?(isAns?'O':'X'):(isAns?'X':'O');
  var jCls=jv?({mastered:'judged-m',confused:'judged-c',failed:'judged-f'}[jv]):'';
  // 파이널: 항상 펼침
  // 복습: 임시 판정이 있을 때만 펼침 (state._e 무시 → 항상 닫힌 상태로 시작)
  // 학습: 원본 열람 기록(state._e)이 있으면 펼침
  var expCls = isFinal ? (getFcOptJudge(q2.id,idx)!==null ? ' exp-open' : '')
             : isReview ? (isQRvDone(q2) ? ' exp-open' : '')
             : (isQDone(q2) ? ' exp-open' : '');
  var selM=jv==='mastered'?' sel-m':''; var selC=jv==='confused'?' sel-c':''; var selF=jv==='failed'?' sel-f':'';
  var tagLabel=isOtype?(isAns?'✓ 정답(올바른 것)':'✗ 오답(틀린 것)'):(isAns?'✗ 정답(잘못된 것)':'✓ 오답(올바른 것)');
  var div=document.createElement('div');
  div.className='opt-row '+jCls+expCls; div.id='optrow-'+q2.id+'-'+idx;
  var top=document.createElement('div'); top.className='opt-top';
  var lbl=document.createElement('div'); lbl.className='opt-label'; lbl.textContent=NUMS[i]; top.appendChild(lbl);
  var txt=document.createElement('div'); txt.className='opt-text'; txt.innerHTML=q2.opts[i].replace(/^[①②③④⑤]\s*/,''); top.appendChild(txt);
  var btns=document.createElement('div'); btns.className='opt-judge-btns';

  if(isFinal){
    // 파이널: O/△/X (fc_state에 저장, 원본 영향 없음)
    var fcJv=getFcOptJudge(q2.id,idx);
    var fcSelM=fcJv==='mastered'?' sel-m':''; var fcSelC=fcJv==='confused'?' sel-c':''; var fcSelF=fcJv==='failed'?' sel-f':'';
    var bFcO=document.createElement('button'); bFcO.className='ojb'+fcSelM; bFcO.title='완벽히 알겠다'; bFcO.textContent='O';
    bFcO.onclick=(function(qid,ix){return function(){ setFcOptJudge(qid,ix,'mastered'); };})(q2.id,idx); btns.appendChild(bFcO);
    var bFcC=document.createElement('button'); bFcC.className='ojb'+fcSelC; bFcC.title='한 번 더 볼게'; bFcC.textContent='△';
    bFcC.onclick=(function(qid,ix){return function(){ setFcOptJudge(qid,ix,'confused'); };})(q2.id,idx); btns.appendChild(bFcC);
    var bFcF=document.createElement('button'); bFcF.className='ojb'+fcSelF; bFcF.title='모르겠다/틀렸다'; bFcF.textContent='X';
    bFcF.onclick=(function(qid,ix){return function(){ setFcOptJudge(qid,ix,'failed'); };})(q2.id,idx); btns.appendChild(bFcF);
  } else if(isReview){
    // 복습모드: 학습모드 UX 동일 (해설 열림, 사라지지 않음) + 임시 state만 저장
    var bO=document.createElement('button'); bO.className='ojb'+selM; bO.title='완벽히 알겠다 (임시 저장)'; bO.textContent='O';
    bO.onclick=(function(qid,ix){return function(){
      setRvJudge(qid,ix,'mastered'); refreshOptRv(qid,ix);
    };})(q2.id,idx); btns.appendChild(bO);
    var bC=document.createElement('button'); bC.className='ojb'+selC; bC.title='한 번 더 볼게 (임시 저장)'; bC.textContent='△';
    bC.onclick=(function(qid,ix){return function(){
      setRvJudge(qid,ix,'confused'); refreshOptRv(qid,ix);
    };})(q2.id,idx); btns.appendChild(bC);
    var bF=document.createElement('button'); bF.className='ojb'+selF; bF.title='모르겠다 (임시 저장)'; bF.textContent='X';
    bF.onclick=(function(qid,ix){return function(){
      setRvJudge(qid,ix,'failed'); refreshOptRv(qid,ix);
    };})(q2.id,idx); btns.appendChild(bF);
  } else {
    // 학습모드(all/plan): 원본 state에 저장 + 해설 열림
    var bO2=document.createElement('button'); bO2.className='ojb'+selM; bO2.title='완벽히 알겠다'; bO2.textContent='O';
    bO2.onclick=(function(qid,ix){return function(){setOptJudge(qid,ix,'mastered');};})(q2.id,idx); btns.appendChild(bO2);
    var bC2=document.createElement('button'); bC2.className='ojb'+selC; bC2.title='한 번 더 볼게'; bC2.textContent='△';
    bC2.onclick=(function(qid,ix){return function(){setOptJudge(qid,ix,'confused');};})(q2.id,idx); btns.appendChild(bC2);
    var bF2=document.createElement('button'); bF2.className='ojb'+selF; bF2.title='모르겠다/틀렸다'; bF2.textContent='X';
    bF2.onclick=(function(qid,ix){return function(){setOptJudge(qid,ix,'failed');};})(q2.id,idx); btns.appendChild(bF2);
  }

  top.appendChild(btns); div.appendChild(top);
  var expDiv=document.createElement('div'); expDiv.className='opt-inline-exp';
  var tag=document.createElement('span'); tag.className='opt-exp-tag '+(isCorrectOx==='O'?'isO':'isX'); tag.textContent=tagLabel; expDiv.appendChild(tag);
  var expBody=document.createElement('div'); expBody.className='opt-exp-body'; expBody.innerHTML=exp.t; expDiv.appendChild(expBody);
  div.appendChild(expDiv);
  return div;
}


// ═══════════════════════════════════════════
// buildBoxItemRow - 유형1 (A~E, ㄱ~ㅈ label 기반)
// ═══════════════════════════════════════════

function buildBoxItemRow(q2,item){
  var label=item.label;
  var isReview=(mode==='review'||mode==='globalReview');
  var isFinal=(mode==='final');
  if(isReview){
    var orig=getBoxJudge(q2.id,label);
    var _lmap0={'A':0,'B':1,'C':2,'D':3,'E':4,'ㄱ':0,'ㄴ':1,'ㄷ':2,'ㄹ':3,'ㅁ':4,'ㅂ':5,'ㅅ':6,'ㅇ':7,'ㅈ':8,'가':0,'나':1,'다':2,'라':3,'마':4,'바':5,'사':6,'아':7,'자':8};
    var _li0=(_lmap0[label]!==undefined?_lmap0[label]:0);
    var _bexp0=(q2.bexps&&q2.bexps[_li0])||null;
    var _exp0=_bexp0||q2.exps[_li0]||{ox:'O'};
    var _ox0=_exp0.ox||'O';
    if(!_isReviewTarget(orig,_ox0)) return null;
    // O 판정해도 사라지지 않음
  }
  if(isFinal){
    var orig2=getBoxJudge(q2.id,label);
    var _lmap0f={'A':0,'B':1,'C':2,'D':3,'E':4,'ㄱ':0,'ㄴ':1,'ㄷ':2,'ㄹ':3,'ㅁ':4,'ㅂ':5,'ㅅ':6,'ㅇ':7,'ㅈ':8,'가':0,'나':1,'다':2,'라':3,'마':4,'바':5,'사':6,'아':7,'자':8};
    var _li0f=(_lmap0f[label]!==undefined?_lmap0f[label]:0);
    var _bexp0f=(q2.bexps&&q2.bexps[_li0f])||null;
    var _exp0f=_bexp0f||q2.exps[_li0f]||{ox:'O'};
    var _ox0f=_exp0f.ox||'O';
    if(!_isReviewTarget(orig2,_ox0f)) return null;
    // 이전 세션에서 mastered 처리된 지문은 표시 안 함
    if(_isFcSessionMastered(q2.id+'_box_'+label)) return null;
  }
  var jv=isFinal?getFcBoxJudge(q2.id,label):isReview?getRvBoxJudge(q2.id,label):getBoxJudge(q2.id,label);
  // 파이널: fc_state 판정 있을 때만 열림 / 복습: 임시 판정 있을 때만 열림 (state._be 무시)
  var expOpen = isFinal ? (getFcBoxJudge(q2.id,label) !== null)
              : isReview ? isQRvDone(q2)
              : isQDone(q2);
  var jCls=jv?({mastered:'judged-m',confused:'judged-c',failed:'judged-f'}[jv]):'';
  var expCls=expOpen?' exp-open':'';
  var selM=jv==='mastered'?' sel-m':''; var selC=jv==='confused'?' sel-c':''; var selF=jv==='failed'?' sel-f':'';
  var _lmap={'A':0,'B':1,'C':2,'D':3,'E':4,'ㄱ':0,'ㄴ':1,'ㄷ':2,'ㄹ':3,'ㅁ':4,'ㅂ':5,'ㅅ':6,'ㅇ':7,'ㅈ':8,'가':0,'나':1,'다':2,'라':3,'마':4,'바':5,'사':6,'아':7,'자':8};
  var labelIdx=(_lmap[label]!==undefined?_lmap[label]:0);
  var bexp=(q2.bexps&&q2.bexps[labelIdx])||null;
  var exp=bexp||q2.exps[labelIdx]||{t:'',ox:'O'};
  var isWrong=exp.ox==='X';
  var div=document.createElement('div');
  div.className='opt-row '+jCls+expCls; div.id='boxrow-'+q2.id+'-'+label;
  var top=document.createElement('div'); top.className='opt-top';
  var lbl=document.createElement('div'); lbl.className='opt-label box-opt-label'; lbl.textContent=label; top.appendChild(lbl);
  var txt=document.createElement('div'); txt.className='opt-text'; txt.innerHTML=item.text; top.appendChild(txt);
  var btns=document.createElement('div'); btns.className='opt-judge-btns';
  if(isFinal){
    // O/△/X (fc_state에 저장)
    var fcJvB=getFcBoxJudge(q2.id,label);
    var fcSelMB=fcJvB==='mastered'?' sel-m':''; var fcSelCB=fcJvB==='confused'?' sel-c':''; var fcSelFB=fcJvB==='failed'?' sel-f':'';
    var bFcOB=document.createElement('button'); bFcOB.className='ojb'+fcSelMB; bFcOB.title='완벽히 알겠다'; bFcOB.textContent='O';
    bFcOB.onclick=(function(qid,lb){return function(){ setFcBoxJudge(qid,lb,'mastered'); };})(q2.id,label); btns.appendChild(bFcOB);
    var bFcCB=document.createElement('button'); bFcCB.className='ojb'+fcSelCB; bFcCB.title='한 번 더 볼게'; bFcCB.textContent='△';
    bFcCB.onclick=(function(qid,lb){return function(){ setFcBoxJudge(qid,lb,'confused'); };})(q2.id,label); btns.appendChild(bFcCB);
    var bFcFB=document.createElement('button'); bFcFB.className='ojb'+fcSelFB; bFcFB.title='모르겠다/틀렸다'; bFcFB.textContent='X';
    bFcFB.onclick=(function(qid,lb){return function(){ setFcBoxJudge(qid,lb,'failed'); };})(q2.id,label); btns.appendChild(bFcFB);
  } else if(isReview){
    var bO=document.createElement('button'); bO.className='ojb'+selM; bO.title='완벽히 알겠다 (임시 저장)'; bO.textContent='O';
    bO.onclick=(function(qid,lb){return function(){
      setRvBoxJudge(qid,lb,'mastered'); refreshBoxRv(qid,lb);
    };})(q2.id,label); btns.appendChild(bO);
    var bC=document.createElement('button'); bC.className='ojb'+selC; bC.title='한 번 더 볼게 (임시 저장)'; bC.textContent='△';
    bC.onclick=(function(qid,lb){return function(){
      setRvBoxJudge(qid,lb,'confused'); refreshBoxRv(qid,lb);
    };})(q2.id,label); btns.appendChild(bC);
    var bF=document.createElement('button'); bF.className='ojb'+selF; bF.title='모르겠다 (임시 저장)'; bF.textContent='X';
    bF.onclick=(function(qid,lb){return function(){
      setRvBoxJudge(qid,lb,'failed'); refreshBoxRv(qid,lb);
    };})(q2.id,label); btns.appendChild(bF);
  } else {
    var bO2=document.createElement('button'); bO2.className='ojb'+selM; bO2.title='완벽히 알겠다'; bO2.textContent='O';
    bO2.onclick=(function(qid,lb){return function(){setBoxJudge(qid,lb,'mastered');};})(q2.id,label); btns.appendChild(bO2);
    var bC2=document.createElement('button'); bC2.className='ojb'+selC; bC2.title='한 번 더 볼게'; bC2.textContent='△';
    bC2.onclick=(function(qid,lb){return function(){setBoxJudge(qid,lb,'confused');};})(q2.id,label); btns.appendChild(bC2);
    var bF2=document.createElement('button'); bF2.className='ojb'+selF; bF2.title='모르겠다/틀렸다'; bF2.textContent='X';
    bF2.onclick=(function(qid,lb){return function(){setBoxJudge(qid,lb,'failed');};})(q2.id,label); btns.appendChild(bF2);
  }
  top.appendChild(btns); div.appendChild(top);
  var expDiv=document.createElement('div'); expDiv.className='opt-inline-exp';
  var tag=document.createElement('span'); tag.className='opt-exp-tag '+(isWrong?'isX':'isO'); tag.textContent=isWrong?'✗ 틀린 항목':'✓ 맞는 항목'; expDiv.appendChild(tag);
  var expBody=document.createElement('div'); expBody.className='opt-exp-body'; expBody.innerHTML=exp.t; expDiv.appendChild(expBody);
  div.appendChild(expDiv);
  return div;
}


// ═══════════════════════════════════════════
// buildGnRow - 유형2/3 (index 기반)
// ═══════════════════════════════════════════

function buildGnRow(q2,item,expIdx,expOverride){
  var isReview=(mode==='review'||mode==='globalReview');
  var isFinal=(mode==='final');
  if(isReview){
    var orig=getGnJudge(q2.id,expIdx);
    var _ox0=(q2.exps[expIdx]&&q2.exps[expIdx].ox)||'O';
    if(!_isReviewTarget(orig,_ox0)) return null;
    // O 판정해도 사라지지 않음
  }
  if(isFinal){
    var orig2=getGnJudge(q2.id,expIdx);
    var _ox0f=(q2.exps[expIdx]&&q2.exps[expIdx].ox)||'O';
    if(!_isReviewTarget(orig2,_ox0f)) return null;
    // 이전 세션에서 mastered 처리된 지문은 표시 안 함
    if(_isFcSessionMastered(q2.id+'_gn_'+expIdx)) return null;
  }
  var jv=isFinal?getFcGnJudge(q2.id,expIdx):isReview?getRvGnJudge(q2.id,expIdx):getGnJudge(q2.id,expIdx);
  // 파이널: fc_state 판정 있을 때만 열림 / 복습: 임시 판정 있을 때만 열림 (state._be_N 무시)
  var expOpen = isFinal ? (getFcGnJudge(q2.id,expIdx) !== null)
              : isReview ? isQRvDone(q2)
              : isQDone(q2);
  var jCls=jv?({mastered:'judged-m',confused:'judged-c',failed:'judged-f'}[jv]):'';
  var expCls=expOpen?' exp-open':'';
  var selM=jv==='mastered'?' sel-m':''; var selC=jv==='confused'?' sel-c':''; var selF=jv==='failed'?' sel-f':'';
  var exp=expOverride||(q2.exps[expIdx]||{t:'',ox:'O'});
  var isWrong=exp.ox==='X';
  var expText=exp.t.replace(/^[ㄱ-ㅎ]\.\ */,'');
  var div=document.createElement('div');
  div.className='opt-row '+jCls+expCls; div.id='gnrow-'+q2.id+'-'+expIdx;
  var top=document.createElement('div'); top.className='opt-top';
  var lbl=document.createElement('div'); lbl.className='opt-label box-opt-label'; lbl.textContent=item.label; top.appendChild(lbl);
  var txt=document.createElement('div'); txt.className='opt-text'; txt.innerHTML=item.text; top.appendChild(txt);
  var btns=document.createElement('div'); btns.className='opt-judge-btns';
  if(isFinal){
    // O/△/X (fc_state에 저장)
    var fcJvG=getFcGnJudge(q2.id,expIdx);
    var fcSelMG=fcJvG==='mastered'?' sel-m':''; var fcSelCG=fcJvG==='confused'?' sel-c':''; var fcSelFG=fcJvG==='failed'?' sel-f':'';
    var bFcOG=document.createElement('button'); bFcOG.className='ojb'+fcSelMG; bFcOG.title='완벽히 알겠다'; bFcOG.textContent='O';
    bFcOG.onclick=(function(qid,ix){return function(){ setFcGnJudge(qid,ix,'mastered'); };})(q2.id,expIdx); btns.appendChild(bFcOG);
    var bFcCG=document.createElement('button'); bFcCG.className='ojb'+fcSelCG; bFcCG.title='한 번 더 볼게'; bFcCG.textContent='△';
    bFcCG.onclick=(function(qid,ix){return function(){ setFcGnJudge(qid,ix,'confused'); };})(q2.id,expIdx); btns.appendChild(bFcCG);
    var bFcFG=document.createElement('button'); bFcFG.className='ojb'+fcSelFG; bFcFG.title='모르겠다/틀렸다'; bFcFG.textContent='X';
    bFcFG.onclick=(function(qid,ix){return function(){ setFcGnJudge(qid,ix,'failed'); };})(q2.id,expIdx); btns.appendChild(bFcFG);
  } else if(isReview){
    var bO=document.createElement('button'); bO.className='ojb'+selM; bO.title='완벽히 알겠다 (임시 저장)'; bO.textContent='O';
    bO.onclick=(function(qid,ix){return function(){
      setRvGnJudge(qid,ix,'mastered'); refreshGnRv(qid,ix);
    };})(q2.id,expIdx); btns.appendChild(bO);
    var bC=document.createElement('button'); bC.className='ojb'+selC; bC.title='한 번 더 볼게 (임시 저장)'; bC.textContent='△';
    bC.onclick=(function(qid,ix){return function(){
      setRvGnJudge(qid,ix,'confused'); refreshGnRv(qid,ix);
    };})(q2.id,expIdx); btns.appendChild(bC);
    var bF2=document.createElement('button'); bF2.className='ojb'+selF; bF2.title='모르겠다 (임시 저장)'; bF2.textContent='X';
    bF2.onclick=(function(qid,ix){return function(){
      setRvGnJudge(qid,ix,'failed'); refreshGnRv(qid,ix);
    };})(q2.id,expIdx); btns.appendChild(bF2);
  } else {
    var bO2=document.createElement('button'); bO2.className='ojb'+selM; bO2.title='완벽히 알겠다'; bO2.textContent='O';
    bO2.onclick=(function(qid,ix){return function(){setGnJudge(qid,ix,'mastered');};})(q2.id,expIdx); btns.appendChild(bO2);
    var bC2=document.createElement('button'); bC2.className='ojb'+selC; bC2.title='한 번 더 볼게'; bC2.textContent='△';
    bC2.onclick=(function(qid,ix){return function(){setGnJudge(qid,ix,'confused');};})(q2.id,expIdx); btns.appendChild(bC2);
    var bF3=document.createElement('button'); bF3.className='ojb'+selF; bF3.title='모르겠다/틀렸다'; bF3.textContent='X';
    bF3.onclick=(function(qid,ix){return function(){setGnJudge(qid,ix,'failed');};})(q2.id,expIdx); btns.appendChild(bF3);
  }
  top.appendChild(btns); div.appendChild(top);
  var expDiv=document.createElement('div'); expDiv.className='opt-inline-exp';
  var tag=document.createElement('span'); tag.className='opt-exp-tag '+(isWrong?'isX':'isO'); tag.textContent=isWrong?'✗ 틀린 항목':'✓ 맞는 항목'; expDiv.appendChild(tag);
  var expBody=document.createElement('div'); expBody.className='opt-exp-body'; expBody.innerHTML=expText; expDiv.appendChild(expBody);
  div.appendChild(expDiv);
  return div;
}


// ═══════════════════════════════════════════
// refresh helpers
// ═══════════════════════════════════════════
function _findQ(qId){ return getCurrentData().find(function(x){return x.id===qId;})||getAllQuestions().find(function(x){return x.id===qId;})||null; }
function _rerenderCard(qId){
  var q=_findQ(qId); if(!q) return;
  var card=document.getElementById('q-'+qId); if(!card) return;
  var nc=mkCard(q); if(nc) card.replaceWith(nc);
}
function refreshOpt(qId,idx){
  var q=_findQ(qId); if(!q) return;
  if(isQDone(q)){ _rerenderCard(qId); updateProg(); return; }
  var el=document.getElementById('optrow-'+qId+'-'+idx);
  var newRow=buildOptRow(q,idx-1); if(el&&newRow) el.replaceWith(newRow); else if(el&&!newRow) el.remove();
  var banner=document.getElementById('qbanner-'+qId); if(banner) updateAnsBanner(qId,q,banner);
  refreshTip(qId,q); updateProg();
}
// 복습모드 임시 판정 색깔 갱신 (△/X - 위치 유지)
function refreshOptRv(qId,idx){
  var allQ=getAllQuestions(); var q=allQ.find(function(x){return x.id===qId;}); if(!q) return;
  if(isQRvDone(q)){ _rerenderCard(qId); updateProg(); return; }
  var el=document.getElementById('optrow-'+qId+'-'+idx);
  var newRow=buildOptRow(q,idx-1); if(el&&newRow) el.replaceWith(newRow); else if(el&&!newRow) el.remove();
  updateProg();
}
function refreshBoxRv(qId,label){
  var allQ=getAllQuestions(); var q=allQ.find(function(x){return x.id===qId;}); if(!q) return;
  if(isQRvDone(q)){ _rerenderCard(qId); updateProg(); return; }
  var el=document.getElementById('boxrow-'+qId+'-'+label);
  var parsed=parseBoxStem(q.stem); var item=parsed.items.find(function(it){return it.label===label;});
  if(el&&item) el.replaceWith(buildBoxItemRow(q,item));
  updateProg();
}
function refreshGnRv(qId,idx){
  var allQ=getAllQuestions(); var q=allQ.find(function(x){return x.id===qId;}); if(!q) return;
  if(isQRvDone(q)){ _rerenderCard(qId); updateProg(); return; }
  var el=document.getElementById('gnrow-'+qId+'-'+idx);
  var isOpts=Q_OPTS_BOX.has(qId);
  var isExpsRv=Q_EXPS_BOX.has(qId);
  var label,text,newGnRowRv;
  if(isOpts){ label=(q.opts[idx].match(/^([ㄱ-ㅎ])/)||['','?'])[1]; text=q.opts[idx].replace(/^[ㄱ-ㅎ]\.\s*/,''); newGnRowRv=buildGnRow(q,{label:label,text:text},idx); }
  else if(isExpsRv){ var terv=q.exps[idx].t; label=(terv.match(/^([ㄱ-ㅎ])/)||['','?'])[1]; var ferv=terv.replace(/^[ㄱ-ㅎ]\.\s*/,''); var serv=ferv.indexOf(' → '); text=serv>=0?ferv.slice(0,serv).trim():ferv.trim(); var eperv={ox:q.exps[idx].ox,t:serv>=0?ferv.slice(serv+3).trim():ferv.trim()}; newGnRowRv=buildGnRow(q,{label:label,text:text},idx,eperv); }
  else{ var trv=q.exps[idx].t; label=(trv.match(/^([ㄱ-ㅎ])/)||['','?'])[1]; text=trv.replace(/^[ㄱ-ㅎ]\.\s*/,''); newGnRowRv=buildGnRow(q,{label:label,text:text},idx); }
  if(newGnRowRv&&el) el.replaceWith(newGnRowRv);
  updateProg();
}
// 파이널체크 판정 후 행 갱신 (세션 내 제거 없이 색상만 갱신)
function refreshOptFc(qId,idx){
  var q=_findQ(qId); if(!q) return;
  var el=document.getElementById('optrow-'+qId+'-'+idx);
  var newRow=buildOptRow(q,idx-1);
  if(el&&newRow) el.replaceWith(newRow);
  updateFinalCount();
}
function refreshBoxFc(qId,label){
  var q=_findQ(qId); if(!q) return;
  var el=document.getElementById('boxrow-'+qId+'-'+label);
  var parsed=parseBoxStem(q.stem); var item=parsed.items.find(function(it){return it.label===label;});
  if(el&&item){ var newRow=buildBoxItemRow(q,item); if(newRow) el.replaceWith(newRow); }
  updateFinalCount();
}
function refreshGnFc(qId,idx){
  var q=_findQ(qId); if(!q) return;
  var el=document.getElementById('gnrow-'+qId+'-'+idx);
  var isOpts=Q_OPTS_BOX.has(qId);
  var isExps=Q_EXPS_BOX.has(qId);
  if(!isOpts&&!isExps) return;
  var label,text,newRow;
  if(isOpts){
    if(!q.opts[idx]) return;
    label=(q.opts[idx].match(/^([ㄱ-ㅎ])/)||['','?'])[1];
    text=q.opts[idx].replace(/^[ㄱ-ㅎ]\.\s*/,'');
    newRow=buildGnRow(q,{label:label,text:text},idx);
  } else if(isExps){
    if(!q.exps[idx]) return;
    var te=q.exps[idx].t;
    var gn=te.match(/^([ㄱ-ㅎ])\.\ *([\s\S]*)/);
    if(!gn) return;
    label=gn[1];
    var full=gn[2];
    var sep=full.indexOf(' → ');
    text=sep>=0?full.slice(0,sep).trim():full.trim();
    var ep={ox:q.exps[idx].ox,t:sep>=0?full.slice(sep+3).trim():full.trim()};
    newRow=buildGnRow(q,{label:label,text:text},idx,ep);
  } else { return; }
  if(newRow&&el) el.replaceWith(newRow);
  updateFinalCount();
}

// 파이널모드 카운터 갱신 (졸업 / 남은 / 전체)
function updateFinalCount(total, graduated){
  var el=document.getElementById('finalCount');
  if(el){
    if(total===undefined){
      var _allFcQs=getPlanQuestions().filter(function(q){ return needsReview(q.id); });
      total=_allFcQs.length;
      graduated=_allFcQs.filter(function(q){ return isFcDone(q.id); }).length;
    }
    el.textContent='졸업 '+graduated+' / 남은 '+(total-graduated)+' / 전체 '+total;
  }
}
function refreshBoxItem(qId,label){
  var q=_findQ(qId); if(!q) return;
  if(isQDone(q)){ _rerenderCard(qId); updateProg(); return; }
  var el=document.getElementById('boxrow-'+qId+'-'+label);
  var parsed=parseBoxStem(q.stem); var item=parsed.items.find(function(it){return it.label===label;});
  if(el&&item) el.replaceWith(buildBoxItemRow(q,item));
  var banner=document.getElementById('qbanner-'+qId); if(banner) updateAnsBanner(qId,q,banner);
  refreshTip(qId,q); updateProg();
}
function refreshGnRow(qId,idx){
  var q=_findQ(qId); if(!q) return;
  if(isQDone(q)){ _rerenderCard(qId); updateProg(); return; }
  var el=document.getElementById('gnrow-'+qId+'-'+idx);
  if(!el) return;
  var isOpts=Q_OPTS_BOX.has(qId);
  var isExps=Q_EXPS_BOX.has(qId);
  var label,text,newGnRow;
  if(isOpts){ label=(q.opts[idx].match(/^([ㄱ-ㅎ])/)||['','?'])[1]; text=q.opts[idx].replace(/^[ㄱ-ㅎ]\.\s*/,''); newGnRow=buildGnRow(q,{label:label,text:text},idx); }
  else if(isExps){ var te=q.exps[idx].t; label=(te.match(/^([ㄱ-ㅎ])/)||['','?'])[1]; var fe=te.replace(/^[ㄱ-ㅎ]\.\s*/,''); var se=fe.indexOf(' → '); text=se>=0?fe.slice(0,se).trim():fe.trim(); var epe={ox:q.exps[idx].ox,t:se>=0?fe.slice(se+3).trim():fe.trim()}; newGnRow=buildGnRow(q,{label:label,text:text},idx,epe); }
  else { var t=q.exps[idx].t; label=(t.match(/^([ㄱ-ㅎ])/)||['','?'])[1]; text=t.replace(/^[ㄱ-ㅎ]\.\s*/,''); newGnRow=buildGnRow(q,{label:label,text:text},idx); }
  if(newGnRow) el.replaceWith(newGnRow); else el.remove();
  var banner=document.getElementById('qbanner-'+qId); if(banner) updateAnsBanner(qId,q,banner);
  refreshTip(qId,q); updateProg();
}

// ═══════════════════════════════════════════
// updateAnsBanner
// ═══════════════════════════════════════════
function updateAnsBanner(qId,q2,banner){
  var allDone=false;
  if(Q_OPTS_BOX.has(qId)||Q_EXPS_BOX.has(qId)){
    var cnt=q2.exps.length; allDone=cnt>0;
    for(var i=0;i<cnt;i++){ if(!getGnExp(qId,i)){allDone=false;break;} }
  } else {
    var parsed=parseBoxStem(q2.stem); var boxMode=parsed.items.length>0&&!Q3_TYPE.has(qId);
    if(boxMode){ allDone=parsed.items.every(function(it){return getBoxExp(qId,it.label);}); }
    else { allDone=q2.opts.every(function(o,i){return !!(state[qId+'_e']||{})[i+1];}); }
  }
  if(allDone){
    banner.className='q-ans-banner visible ok';
    banner.innerHTML='정답: <strong>'+NUMS[q2.ans-1]+'</strong> &nbsp;|&nbsp; ✓ 복습 완료';
  } else { banner.className='q-ans-banner'; banner.innerHTML=''; }
}

// ═══════════════════════════════════════════
// refreshTip
// ═══════════════════════════════════════════
function refreshTip(qId,q2){
  var tipEl=document.getElementById('qtip-'+qId); if(!tipEl||!q2.tip) return;
  var allDone=false;
  if(Q_OPTS_BOX.has(qId)||Q_EXPS_BOX.has(qId)){
    var cnt=q2.exps.length; allDone=cnt>0;
    for(var i=0;i<cnt;i++){ if(!getGnExp(qId,i)){allDone=false;break;} }
  } else {
    var parsed=parseBoxStem(q2.stem); var boxMode=parsed.items.length>0&&!Q3_TYPE.has(qId);
    allDone=boxMode?parsed.items.every(function(it){return getBoxExp(qId,it.label);}):q2.opts.every(function(o,i){return !!(state[qId+'_e']||{})[i+1];});
  }
  if(allDone){tipEl.className='q-tip';tipEl.innerHTML=q2.tip;}else{tipEl.className='';tipEl.innerHTML='';}
}

// ═══════════════════════════════════════════
// mkCard
// ═══════════════════════════════════════════
function mkCard(q){
  var qs=gq(q.id); var mastery=qs.mastery;
  var card=document.createElement('div');
  var cardCls='qcard'; if(mastery) cardCls+=' '+mastery; if(qs.open) cardCls+=' open';
  card.className=cardCls; card.id='q-'+q.id;

  var qIdx=getCurrentData().findIndex(function(x){return x.id===q.id;})+1;
  var hdr=document.createElement('div'); hdr.className='qheader';
  (function(hdr, qid){
    var _mx=0, _my=0;
    hdr.addEventListener('mousedown', function(e){ _mx=e.clientX; _my=e.clientY; });
    hdr.addEventListener('click', function(e){
      if(Math.abs(e.clientX-_mx)>5 || Math.abs(e.clientY-_my)>5) return; // 드래그 선택 중이면 무시
      toggleCard(qid);
    });
  })(hdr, q.id);
  var rvIcon=needsReview(q.id)?'★':'';
  var srsS=getSrsState(q.id); var srsBadge='';
  if(isSrsDue(q.id)&&srsS.lvl>0) srsBadge='<span class="srs-badge due">SRS</span>';
  else if(srsS.lvl>0&&srsS.due) srsBadge='<span class="srs-badge soon">Lv'+srsS.lvl+'</span>';
  var head=parseStemHeader(q.stem,q.id);
  var badgeHtml=head.badge?(' <span class="qsrc">['+head.badge+']</span>'):'';
  hdr.innerHTML='<div class="qnum">Q'+qIdx+'</div><div class="qtitle">'+head.title+badgeHtml+srsBadge+'</div><div class="qmeta">'+rvIcon+'</div><div class="chev">▼</div>';
  card.appendChild(hdr);

  var body=document.createElement('div'); body.className='qbody';
  var parsed=parseBoxStem(q.stem);
  var boxMode=parsed.items.length>0&&!Q3_TYPE.has(q.id);
  var stemLines=q.stem.replace(/\\n/g,'\n').split('\n');

  // stem 표시
  if(Q_EXPS_BOX.has(q.id)){
    // 유형2: 질문은 헤더에 표시. 질문(line0)과 [보기] 사이의 추가 내용(표 등)만 body에 표시
    var stemLs2=q.stem.replace(/\\n/g,'\n').split('\n');
    var bStart2=head.bodyStart||1;
    var bokiIdx2=-1;
    for(var li2=0;li2<stemLs2.length;li2++){if(stemLs2[li2].trim()==='[보기]'||stemLs2[li2].trim()==='<보기>'){bokiIdx2=li2;break;}}
    var midLines2=stemLs2.slice(bStart2,bokiIdx2>=0?bokiIdx2:stemLs2.length);
    while(midLines2.length&&!midLines2[0].trim())midLines2.shift();
    while(midLines2.length&&!midLines2[midLines2.length-1].trim())midLines2.pop();
    if(midLines2.length>0)body.innerHTML+='<div class="qstem">'+midLines2.join('<br>')+'</div>';
  } else if(boxMode){
    // 유형1: 질문은 헤더에 표시, 항목은 optsWrap에서 렌더링하므로 qstem/box-passage 생략
  } else if(stemLines.length>1){
    // bodyStart: 형식A=1(질문이 line0), 형식B=2(질문이 line1), 기타=1
    var bodyLines=stemLines.slice(head.bodyStart||1);
    if(bodyLines.length>0) body.innerHTML+='<div class="qstem">'+bodyLines.join('<br>')+'</div>';
  }

  // 정답 배너
  var banner=document.createElement('div'); banner.className='q-ans-banner'; banner.id='qbanner-'+q.id;
  updateAnsBanner(q.id,q,banner); body.appendChild(banner);

  // 보기 영역
  var optsWrap=document.createElement('div');

  if(Q_OPTS_BOX.has(q.id)){
    // 유형3: opts 자체가 ㄱ.ㄴ.ㄷ.
    q.opts.forEach(function(opt,i){
      var label=(opt.match(/^([ㄱ-ㅎ])/)||['',String(i+1)])[1];
      var text=opt.replace(/^[ㄱ-ㅎ]\.\s*/,'');
      var el=buildGnRow(q,{label:label,text:text},i);
      if(el) optsWrap.appendChild(el);
    });
    var ai=document.createElement('div'); ai.className='box-ans-info';
    ai.innerHTML='<span class="box-ans-label">정답 →</span> '+NUMS[q.ans-1];
    optsWrap.appendChild(ai);

  } else if(Q_EXPS_BOX.has(q.id)){
    // 유형2: exps[i].t 에 'ㄱ. 지문 → 해설' 포함
    // → 기호를 기준으로 앞=지문(item.text), 뒤=해설로 분리해서 buildGnRow에 전달
    q.exps.forEach(function(exp,i){
      var gn=exp.t.match(/^([ㄱ-ㅎ])\.\ *([\s\S]*)/);
      if(!gn) return;
      var full=gn[2];
      // '//'가 있으면: stmtText에 '→ 분류명'까지 포함, '//' 뒤가 설명 (연결형 문제용)
      // '//'가 없으면: 기존 ' → ' 구분 (모두 고른 것 유형)
      var sepSlash=full.indexOf(' // ');
      var stmtText, descText;
      if(sepSlash>=0){
        stmtText=full.slice(0,sepSlash).trim();
        descText=full.slice(sepSlash+4).trim();
      } else {
        var sep=full.indexOf(' → ');
        stmtText=sep>=0?full.slice(0,sep).trim():full.trim();
        descText=sep>=0?full.slice(sep+3).trim():full.trim();
      }
      var expPatched = {ox:exp.ox, t:descText};
      var el=buildGnRow(q,{label:gn[1],text:stmtText},i,expPatched);
      if(el) optsWrap.appendChild(el);
    });
    var ai2=document.createElement('div'); ai2.className='box-ans-info'; ai2.id='boxans-'+q.id;
    var _gnAllDone=q.exps.every(function(e,i){ return getGnJudge(q.id,i)!==null; });
    if(!_gnAllDone) ai2.style.display='none';
    ai2.innerHTML='<span class="box-ans-label">정답 →</span> '+q.opts[q.ans-1].replace(/^[①②③④⑤]\s*/,'');
    optsWrap.appendChild(ai2);

  } else if(boxMode){
    // 유형1: stem에 ㄱ.ㄴ.ㄷ. 직접
    parsed.items.forEach(function(item){ var el=buildBoxItemRow(q,item); if(el) optsWrap.appendChild(el); });
    var ai3=document.createElement('div'); ai3.className='box-ans-info';
    ai3.innerHTML='<span class="box-ans-label">정답 선택지 →</span> '+q.opts.map(function(opt,i){return '<span class="box-ans-opt">'+NUMS[i]+' '+opt.replace(/^[①②③④⑤]\s*/,'')+'</span>';}).join('');
    optsWrap.appendChild(ai3);

  } else {
    // 일반형
    q.opts.forEach(function(o,i){ var el=buildOptRow(q,i); if(el) optsWrap.appendChild(el); });
  }

  body.appendChild(optsWrap);

  // 핵심 팁
  var tipWrap=document.createElement('div'); tipWrap.id='qtip-'+q.id;
  body.appendChild(tipWrap);
  refreshTip(q.id,q);

  // 초기화 버튼
  var ar=document.createElement('div'); ar.className='action-row';
  var arBtn=document.createElement('button'); arBtn.className='btn-rst'; arBtn.textContent='초기화';
  arBtn.onclick=(function(qid){return function(){resetQ(qid);};})(q.id); ar.appendChild(arBtn);
  body.appendChild(ar);

  card.appendChild(body);
  return card;
}

// ═══════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════
function toggleCard(id){ sq(id,{open:!gq(id).open}); refresh(id); updateExpandAllBtn(); }

function toggleExpandAll(){
  var Qs = getCurrentData();
  var anyOpen = Qs.some(function(q){ return gq(q.id).open; });
  var targetOpen = !anyOpen;
  Qs.forEach(function(q){ sq(q.id,{open:targetOpen}); });
  renderAll();
}
function updateExpandAllBtn(){
  var btn = document.getElementById('btnExpandAll'); if(!btn) return;
  var Qs = getCurrentData();
  var anyOpen = Qs.some(function(q){ return gq(q.id).open; });
  btn.textContent = anyOpen ? '📕 전체 접기' : '📖 전체 펼침';
}
function resetQ(id){
  delete state[id]; delete state[id+'_j']; delete state[id+'_e']; delete state[id+'_r'];
  delete state[id+'_bj']; delete state[id+'_be']; delete state[id+'_br'];
  for(var i=0;i<10;i++){ delete state[id+'_bj_'+i]; delete state[id+'_be_'+i]; delete state[id+'_br_'+i]; }
  state[id]={open:true}; saveState(); refresh(id); updateProg();
}
function refresh(id){
  var q=getCurrentData().find(function(x){return x.id===id;}); if(!q) return;
  var old=document.getElementById('q-'+id); if(!old) return;
  old.replaceWith(mkCard(q));
}

// ═══════════════════════════════════════════
// renderAll
// ═══════════════════════════════════════════
function renderAll(){
  var c=document.getElementById('qContainer'); c.innerHTML='';
  // Bulk/Filter bar
  var bar=document.getElementById('bulkBar'); if(bar) bar.remove();
  bar=document.createElement('div'); bar.id='bulkBar'; bar.className='bulk-bar';

  // 전범위 복습 모드일 때 별도 안내 레이블
  var barLabel = mode==='globalReview' ? '🌐 전범위 △·X 복습 (모든 단원)' : '📋 '+getCurrentLabel();
  var blbl=document.createElement('span'); blbl.className='bulk-label'; blbl.textContent=barLabel; bar.appendChild(blbl);
  var bbtns=document.createElement('div'); bbtns.className='bulk-btns';
  var bM=document.createElement('button'); bM.className='bulk-btn m'; bM.id='filterBtnM'; bM.textContent='✅ 아는 지문';
  bM.onclick=function(){setMasteryFilter('mastered');}; bbtns.appendChild(bM);
  var bC=document.createElement('button'); bC.className='bulk-btn c'; bC.id='filterBtnC'; bC.textContent='🔁 모르는 지문';
  bC.onclick=function(){setMasteryFilter('confused');}; bbtns.appendChild(bC);
  var bF=document.createElement('button'); bF.className='bulk-btn f'; bF.id='filterBtnF'; bF.textContent='❌ 틀린 지문';
  bF.onclick=function(){setMasteryFilter('failed');}; bbtns.appendChild(bF);
  var bAll=document.createElement('button'); bAll.className='bulk-btn clr'; bAll.id='filterBtnAll'; bAll.textContent='전체 보기';
  bAll.onclick=function(){setMasteryFilter(null);}; bbtns.appendChild(bAll);
  var bExpand=document.createElement('button'); bExpand.className='bulk-btn clr'; bExpand.id='btnExpandAll'; bExpand.textContent='📖 전체 펼침';
  bExpand.onclick=function(){ toggleExpandAll(); }; bbtns.appendChild(bExpand);
  bar.appendChild(bbtns);
  var bInfo=document.createElement('span'); bInfo.className='bulk-info'; bInfo.id='filterInfo'; bar.appendChild(bInfo);
  c.parentNode.insertBefore(bar,c);
  renderBulkBar();
  updateExpandAllBtn();

  // 파이널체크: 플랜 범위 △·X 문제 수집 (해설 펼침, O/△/X 버튼으로 fc_state 저장)
  // 복습모드: 현재 단원 △·X 지문만 (임시 판정)
  var Qs, vis=0;
  if(mode==='final'){
    // 세션 시작 시 fc_state 스냅샷 (mastered된 것만 기록 → 세션 내 졸업 지문 재표시 방지)
    _fcRenderedMastered = {};
    var _fcSnap = loadFcState();
    Object.keys(_fcSnap).forEach(function(k){ if(_fcSnap[k]==='mastered') _fcRenderedMastered[k]=true; });
    // 소스: 플랜 범위 내 △·X 문제
    var _allFcQs = getPlanQuestions().filter(function(q){ return needsReview(q.id); });
    var _totalFc = _allFcQs.length;
    var _graduatedFc = _allFcQs.filter(function(q){ return isFcDone(q.id); }).length;
    // 표시: 아직 졸업 안 된 문제만
    Qs = _allFcQs.filter(function(q){ return !isFcDone(q.id); });
    Qs.forEach(function(q){ vis++; c.appendChild(mkCard(q)); });
    // 상단 카운터 삽입
    var cntBar=document.createElement('div');
    cntBar.id='finalCountBar';
    cntBar.style.cssText='background:#1e2540;color:#93c5fd;font-size:12px;font-weight:700;padding:8px 14px;border-radius:8px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;';
    cntBar.innerHTML='<span style="flex:1;min-width:200px;">🎯 파이널체크 — O/△/X로 판정하세요. O로 맞힌 지문은 다음 진입 시 제외됩니다.</span>'+
      '<span id="finalCount" style="background:rgba(34,197,94,.15);padding:3px 8px;border-radius:4px;white-space:nowrap;font-size:11px;font-weight:600;"></span>';
    c.insertBefore(cntBar, c.firstChild);
    setTimeout(function(){ updateFinalCount(_totalFc, _graduatedFc); }, 50);
  } else if(mode==='globalReview'){
    Qs = getPlanQuestions().filter(function(q){ return needsReview(q.id); });
    Qs.forEach(function(q){ vis++; c.appendChild(mkCard(q)); });
  } else {
    Qs=getCurrentData();
    Qs.forEach(function(q){
      if(mode==='review'&&!needsReview(q.id)) return;
      if(mode==='plan'&&planStudyMode&&planStudyQIds.indexOf(q.id)<0) return;
      vis++; c.appendChild(mkCard(q));
    });
  }

  var es=document.getElementById('emptyState');
  if(vis===0){
    es.style.display='block';
    document.getElementById('emptyMsg').textContent=
      mode==='review'?'🎉 이번 차수 복습 완료!':
      mode==='final'?'🏆 파이널체크 완료! 모두 외웠습니다!':
      mode==='globalReview'?'🎉 전범위 복습 완료!':
      mode==='plan'?'✅ 오늘 차수 완료!':'📭 문제가 없어요.';
    document.getElementById('emptyHint').textContent=
      mode==='review'?'이번 차수에서 O로 처리한 지문은 다음 차수에 다시 나타납니다.':
      mode==='final'?'△·X 지문이 모두 사라졌습니다. 시험 준비 완료! 🎉':
      mode==='globalReview'?'모든 단원의 △·X 지문을 다 풀었어요! 🏆':
      mode==='plan'?'위 배너에서 다음 차수로 넘어가세요.':'다른 단원을 선택해 보세요.';
  } else { es.style.display='none'; }

  if(searchQuery) applySearch();
  else if(masteryFilter) applyMasteryFilter();
  updateProg();

  // 문제가 있을 때만 맨 위로 버튼 표시
  var stw=document.getElementById('scrollTopWrap');
  if(stw) stw.style.display = vis>0 ? 'block' : 'none';
}
