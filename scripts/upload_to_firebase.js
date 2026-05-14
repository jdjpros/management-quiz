/**
 * Firebase 문제 데이터 업로드 스크립트
 * GitHub Actions에서 자동 실행됨
 *
 * 환경 변수:
 *   FIREBASE_SERVICE_ACCOUNT — Firebase 서비스 계정 키 JSON (GitHub Secret)
 */

'use strict';

const admin = require('firebase-admin');
const vm    = require('vm');
const fs    = require('fs');
const path  = require('path');

// ── Firebase Admin 초기화 ──────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential:  admin.credential.cert(serviceAccount),
  databaseURL: 'https://management-quiz-5bd98-default-rtdb.asia-southeast1.firebasedatabase.app'
});
const db = admin.database();

// ── 브라우저용 JS를 Node.js에서 로드하는 헬퍼 ────────────
// const/let → var 치환 후 vm으로 실행해 context에 전역 변수 바인딩
function loadScript(filePath, context) {
  const code = fs.readFileSync(filePath, 'utf8')
    .replace(/\bconst\b/g, 'var')
    .replace(/\blet\b/g, 'var');
  vm.runInNewContext(code, context);
}

// ── unit_*.js 50개 → context에 UNIT_AA … UNIT_YB 등록 ──
// window = context 자신으로 설정 → window['UNIT_AA'] 등 브라우저 전역 접근 허용
const context = {};
context.window = context;
const dataDir = path.join(__dirname, '..', 'data');
const unitFiles = fs.readdirSync(dataDir)
  .filter(f => /^unit_[A-Z]{2}\.js$/.test(f))
  .sort();

console.log(`unit 파일 로드 중: ${unitFiles.length}개`);
for (const file of unitFiles) {
  loadScript(path.join(dataDir, file), context);
}

// ── management_data.js → MENU, O_TYPE, Q_EXPS_BOX, Q_OPTS_BOX, Q3_TYPE ──
loadScript(path.join(__dirname, '..', 'management_data.js'), context);

const { MENU, O_TYPE, Q_EXPS_BOX, Q_OPTS_BOX, Q3_TYPE } = context;
if (!MENU || !O_TYPE) {
  console.error('❌ management_data.js 로드 실패: MENU 또는 O_TYPE이 없습니다.');
  process.exit(1);
}

// ── MENU에서 unit 데이터 수집 ─────────────────────────────
const units = {};
MENU.forEach(parent => {
  parent.mids.forEach(mid => {
    if (mid.hasSub) {
      mid.subs.forEach(sub => {
        if (sub.data && sub.data.length > 0) units[sub.id] = sub.data;
      });
    } else if (mid.data && mid.data.length > 0) {
      units[mid.id] = mid.data;
    }
  });
});

// ── MENU 구조 (data 참조 제거) ────────────────────────────
const menuStructure = MENU.map(p => ({
  id: p.id, label: p.label,
  mids: p.mids.map(m => {
    if (m.hasSub) return {
      id: m.id, label: m.label, hasSub: true,
      subs: m.subs.map(s => ({ id: s.id, label: s.label }))
    };
    return { id: m.id, label: m.label };
  })
}));

// ── 메타 데이터 (Set → Array) ─────────────────────────────
const meta = {
  o_type:     Array.from(O_TYPE),
  q_exps_box: Array.from(Q_EXPS_BOX),
  q_opts_box: Array.from(Q_OPTS_BOX),
  q3_type:    Array.from(Q3_TYPE)
};

const totalQ = Object.keys(units).reduce((s, k) => s + units[k].length, 0);
console.log(`유닛: ${Object.keys(units).length}개 / 총 ${totalQ}문제`);
console.log(`o_type: ${meta.o_type.length}개 / q_exps_box: ${meta.q_exps_box.length}개 / q_opts_box: ${meta.q_opts_box.length}개`);

// ── Firebase 업로드 ───────────────────────────────────────
console.log('🔥 Firebase 업로드 중...');
db.ref('questions/management')
  .set({ units, meta, menu: menuStructure })
  .then(() => {
    console.log('✅ Firebase 업로드 완료');
    process.exit(0);
  })
  .catch(e => {
    console.error('❌ 업로드 실패:', e.message);
    process.exit(1);
  });
