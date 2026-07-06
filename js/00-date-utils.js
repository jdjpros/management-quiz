// ═══════════════════════════════════════════
// 00-date-utils.js — 순수 날짜 유틸 함수 모음
// ═══════════════════════════════════════════
// 목적: 앱 전역에서 쓰이는 순수 날짜 계산 유틸을 한 곳에 모은다.
//   (입력→출력 계산만 하는 함수. 도메인/집계/마이그레이션 로직은 제외)
// 규칙: 이 파일은 **함수/상수 정의만** 담는다. 로드 시점 실행 코드 금지.
//       (로드 시점 실행은 js/99-boot.js에만 허용)
// 로드 순서: index.html에서 01-core-firebase.js 앞에 로드된다.
//
// STUDY_DAY_CUTOFF_HOUR=4 규칙: 새벽 4시 이전은 전날로 취급.
//   todayStr()에 구현. localStorage의 _dateOffset 테스트 키도 읽는다.
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

// 날짜 유틸
function dateStr(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
function parseDate(s){ var p=s.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }
function diffDays(a,b){ return Math.round((parseDate(b)-parseDate(a))/(1000*60*60*24)); }
function addDays(s,n){ var d=parseDate(s); d.setDate(d.getDate()+n); return dateStr(d); }

// 주말 제외 옵션 반영한 날짜 이동
function addStudyDays(startStr, n){
  return planIncludeWeekend ? addDays(startStr, n) : addWeekdays(startStr, n);
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
