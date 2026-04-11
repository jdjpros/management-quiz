/**
 * update_sets.js
 * 모든 unit_XX.js 파일을 읽어 O_TYPE / Q_OPTS_BOX를 자동 감지하고
 * management_data.js의 Set 정의를 갱신합니다.
 *
 * 실행: node update_sets.js
 */

const fs   = require('fs');
const path = require('path');

// ── 1. 단원 파일 수집 ────────────────────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
const files   = fs.readdirSync(dataDir)
  .filter(f => /^unit_[A-Z]{2}\.js$/.test(f))
  .sort();

const oTypeIds    = [];
const optsBoxIds  = [];
const errors      = [];

// ── 2. 각 파일 파싱 ──────────────────────────────────────────────────────────
files.forEach(file => {
  const unitId = file.replace('unit_', '').replace('.js', '');
  let code = fs.readFileSync(path.join(dataDir, file), 'utf8');

  // const/var UNIT_XX = [...] → var _data = [...] (전체 치환)
  code = code.replace(/(?:const|var)\s+UNIT_[A-Z]+\s*=/g, 'var _data =');

  let data;
  try {
    const vm = require('vm');
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(code, ctx);
    data = ctx._data;
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
    return;
  }

  if (!Array.isArray(data) || data.length === 0) return;

  data.forEach(q => {
    if (!q || !q.id || !q.ans || !Array.isArray(q.exps) || !Array.isArray(q.opts)) return;

    // Q_OPTS_BOX: opts 첫 번째 항목이 ㄱ~ㅎ로 시작
    const isBox = /^[ㄱ-ㅎ]/.test((q.opts[0] || '').trim());
    if (isBox) {
      optsBoxIds.push(q.id);
      return;
    }

    // O_TYPE: 정답(ans) 위치의 ox가 'O'
    const ansExp = q.exps[q.ans - 1];
    if (ansExp && ansExp.ox === 'O') {
      oTypeIds.push(q.id);
    }
  });
});

// ── 3. management_data.js 갱신 ──────────────────────────────────────────────
const mgmtPath = path.join(__dirname, 'management_data.js');
let mgmt = fs.readFileSync(mgmtPath, 'utf8');

// 단원별로 묶어서 보기 좋게 포맷
function formatSet(ids, label) {
  if (ids.length === 0) return `var ${label}      = new Set([]);`;

  // 단원 prefix(2자리)별로 그룹화
  const groups = {};
  ids.forEach(id => {
    const prefix = id.slice(0, 2);
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(`'${id}'`);
  });

  const lines = Object.entries(groups).map(([prefix, arr]) =>
    `  // ${prefix}\n  ${arr.join(',')}`
  );

  const pad = label === 'O_TYPE' ? '      ' : ' ';
  return `var ${label}${pad}= new Set([\n${lines.join(',\n')}\n]);`;
}

// O_TYPE Set 교체
mgmt = mgmt.replace(
  /var O_TYPE\s*=\s*new Set\(\[[\s\S]*?\]\);/,
  formatSet(oTypeIds, 'O_TYPE')
);

// Q_OPTS_BOX Set 교체
mgmt = mgmt.replace(
  /var Q_OPTS_BOX\s*=\s*new Set\(\[[\s\S]*?\]\);/,
  formatSet(optsBoxIds, 'Q_OPTS_BOX')
);

fs.writeFileSync(mgmtPath, mgmt, 'utf8');

// ── 4. 결과 출력 ─────────────────────────────────────────────────────────────
console.log('');
console.log('✅ management_data.js 갱신 완료');
console.log(`   O_TYPE    : ${oTypeIds.length}개`);
console.log(`   Q_OPTS_BOX: ${optsBoxIds.length}개`);
console.log('');

if (errors.length > 0) {
  console.log('⚠️  파싱 오류 발생:');
  errors.forEach(e => console.log('   -', e));
  console.log('');
}

console.log('📋 단원별 O_TYPE 수:');
const prefixes = [...new Set(oTypeIds.map(id => id.slice(0, 2)))];
prefixes.forEach(p => {
  const cnt = oTypeIds.filter(id => id.startsWith(p)).length;
  console.log(`   ${p}: ${cnt}개`);
});
