// ═══════════════════════════════════════════
// 06-dashboard.js — 대시보드 렌더링
// (index.html에서 분리 — 로드 순서 유지 필수)
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// 대시보드
// ═══════════════════════════════════════════
function renderDashboard(){
  checkMigrationPressure();
  // 기능2: 비율 변화 알림 체크
  renderRatioAlert();

  var allQ = getPlanQuestions();
  var total = allQ.length;
  var plan = loadPlan();
  var tp = getTodayPlan();
  var today = todayStr();

  // ── ① 오늘 플랜 현황 ──────────────────────────────
  var todaySection = document.getElementById('dashTodaySection');
  if(todaySection){
    if(!plan){
      todaySection.innerHTML = ''
        +'<div style="background:linear-gradient(135deg,#1e2540,#2d3a6e);border-radius:12px;padding:24px 20px;color:#fff;text-align:center;">'
        +'<div style="font-size:36px;margin-bottom:10px;">📊</div>'
        +'<div style="font-size:17px;font-weight:800;margin-bottom:6px;">경영학 퀴즈에 오신 걸 환영합니다!</div>'
        +'<div style="font-size:12.5px;color:rgba(255,255,255,.7);margin-bottom:20px;line-height:1.7;">'
        +'시험일을 입력하면 9회독까지의 학습 일정을<br>자동으로 계산해 드립니다.</div>'
        +'<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">'
        +'<button onclick="openPlanOverlay()" style="padding:12px 28px;background:#fbbf24;color:#1e2540;border:none;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;font-family:Pretendard,sans-serif;">📅 회독 플랜 설정하기</button>'
        +'<button onclick="setMode(\'all\')" style="padding:12px 20px;background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:Pretendard,sans-serif;">플랜 없이 학습 시작</button>'
        +'</div>'
        +'<div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,.4);">기존 학습 데이터가 있다면 → 동기화 바에서 JSON 불러오기</div>'
        +'</div>';
    } else if(tp && tp.status==='active'){
      // 통합 다크 카드 1개로 렌더링 — 차수 타임라인 + 진도 영역 + 통합 메인 버튼 + 진도 밀림 인라인 알림
      // 1차: act_ 카운터(완료 수) + todayInitialQuota(처음 할당 수)로 진도 표시
      // 2·3차: getTodayPassDone(passQs 기반 isQRvDone) 유지
      var done0, total0;
      if(!tp.isFullPass){
        // 복습(2·3차 및 △·X 회독 전 차수): rv 판정 기준
        done0 = getTodayPassDone(tp.passQs, tp.passNum);
        total0 = tp.passQs.length;
      } else {
        done0 = parseInt(localStorage.getItem('act_'+today)||'0');
        total0 = tp.todayInitialQuota || tp.passQs.length;
      }
      var pct0=total0>0?Math.round(done0/total0*100):100;

      // 전체 진도 (계획 vs 실제)
      var expectedDone = calcExpectedDone(plan, today, allQ);
      var actualDone = allQ.filter(function(q){ return isQDone(q); }).length;
      var planTotal = allQ.length;
      var actPct = Math.round(actualDone/planTotal*100);
      var diff = actualDone - expectedDone;
      var diffDays2 = (tp.qPerDay>0) ? Math.round(Math.abs(diff)/tp.qPerDay) : 0;

      // 오늘 실제 학습량 (ownerDate 무관 — 배지·완료 메시지용)
      var todayActCount = parseInt(localStorage.getItem('act1_work_'+today)||'0');

      // 차수 타임라인 (1차/2차/3차 동그라미 상태 표시)
      var pn = tp.passNum;
      var curIsDone = (total0>0 && done0>=total0);
      function passStateAt(n){
        if(n < pn) return 'done';
        if(n > pn) return '';
        return curIsDone ? 'done' : 'current';
      }
      var passSteps = [
        {num:'1차', mode:'학습', icon:'📖', state: passStateAt(1)},
        {num:'2차', mode:'복습', icon:'🔁', state: passStateAt(2)},
        {num:'3차', mode:'복습', icon:'🔁', state: passStateAt(3)}
      ];
      var stateBadge = {done:'✓ 완료', current:'▸ 현재', '':'대기'};
      var timelineHtml = '<div class="pass-timeline">'
        + passSteps.map(function(s){
          return '<div class="pass-step '+s.state+'">'
            +'<div class="pass-state-badge">'+stateBadge[s.state]+'</div>'
            +'<div class="pass-circle">'+s.icon+'</div>'
            +'<div class="pass-label"><span class="num">'+s.num+'</span><span class="mode">'+s.mode+'</span></div>'
            +'</div>';
        }).join('')
        + '</div>';

      // 진도 밀림 인라인 알림 (다크 카드 내부)
      var delayClass = diff>=0 ? 'ok' : (diff>=-tp.qPerDay*3 ? '' : 'critical');
      var delayMsg, delayActions;
      if(diff < 0){
        delayMsg = '⚠ 약 '+diffDays2+'일 분량('+Math.abs(diff)+'문항) 밀려있어요';
        delayActions = '<span style="font-size:11.5px;color:rgba(255,255,255,.55);">이어서 학습 버튼을 누르면 자동으로 처리됩니다</span>';
      } else if(diff > 0){
        delayMsg = '✅ 계획보다 '+diff+'문항 앞서가고 있어요';
        delayActions = '<span style="font-size:12px;color:rgba(255,255,255,.6);">계속 페이스 유지하세요!</span>';
      } else {
        delayMsg = '✅ 계획대로 진행 중';
        delayActions = '<span style="font-size:12px;color:rgba(255,255,255,.6);">완벽한 페이스!</span>';
      }
      var delayHtml = '<div class="plan-delay-inline '+delayClass+'">'
        +'<div class="plan-delay-title">'+delayMsg+'</div>'
        +'<div class="plan-delay-actions">'+delayActions+'</div>'
        +'</div>';

      // 메인 액션 버튼 (통합 1개)
      // 3차 완료 → 녹색 완료 / 그 외 → 📚 이어서 학습 시작 (자동 큐)
      var actionHtml;
      var sq;
      if(curIsDone && pn === 3){
        var doneSub = todayActCount > 0 ? todayActCount+'문항 완료 · 푹 쉬세요 🌙' : '오늘 모든 차수를 완료했습니다! 푹 쉬세요 🌙';
        actionHtml = '<div class="plan-action-wrap"><button class="plan-action-btn done-complete" disabled>'
          +'<span>🎉 오늘 학습 완료<span class="sub">'+doneSub+'</span></span></button></div>';
      } else {
        sq = getStudyQueue();
        var mainSub;
        if(curIsDone && pn < 3){
          var nextPn = pn + 1;
          var nextQLen = sq ? sq.passQs.length : total0;
          mainSub = nextPn+'차 복습 시작 · '+nextQLen+'문제';
        } else {
          var remainQ = total0 - done0;
          mainSub = pn+'차 '+(tp.isFullPass ? '학습' : '복습')+' · 남은 '+remainQ+'문제';
          if(tp.carryover > 0){
            mainSub += ' (+밀린 '+tp.carryover+'문제 포함)';
          }
        }
        actionHtml = '<div class="plan-action-wrap"><button class="plan-action-btn p1" onclick="handleMainStudyBtn()">'
          +'<span>📚 이어서 학습 시작<span class="sub">'+mainSub+'</span></span></button></div>';
      }

      // 한도 1.5배 초과 알림 (Phase 3 자리 — 미리 들어가도 무방)
      var limitAlertHtml = '';
      if(!curIsDone){
        var queueTotal = sq ? sq.passQs.length : total0;
        var limitCount = Math.floor(tp.qPerDay * 1.5);
        if(queueTotal > limitCount){
          var overCount = queueTotal - tp.qPerDay;
          limitAlertHtml = '<div class="limit-alert">'
            +'<div class="limit-alert-msg">⚠ 오늘 분량이 평소보다 '+overCount+'문제 많아요 ('+queueTotal+'문제 / 기준 '+tp.qPerDay+'문제)</div>'
            +'<div class="limit-alert-desc">한도('+limitCount+'문제)를 초과했습니다. 무리하지 않으려면 일정을 재조정하세요.</div>'
            +'<button class="limit-replan-btn" onclick="replanFromToday()">📅 일정 재조정</button>'
            +'</div>';
        }
      }

      // 시험일 + 연속 학습일
      var examDateStr = plan.examDate || '';
      var streakN = (typeof calcStreak==='function') ? calcStreak() : 0;

      todaySection.innerHTML = '<div class="plan-card">'
        +'  <div class="plan-card-head">'
        +'    <div class="plan-meta-box">'
        +'      <div class="plan-meta-chip">'
        +'        <div class="chip-lbl">현재 진행</div>'
        +'        <div class="chip-val">'+tp.round+'회독, <span class="accent">'+tp.dayInRound+'일차</span></div>'
        +'      </div>'
        +'      <div class="plan-meta-chip">'
        +'        <div class="chip-lbl">시험까지</div>'
        +'        <div class="chip-val"><span class="accent warn">D-'+tp.daysLeft+'</span>'+(examDateStr?'<span class="examdate">시험일 '+examDateStr+'</span>':'')+'</div>'
        +'      </div>'
        +'    </div>'
        +'    <button class="plan-edit-btn" onclick="openPlanOverlay()">⚙ 플랜 수정</button>'
        +'  </div>'
        +  timelineHtml
        +'  <div class="plan-progress">'
        +'    <div class="plan-progress-row">'
        +'      <div class="plan-progress-left">'
        +'        <div class="today-done-badge">📌 오늘 <span class="num">'+todayActCount+'</span><span class="total">/'+tp.todayQs.length+'</span>문제 완료</div>'
        +'        <div class="plan-stats-list">'
        +'          <div class="plan-stat"><span class="l">실제</span><span class="v actual">'+actualDone+'</span></div>'
        +'          <div class="plan-stat"><span class="l">계획</span><span class="v plan">'+expectedDone+'</span></div>'
        +'          <div class="plan-stat"><span class="l">전체</span><span class="v total">'+planTotal+'</span></div>'
        +'        </div>'
        +'      </div>'
        +'      <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">'
        +'        <span class="plan-pct-big">'+actPct+'%</span>'
        +'        <span style="background:rgba(52,211,153,.15);border:1px solid rgba(52,211,153,.4);border-radius:7px;padding:6px 11px;font-size:13px;font-weight:700;color:#6ee7b7;display:inline-flex;align-items:center;gap:5px;">🔥 연속 <span style="font-size:16px;font-weight:800;font-family:JetBrains Mono,monospace;color:#fff;">'+streakN+'</span>일</span>'
        +'      </div>'
        +'    </div>'
        +'    <div class="plan-progress-bar">'
        +'      <div class="plan-progress-fill plan" style="width:'+Math.round(expectedDone/planTotal*100)+'%"></div>'
        +'      <div class="plan-progress-fill actual" style="width:'+actPct+'%"></div>'
        +'    </div>'
        +'  </div>'
        +'  <div class="action-row'+(limitAlertHtml?'':' solo')+'">'
        +    actionHtml
        +    limitAlertHtml
        +    delayHtml
        +'  </div>'
        +'  <div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);">'
        +'    <button onclick="shiftRoundStartToToday(false)" style="flex:1;padding:7px 0;background:rgba(14,165,233,.12);border:1px solid rgba(14,165,233,.35);border-radius:7px;color:#7dd3fc;font-size:12px;font-weight:700;cursor:pointer;font-family:Pretendard,sans-serif;">📅 시작일 조정</button>'
        +'    <button onclick="resetCurrentRoundData()" style="flex:1;padding:7px 0;background:rgba(217,119,6,.1);border:1px solid rgba(217,119,6,.3);border-radius:7px;color:#fbbf24;font-size:12px;font-weight:700;cursor:pointer;font-family:Pretendard,sans-serif;">🔄 회독 초기화</button>'
        +'  </div>'
        +'</div>';
    } else {
      var msg = tp&&tp.status==='notStarted' ? '📅 시작일까지 D-'+diffDays(today,plan.startDate)+'일 남았습니다.' : '🏆 모든 회독 완료!';
      todaySection.innerHTML = '<div style="padding:10px 0;font-size:13px;color:var(--dim);">'+msg+'</div><button onclick="openPlanOverlay()" style="padding:7px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;font-size:12px;cursor:pointer;color:var(--dim);font-family:Pretendard,sans-serif;">⚙ 플랜 수정</button>';
    }
  }

  // ── ② 계획 대비 실제 진도 + 밀림 감지 ────────────
  var progSection = document.getElementById('dashProgressBody');
  if(progSection && plan){
    // 계획상 오늘까지 해야 할 문항 수
    var expectedDone = calcExpectedDone(plan, today, allQ);
    // 실제 완료 문항 수
    var actualDone = allQ.filter(function(q){ return isQDone(q); }).length;
    var planTotal = allQ.length;
    var expPct = Math.round(expectedDone/planTotal*100);
    var actPct = Math.round(actualDone/planTotal*100);
    var diff = actualDone - expectedDone; // 양수=앞서감, 음수=밀림
    var diffDays2 = tp&&tp.status==='active'&&tp.qPerDay>0 ? Math.round(Math.abs(diff)/tp.qPerDay) : 0;

    var statusClass = diff >= 0 ? 'ok' : (diff >= -tp.qPerDay*3 ? 'warn' : 'critical');
    var statusMsg = diff >= 0
      ? '✅ 계획보다 '+diff+'문항 앞서가고 있어요!'
      : (statusClass==='warn'
        ? '⚠️ 약 '+diffDays2+'일 분량('+Math.abs(diff)+'문항) 밀려있어요.'
        : '🚨 '+diffDays2+'일 이상('+Math.abs(diff)+'문항) 심각하게 밀렸어요!');

    var delayHtml = '';
    if(diff < 0){
      delayHtml = '<div class="delay-alert '+statusClass+'" style="margin-top:12px;">'
        +'<div class="delay-alert-title">'+statusMsg+'</div>'
        +'<div class="delay-alert-desc">이어서 학습 버튼을 누르면 밀린 분량이 자동으로 처리됩니다.</div>'
        +'</div>';
    } else if(diff > 0) {
      delayHtml = '<div class="delay-alert ok" style="margin-top:12px;">'
        +'<div class="delay-alert-title">'+statusMsg+'</div>'
        +'<div class="delay-alert-desc">진도가 앞서있어요! 페이스를 유지하세요 💪</div>'
        +'</div>';
    } else {
      delayHtml = '<div class="delay-alert ok" style="margin-top:12px;"><div class="delay-alert-title">'+statusMsg+'</div></div>';
    }

    progSection.innerHTML =
      '<div class="prog-compare">'
      +'<div class="prog-compare-row">'
      +'<div class="prog-compare-label"><span>📋 계획</span><span>'+expectedDone+'/'+planTotal+'문항 ('+expPct+'%)</span></div>'
      +'<div class="prog-compare-bar">'
      +'<div class="prog-bar-plan" style="width:'+expPct+'%"></div>'
      +'</div></div>'
      +'<div class="prog-compare-row">'
      +'<div class="prog-compare-label"><span>✏️ 실제</span><span>'+actualDone+'/'+planTotal+'문항 ('+actPct+'%)</span></div>'
      +'<div class="prog-compare-bar">'
      +'<div class="prog-bar-plan" style="width:'+expPct+'%"></div>'
      +'<div class="prog-bar-actual '+statusClass+'" style="width:'+actPct+'%"></div>'
      +'</div></div>'
      +'</div>'
      + delayHtml;
  } else if(progSection){
    progSection.innerHTML = '<div style="font-size:12px;color:var(--muted);">플랜을 설정하면 계획 대비 진도를 확인할 수 있어요. <span style="cursor:pointer;color:var(--c0);text-decoration:underline;" onclick="openPlanOverlay()">플랜 설정하기</span></div>';
  }

  // ── ② 회독별 일일 학습현황 (다크 캘린더) ─────────────
  var calBody = document.getElementById('dashCalBody');
  if(calBody && plan){
    calBody.innerHTML = '';
    var currentRoundIdx = (tp&&tp.status==='active') ? (tp.round-1) : 0;
    var selectedRoundIdx = (typeof window._selectedRoundIdx==='number') ? window._selectedRoundIdx : currentRoundIdx;
    if(selectedRoundIdx >= plan.rounds.length) selectedRoundIdx = plan.rounds.length-1;

    // 회독 탭 (1회독 ~ N회독)
    var tabsHtml = '<div class="round-tabs">';
    plan.rounds.forEach(function(r, ri){
      var tabClass = '';
      if(ri === selectedRoundIdx) tabClass = ' act';
      else if(ri < currentRoundIdx) tabClass = ' done';
      var meta = '';
      if(ri < currentRoundIdx) meta = r.startDate.slice(5).replace('-','/')+' ✓';
      else if(ri === currentRoundIdx) meta = '진행 중';
      else meta = r.startDate.slice(5).replace('-','/')+' ~';
      tabsHtml += '<button class="round-tab'+tabClass+'" onclick="window._selectedRoundIdx='+ri+';renderDashboard();">'
        +'<span class="round-num">'+(ri+1)+'회독</span>'
        +'<span class="round-meta">'+meta+'</span>'
        +'</button>';
    });
    tabsHtml += '</div>';
    calBody.insertAdjacentHTML('beforeend', tabsHtml);

    // 선택된 회독 헤더
    var r = plan.rounds[selectedRoundIdx];
    var qPerDay2 = r.qPerDay || Math.ceil(allQ.length/r.days);
    var headerHtml = '<div class="darkcal-period-row">'
      +'<div class="darkcal-period-info">📅 <span class="accent">'+(selectedRoundIdx+1)+'회독</span> · '+r.startDate+' ~ '+r.endDate+' ('+r.days+'일 · 하루 ~'+qPerDay2+'문제)</div>'
      +'</div>';
    calBody.insertAdjacentHTML('beforeend', headerHtml);

    // 군무원/공무원 모드 범위 배너
    if(planScopeMode === 'gwa'){
      var scopeBannerG = document.createElement('div');
      scopeBannerG.style.cssText = 'background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.3);border-radius:8px;padding:9px 13px;margin-bottom:14px;font-size:12.5px;color:#fde68a;display:flex;align-items:center;gap:6px;font-weight:600;';
      scopeBannerG.innerHTML = '<b>🎖️ 군무원/공무원 기출:</b> '+allQ.length+'문항'
        +'<span style="margin-left:auto;cursor:pointer;color:#fbbf24;text-decoration:underline;" onclick="openPlanOverlay()">범위 수정</span>';
      calBody.appendChild(scopeBannerG);
    }
    // 단원 선택 모드 범위 배너
    if(planScopeMode === 'unit' && planScopeIds.length > 0){
      var scopeBannerU = document.createElement('div');
      scopeBannerU.style.cssText = 'background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3);border-radius:8px;padding:9px 13px;margin-bottom:14px;font-size:12.5px;color:#bfdbfe;display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-weight:600;';
      var scopeNames = [];
      MENU.forEach(function(p){
        p.mids.forEach(function(m){
          var units = m.hasSub ? m.subs : [m];
          units.forEach(function(u){
            if(planScopeIds.indexOf(u.id)>=0) scopeNames.push(u.label);
          });
        });
      });
      scopeBannerU.innerHTML = '<b>📂 선택 범위:</b> '+allQ.length+'문항 — '
        +(scopeNames.length<=4 ? scopeNames.join(' · ') : scopeNames.slice(0,4).join(' · ')+' 외 '+(scopeNames.length-4)+'개')
        +'<span style="margin-left:auto;cursor:pointer;color:#60a5fa;text-decoration:underline;" onclick="openPlanOverlay()">범위 수정</span>';
      calBody.appendChild(scopeBannerU);
    }

    // 캘린더 그리드
    var weekdays = ['일','월','화','수','목','금','토'];
    var grid = document.createElement('div');
    grid.className = 'darkcal-grid';
    weekdays.forEach(function(w){
      var wd = document.createElement('div');
      wd.className = 'darkcal-weekday';
      wd.textContent = w;
      grid.appendChild(wd);
    });
    var firstDate = parseDate(r.startDate);
    var firstDow = firstDate.getDay();
    for(var pi=0; pi<firstDow; pi++){
      var blank = document.createElement('div');
      blank.style.cssText = 'aspect-ratio:1;visibility:hidden;';
      grid.appendChild(blank);
    }
    for(var di=0; di<r.days; di++){
      var ds = addDays(r.startDate, di);
      var sIdx = di*qPerDay2;
      var eIdx = Math.min(sIdx+qPerDay2, allQ.length);
      // act1_ds: 원래 배정일 기반 학습량 (이월 문제 정확 추적)
      var dayActCount = parseInt(localStorage.getItem('act1_'+ds)||'0');
      var dayTotal2 = eIdx-sIdx;
      // 분자 캡: 배정량 초과 학습은 다른 날의 몫이므로 표시는 분모와 같게
      var displayCount = Math.min(dayActCount, dayTotal2);
      var dayPct2 = dayTotal2>0?Math.min(dayActCount/dayTotal2, 1):0;
      var cls = 'darkcal-day ';
      var emoji = '';
      var amtText = '';
      if(ds === today){ cls += 'today'; emoji = '●'; amtText = displayCount+' / '+dayTotal2; }
      else if(ds < today){
        if(dayPct2 >= 1){ cls += 'done'; emoji = '✓'; amtText = displayCount+' / '+dayTotal2; }
        else { cls += 'miss'; emoji = '✗'; amtText = displayCount+' / '+dayTotal2; }
      } else { cls += 'future'; amtText = '예정'; }
      // 늦게 완료된 날: "(N월 N일 완료)" 소형 표시
      var completedAt = (ds < today) ? localStorage.getItem('act1_complete_'+ds) : null;
      if(completedAt && completedAt > ds){
        var cd = parseDate(completedAt);
        amtText += '<br><span style="font-size:9px;opacity:.65;font-weight:600;">'+(cd.getMonth()+1)+'월 '+cd.getDate()+'일 완료</span>';
      }
      var dd2 = parseDate(ds);
      var dayEl = document.createElement('div');
      dayEl.className = cls;
      dayEl.title = ds+'\nQ'+(sIdx+1)+'~Q'+eIdx+'\n그 날 학습: '+dayActCount+'개 / 배정: '+dayTotal2+'개'+(completedAt && completedAt > ds ? '\n완료일: '+completedAt : '');
      var miniBarHtml = (ds < today || ds === today)
        ? '<div class="darkcal-day-mini"><div class="darkcal-day-mini-fill" style="width:'+Math.round(dayPct2*100)+'%"></div></div>'
        : '<div class="darkcal-day-mini"></div>';
      dayEl.innerHTML = '<div class="darkcal-day-top"><div class="darkcal-day-num">'+(dd2.getDate())+'</div>'+(emoji?'<div class="darkcal-day-emoji">'+emoji+'</div>':'')+'</div>'
        +'<div class="darkcal-day-amt">'+amtText+'</div>'
        + miniBarHtml;
      (function(s,e,_ds){ dayEl.onclick = function(){ jumpToDayRange(s,e,_ds); }; })(sIdx,eIdx,ds);
      grid.appendChild(dayEl);
    }
    calBody.appendChild(grid);

    // 범례
    var legendHtml = '<div class="darkcal-legend">'
      +'<span class="darkcal-legend-item"><span class="darkcal-legend-dot" style="background:#22c55e;"></span><strong>완료</strong></span>'
      +'<span class="darkcal-legend-item"><span class="darkcal-legend-dot" style="background:#ef4444;"></span><strong>미완료</strong></span>'
      +'<span class="darkcal-legend-item"><span class="darkcal-legend-dot" style="background:#3b82f6;"></span><strong>오늘</strong></span>'
      +'<span class="darkcal-legend-item"><span class="darkcal-legend-dot" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);"></span><strong>예정</strong></span>'
      +'</div>';
    calBody.insertAdjacentHTML('beforeend', legendHtml);
  } else if(calBody){
    calBody.innerHTML = '<div style="font-size:13px;color:rgba(255,255,255,.65);text-align:center;padding:20px 0;">플랜을 설정하면 회독별 일일 학습현황을 볼 수 있어요.</div>';
  }

  // ── ④ 전체 통계 수치 ─────────────────────────────
  var done3 = allQ.filter(function(q){ return isQDone(q); }).length;
  var todayN = parseInt(localStorage.getItem('act_'+today)||'0');
  var statRow = document.getElementById('dashStatRow');
  if(statRow) statRow.innerHTML =
    '<div class="dash-stat"><div class="dash-stat-val">'+total+'</div><div class="dash-stat-lbl">전체 문제</div></div>'+
    '<div class="dash-stat"><div class="dash-stat-val" style="color:var(--correct)">'+done3+'</div><div class="dash-stat-lbl">완료 문항</div></div>'+
    '<div class="dash-stat"><div class="dash-stat-val" style="color:var(--c2)">'+todayN+'</div><div class="dash-stat-lbl">오늘 완료</div></div>'+
    '<div class="dash-stat"><div class="dash-stat-val" style="color:var(--c1)">'+calcStreak()+'</div><div class="dash-stat-lbl">연속 학습일</div></div>'+
    '<div class="dash-stat"><div class="dash-stat-val" style="color:var(--warn)">'+(plan?'D-'+diffDays(today,plan.examDate):'—')+'</div><div class="dash-stat-lbl">시험까지</div></div>';

  // ── ⑤ 최근 14일 차트 ─────────────────────────────
  var chart = document.getElementById('statsChart');
  if(chart){
    chart.innerHTML='';
    var maxVal=1, dayArr=[];
    for(var di2=13;di2>=0;di2--){
      var dd3=new Date(); dd3.setDate(dd3.getDate()-di2);
      var ds2=dateStr(dd3);
      var n2=parseInt(localStorage.getItem('act_'+ds2)||'0');
      dayArr.push({ds:ds2,n:n2,label:(dd3.getMonth()+1)+'/'+(dd3.getDate())});
      if(n2>maxVal) maxVal=n2;
    }
    dayArr.forEach(function(d){
      var col=document.createElement('div'); col.className='stats-bar-col';
      var h=Math.round((d.n/maxVal)*72);
      var inner=document.createElement('div'); inner.className='stats-bar-inner';
      inner.style.height=Math.max(h,2)+'px'; inner.title=d.label+': '+d.n+'문항';
      var lbl=document.createElement('div'); lbl.className='stats-bar-label'; lbl.textContent=d.label.split('/')[1];
      col.appendChild(inner); col.appendChild(lbl); chart.appendChild(col);
    });
  }

  // ── ③ 단원별 진도율 (다크 한 줄 압축) ──────────────────────
  var unitsEl=document.getElementById('dashUnits');
  if(unitsEl){
    unitsEl.innerHTML='';
    MENU.forEach(function(p){
      // 카테고리 제목 (대단원)
      var unitsCount = 0;
      p.mids.forEach(function(m){ unitsCount += (m.hasSub?m.subs:[m]).filter(function(u){return u.data&&u.data.length;}).length; });
      if(unitsCount === 0) return;
      var catTitle = document.createElement('div');
      catTitle.className = 'dark-units-cat-title';
      catTitle.innerHTML = p.label+' <span class="count">'+unitsCount+'개 단원</span>';
      unitsEl.appendChild(catTitle);
      // 단원 리스트
      var list = document.createElement('div');
      list.className = 'dark-units-list';
      p.mids.forEach(function(m){
        var units=m.hasSub?m.subs:[m];
        units.forEach(function(u){
          if(!u.data||!u.data.length) return;
          var doneU=u.data.filter(function(q){return isQDone(q);}).length;
          var pct=Math.round(doneU/u.data.length*100);
          var lvl=pct>=100?'lvl-3':pct>=60?'lvl-2':pct>=20?'lvl-1':'lvl-0';
          var pctCls = pct>=100?'high':(pct>=60?'mid':(pct>=20?'low':'zero'));
          var inScope = planScopeMode==='all'
            || (planScopeMode==='gwa' && u.id.slice(-1)==='A')
            || planScopeIds.indexOf(u.id)>=0;
          var row = document.createElement('div');
          row.className = 'dark-units-row';
          if(!inScope) row.style.opacity = '0.45';
          row.innerHTML = '<div class="dark-units-name" title="'+u.label+'">'+u.label+'</div>'
            +'<div class="dark-units-bar"><div class="dark-units-fill '+lvl+'" style="width:'+pct+'%"></div></div>'
            +'<div class="dark-units-pct '+pctCls+'">'+pct+'%</div>';
          row.onclick = function(){
            var mid = MENU.reduce(function(a,pm){ return a||(pm.mids.find(function(mm){ return mm.id===m.id||(mm.hasSub&&mm.subs&&mm.subs.find(function(ss){return ss.id===u.id;}))||false; })||null); },null);
            if(mid){ setMode('all'); selectMid(mid); if(m.hasSub&&u.id) selectSub(u.id); }
          };
          list.appendChild(row);
        });
      });
      unitsEl.appendChild(list);
    });
    // 접기/펼치기 상태 복원 (기본 접힘)
    var unitsTitleEl = document.getElementById('unitsTitle');
    var savedOpen = localStorage.getItem('dash_units_open') === '1';
    unitsEl.style.display = savedOpen ? '' : 'none';
    if(unitsTitleEl){
      if(savedOpen) unitsTitleEl.classList.add('open');
      else unitsTitleEl.classList.remove('open');
    }
  }
}

