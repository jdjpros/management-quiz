// ═══════════════════════════════════════════
// 경영학 기출문제집 OX풀이 - 메뉴 및 설정
// 각 단원 데이터는 data/unit_XX.js 에서 로드
// ═══════════════════════════════════════════

// 미완성 단원 fallback (data/unit_XX.js 미로드 시 대비)
var _units = 'AA,AB,BA,BB,CA,CB,DA,DB,EA,EB,FA,FB,GA,GB,HA,HB,IA,IB,JA,JB,KA,KB,LA,LB,MA,MB,NA,NB,OA,OB,PA,PB,QA,QB,RA,RB,SA,SB,TA,TB,UA,UB,VA,VB,WA,WB,XA,XB,YA,YB'.split(',');
_units.forEach(function(u){ if(typeof window['UNIT_'+u]==='undefined') window['UNIT_'+u]=[]; });


// ═══════════════════════════════════════════
// MENU 구조
// ═══════════════════════════════════════════
var MENU = [
  {id:'A', label:'경영학 기초개념', mids:[
    {id:'AA', label:'군무원/공무원 기출', data:UNIT_AA},
    {id:'AB', label:'기타 기출', data:UNIT_AB}
  ]},
  {id:'B', label:'경영자와 기업', mids:[
    {id:'BA', label:'군무원/공무원 기출', data:UNIT_BA},
    {id:'BB', label:'기타 기출', data:UNIT_BB}
  ]},
  {id:'C', label:'경영관리', mids:[
    {id:'CA', label:'군무원/공무원 기출', data:UNIT_CA},
    {id:'CB', label:'기타 기출', data:UNIT_CB}
  ]},
  {id:'D', label:'경영전략', mids:[
    {id:'DA', label:'군무원/공무원 기출', data:UNIT_DA},
    {id:'DB', label:'기타 기출', data:UNIT_DB}
  ]},
  {id:'E', label:'조직행동론 기초개념', mids:[
    {id:'EA', label:'군무원/공무원 기출', data:UNIT_EA},
    {id:'EB', label:'기타 기출', data:UNIT_EB}
  ]},
  {id:'F', label:'개인수준 활동', mids:[
    {id:'FA', label:'군무원/공무원 기출', data:UNIT_FA},
    {id:'FB', label:'기타 기출', data:UNIT_FB}
  ]},
  {id:'G', label:'집단수준 활동', mids:[
    {id:'GA', label:'군무원/공무원 기출', data:UNIT_GA},
    {id:'GB', label:'기타 기출', data:UNIT_GB}
  ]},
  {id:'H', label:'조직수준 활동', mids:[
    {id:'HA', label:'군무원/공무원 기출', data:UNIT_HA},
    {id:'HB', label:'기타 기출', data:UNIT_HB}
  ]},
  {id:'I', label:'인적자원관리 기초개념', mids:[
    {id:'IA', label:'군무원/공무원 기출', data:UNIT_IA},
    {id:'IB', label:'기타 기출', data:UNIT_IB}
  ]},
  {id:'J', label:'인적자원 조달', mids:[
    {id:'JA', label:'군무원/공무원 기출', data:UNIT_JA},
    {id:'JB', label:'기타 기출', data:UNIT_JB}
  ]},
  {id:'K', label:'인적자원 개발', mids:[
    {id:'KA', label:'군무원/공무원 기출', data:UNIT_KA},
    {id:'KB', label:'기타 기출', data:UNIT_KB}
  ]},
  {id:'L', label:'인적자원 평가와 보상', mids:[
    {id:'LA', label:'군무원/공무원 기출', data:UNIT_LA},
    {id:'LB', label:'기타 기출', data:UNIT_LB}
  ]},
  {id:'M', label:'인적자원 유지 및 방출', mids:[
    {id:'MA', label:'군무원/공무원 기출', data:UNIT_MA},
    {id:'MB', label:'기타 기출', data:UNIT_MB}
  ]},
  {id:'N', label:'생산운영관리 기초개념', mids:[
    {id:'NA', label:'군무원/공무원 기출', data:UNIT_NA},
    {id:'NB', label:'기타 기출', data:UNIT_NB}
  ]},
  {id:'O', label:'생산전략', mids:[
    {id:'OA', label:'군무원/공무원 기출', data:UNIT_OA},
    {id:'OB', label:'기타 기출', data:UNIT_OB}
  ]},
  {id:'P', label:'생산시스템 설계', mids:[
    {id:'PA', label:'군무원/공무원 기출', data:UNIT_PA},
    {id:'PB', label:'기타 기출', data:UNIT_PB}
  ]},
  {id:'Q', label:'생산시스템 운영 및 통제', mids:[
    {id:'QA', label:'군무원/공무원 기출', data:UNIT_QA},
    {id:'QB', label:'기타 기출', data:UNIT_QB}
  ]},
  {id:'R', label:'마케팅 기초개념', mids:[
    {id:'RA', label:'군무원/공무원 기출', data:UNIT_RA},
    {id:'RB', label:'기타 기출', data:UNIT_RB}
  ]},
  {id:'S', label:'마케팅 기회분석', mids:[
    {id:'SA', label:'군무원/공무원 기출', data:UNIT_SA},
    {id:'SB', label:'기타 기출', data:UNIT_SB}
  ]},
  {id:'T', label:'마케팅 전략', mids:[
    {id:'TA', label:'군무원/공무원 기출', data:UNIT_TA},
    {id:'TB', label:'기타 기출', data:UNIT_TB}
  ]},
  {id:'U', label:'마케팅믹스', mids:[
    {id:'UA', label:'군무원/공무원 기출', data:UNIT_UA},
    {id:'UB', label:'기타 기출', data:UNIT_UB}
  ]},
  {id:'V', label:'마케팅 영역 확장', mids:[
    {id:'VA', label:'군무원/공무원 기출', data:UNIT_VA},
    {id:'VB', label:'기타 기출', data:UNIT_VB}
  ]},
  {id:'W', label:'재무관리', mids:[
    {id:'WA', label:'군무원/공무원 기출', data:UNIT_WA},
    {id:'WB', label:'기타 기출', data:UNIT_WB}
  ]},
  {id:'X', label:'회계학', mids:[
    {id:'XA', label:'군무원/공무원 기출', data:UNIT_XA},
    {id:'XB', label:'기타 기출', data:UNIT_XB}
  ]},
  {id:'Y', label:'경영정보시스템', mids:[
    {id:'YA', label:'군무원/공무원 기출', data:UNIT_YA},
    {id:'YB', label:'기타 기출', data:UNIT_YB}
  ]}
];

// ═══════════════════════════════════════════
// 문제 유형 Set
// ═══════════════════════════════════════════
var O_TYPE      = new Set([]);
var Q_EXPS_BOX  = new Set([]);
var Q_OPTS_BOX  = new Set([
  'AA02','AA20','AA24','AA29',
  'AB15','AB19','AB34','AB37','AB38','AB56','AB73','AB77','AB81',
  'BA06',
  'BB02','BB24','BB32','BB37','BB56',
  'CA14','CA19',
  'DA08','DA37',
  'DB20','DB36','DB50','DB51'
]);
var NUMS        = ['①','②','③','④','⑤'];