// isQDone은 js/03-state-judge.js로 이동 (핵심 판정 로직 집결)

// ── 계획상 오늘까지 완료했어야 할 문항 수 ────────────
function calcExpectedDone(plan, today, allQ){
  var expected = 0;
  plan.rounds.forEach(function(r){
    if(today < r.startDate) return;
    var qPerDay2 = Math.ceil(allQ.length / r.days);
    if(today >= r.endDate){
      // 이 회독 전체 완료했어야 함
      expected = allQ.length; // 각 회독은 전체를 대상으로 하므로 전체로 계산
    } else {
      var dayIn = diffDays(r.startDate, today); // 0-based
      expected = Math.min((dayIn+1)*qPerDay2, allQ.length);
    }
  });
  return expected;
}

// ── 캘린더 날짜 클릭 → 해당 범위 문제 보기 ──────────
function jumpToDayRange(sIdx, eIdx, ds){
  var allQ = getAllQuestions();
  planStudyMode = true;
  planStudyQIds = allQ.slice(sIdx, eIdx).map(function(q){return q.id;});
  // 해당 날짜의 패스 번호
  var plan = loadPlan();
  if(plan){
    for(var ri=0;ri<plan.rounds.length;ri++){
      if(ds>=plan.rounds[ri].startDate && ds<=plan.rounds[ri].endDate){
        var pn = getTodayPassNum(ds, ri);
        if(pn>1){
          // 2,3차면 X+△만
          var dayQs = allQ.slice(sIdx, eIdx);
          planStudyQIds = dayQs.filter(function(q){ return hasWrongOrConfused(q); }).map(function(q){return q.id;});
          if(planStudyQIds.length===0) planStudyQIds = allQ.slice(sIdx,eIdx).map(function(q){return q.id;});
        }
        break;
      }
    }
  }
  setMode('plan');
  window.scrollTo({top:0, behavior:'smooth'});
}

// ── 밀림 처리 함수들 ──────────────────────────────────
// 오늘 몰아치기: 밀린 문제(오늘 범위 이전 미완료)를 오늘 학습 큐에 추가
function catchUpPlan(){
  var allQ = getPlanQuestions();
  var tp = getTodayPlan();
  if(!tp||tp.status!=='active') return;
  var notDone = allQ.slice(0, tp.endIdx).filter(function(q){ return !isQDone(q); });
  if(notDone.length===0){ alert('밀린 문제가 없어요! 👍'); return; }
  if(!confirm('🔥 오늘 몰아치기\n\n밀린 '+notDone.length+'문항을 오늘 학습 목록에 추가합니다.\n\n지금 바로 시작할까요?')) return;
  planStudyMode = true;
  planStudyQIds = notDone.map(function(q){return q.id;});
  setMode('plan');
}

function replanFromToday(){
  var plan = loadPlan();
  if(!plan) return;
  var allQ = getPlanQuestions();
  var today = todayStr();
  var tp = getTodayPlan();
  if(!tp||tp.status!=='active'){ alert('현재 진행 중인 플랜이 없습니다.'); return; }

  var ri = tp.round - 1; // 현재 회독 인덱스 (0-based)
  var curRound = plan.rounds[ri];

  // ── 현재 회독 재산정 ──
  // 남은 학습일수: 오늘 ~ 현재 회독 마감일
  var remainDays = Math.max(1, getAvailStudyDays(today, curRound.endDate));
  // 실제 남은 문항: 현재 회독 대상 중 미완료
  var remainQs;
  if(tp.isFullPass){
    remainQs = allQ.filter(function(q){ return !isQDone(q); });
  } else {
    remainQs = allQ.filter(function(q){ return hasWrongOrConfused(q); });
    if(remainQs.length===0) remainQs = allQ;
  }
  var newQpd = Math.max(1, Math.ceil(remainQs.length / remainDays));

  // ── 이후 회독 재산정 ──
  // 실제 △·X 수를 직접 사용 (추정 비율 대신)
  var actualWrongCount = allQ.filter(function(q){ return hasWrongOrConfused(q); }).length;
  var rActual = allQ.length > 0 ? actualWrongCount / allQ.length : 0.5;

  var confirmMsg = '📅 일정 재조정\n'
    + '◾ 현재: ' + tp.round + '회독 ' + tp.dayInRound + '/' + tp.roundDays + '일차\n'
    + '◾ 남은 학습일: ' + remainDays + '일\n'
    + '◾ 남은 문항: ' + remainQs.length + '문항\n'
    + '◾ 조정된 일일 목표: ' + newQpd + '문항/일\n'
    + '  (기존: ' + tp.qPerDay + '문항/일)\n'
    + '마감일(' + plan.examDate + ')은 유지됩니다.\n' + '진행 기록도 유지됩니다.\n재조정할까요?';

  if(!confirm(confirmMsg)) return;

  // 현재 회독 qPerDay 업데이트
  plan.rounds[ri].qPerDay = newQpd;
  plan.rounds[ri].adjusted = true;

  // 이후 회독: 실제 △·X 수 기반으로 targetCount/qPerDay 재산정
  for(var i = ri + 1; i < plan.rounds.length; i++){
    var r = plan.rounds[i];
    var tc;
    if(r.isFullRound){
      tc = allQ.length; // 전체 학습 회독
    } else {
      // △·X 회독: 실제 현재 △·X 수 반영
      var setScale = i <= 2 ? 1.0 : (i <= 5 ? 0.85 : 0.70);
      tc = Math.max(1, Math.round(actualWrongCount * setScale));
    }
    var rDays = Math.max(1, r.days);
    plan.rounds[i].targetCount = tc;
    plan.rounds[i].qPerDay = Math.max(1, Math.ceil(tc / rDays));
    plan.rounds[i].adjusted = true;
  }

  // wrongRatio도 실제값으로 업데이트
  plan.wrongRatio = rActual;

  savePlanData(plan);
  renderDashboard();
  renderTodayBanner();
  alert('✅ 일정이 재조정됐습니다!\n\n'
    + '현재 회독: ' + newQpd + '문항/일로 조정\n'
    + '실제 △·X ' + actualWrongCount + '문항(' + Math.round(rActual*100) + '%) 기준으로\n이후 회독 문항수 재산정 완료');
}

// ── 차수 완료 팝업 ──────────────────────────────────────
function _showPassCompletePopup(tp){
  var old = document.getElementById('passCompletePopup');
  if(old) old.remove();

  var isLast = (tp.passNum >= 3);
  var title   = isLast ? '🎉 오늘 3차까지 모두 완료!' : tp.passNum+'차 완료!';
  var subMsg  = isLast
    ? '오늘 학습을 모두 마쳤습니다.\n대시보드로 돌아가거나 다음날 진도를 당길 수 있어요.'
    : (tp.passNum+1)+'차 복습모드로 이동할까요?\n(△·X 지문만 다시 풀기)';
  var btnLabel = isLast ? '📊 대시보드로' : '🔁 '+(tp.passNum+1)+'차 시작';
  var btnAction = isLast ? 'setMode(\'dash\')' : 'advancePass()';
  var btn2 = '<button onclick="document.getElementById(\'passCompletePopup\').remove();" style="padding:10px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;font-size:13px;cursor:pointer;color:var(--dim);font-family:Pretendard,sans-serif;">'+(isLast?'닫기':'계속 보기')+'</button>';

  var overlay = document.createElement('div');
  overlay.id = 'passCompletePopup';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.55);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:14px;padding:26px 22px;width:100%;max-width:340px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.2);">'
    +'<div style="font-size:32px;margin-bottom:8px;">'+(isLast?'🏆':'✅')+'</div>'
    +'<div style="font-size:17px;font-weight:800;margin-bottom:8px;">'+title+'</div>'
    +'<div style="font-size:12.5px;color:var(--dim);margin-bottom:20px;line-height:1.7;white-space:pre-line;">'+subMsg+'</div>'
    +'<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">'
    +'<button onclick="'+btnAction+';document.getElementById(\'passCompletePopup\').remove();" style="padding:10px 18px;background:#fbbf24;color:#1e2540;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:Pretendard,sans-serif;">'+btnLabel+'</button>'
    +btn2
    +'</div></div>';
  document.body.appendChild(overlay);
}

// ── 다음 단원으로 이동 ──────────────────────────────────
function _goNextUnit(){
  var next = getNextUnit();
  if(!next) return;
  curParent = next.parent;
  curMid    = next.mid;
  curSubId  = next.sub;
  masteryFilter = null;
  clearSearch();
  renderTabs();
  renderAll();
  window.scrollTo({top:0, behavior:'smooth'});
}

function jumpToQuestion(qId){
  // SRS 문제로 이동: 해당 단원 찾아서 탭 이동 후 카드 열기
  var found = null, foundMid = null, foundSub = null;
  MENU.forEach(function(p){ p.mids.forEach(function(m){
    if(m.hasSub){ m.subs.forEach(function(s){ if(s.data.find(function(q){return q.id===qId;})){found=true;foundMid=m;foundSub=s.id;} }); }
    else if(m.data&&m.data.find(function(q){return q.id===qId;})){ found=true; foundMid=m; }
  });});
  if(!found) return;
  setMode('all');
  curParent = MENU.find(function(p){return p.mids.indexOf(foundMid)>=0;})||MENU[0]; curParent=curParent.id;
  selectMid(foundMid);
  if(foundSub) selectSub(foundSub);
  setTimeout(function(){
    var el=document.getElementById('q-'+qId);
    if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); if(!gq(qId).open) toggleCard(qId); }
  },300);
}
