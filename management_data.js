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
var O_TYPE      = new Set([
  // AA
  'AA01','AA03','AA04','AA07','AA08','AA17','AA21','AA23','AA26','AA27',
  // AB
  'AB02','AB03','AB06','AB14','AB21','AB23','AB24','AB26','AB30','AB35','AB46','AB47','AB54','AB59','AB60','AB62','AB64','AB65','AB67','AB74','AB75','AB76','AB78',
  // BA
  'BA02','BA04','BA05','BA10','BA12','BA13','BA17','BA25','BA28','BA30','BA33','BA35','BA36','BA39','BA43','BA45','BA52','BA55',
  // BB
  'BB13','BB14','BB15','BB21','BB22','BB23','BB29','BB30','BB31','BB33','BB34','BB41','BB43','BB44','BB45','BB46','BB47','BB49','BB51','BB52','BB53','BB55','BB57','BB58',
  // CA
  'CA01','CA09','CA16','CA17','CA18','CA21',
  // CB
  'CB03','CB14','CB20','CB21','CB22','CB25','CB28','CB31','CB33','CB36','CB37','CB38','CB40','CB42',
  // DA
  'DA01','DA03','DA04','DA13','DA19','DA26','DA38','DA39','DA46','DA48','DA49','DA51','DA52','DA54',
  // DB
  'DB04','DB06','DB07','DB10','DB12','DB19','DB22','DB25','DB28','DB31','DB32','DB33','DB34','DB35','DB37','DB43','DB45','DB46','DB48','DB49','DB57','DB58','DB59','DB60','DB61','DB62','DB64','DB69','DB70','DB72','DB74','DB80','DB81','DB82','DB83','DB86',
  // EB
  'EB08','EB09',
  // FA
  'FA03','FA06','FA07','FA08','FA12','FA13','FA14','FA15','FA17','FA18','FA20','FA21','FA25','FA26','FA27',
  // FB
  'FB03','FB09','FB11','FB14','FB16','FB17','FB18','FB19','FB22','FB23','FB26','FB28','FB31','FB32','FB33','FB35','FB37','FB40','FB41','FB42','FB49','FB51','FB52','FB53','FB54','FB57','FB59','FB63','FB66','FB67',
  // GA
  'GA01','GA02','GA03','GA04','GA11','GA12','GA13','GA18','GA19','GA20','GA21','GA23','GA24','GA29','GA31','GA32','GA33','GA34','GA38','GA39','GA40','GA41','GA44',
  // GB
  'GB01','GB03','GB08','GB09','GB10','GB11','GB12','GB13','GB15','GB16','GB17','GB18','GB20','GB21','GB22','GB23','GB26','GB27','GB29','GB30','GB37','GB38','GB40','GB43','GB44','GB45','GB46','GB47','GB48','GB49','GB50','GB51','GB53','GB54','GB55','GB57','GB58','GB59','GB62','GB65','GB66','GB67','GB68','GB69','GB70','GB74','GB75','GB76',
  // HA
  'HA02','HA05','HA06','HA11','HA14',
  // HB
  'HB07','HB09','HB10','HB12',
  // IB
  'IB02',
  // JA
  'JA03','JA05','JA07','JA09','JA10','JA14','JA22','JA27','JA29','JA31',
  // JB
  'JB03','JB04','JB06','JB07','JB11','JB12','JB19','JB25','JB26','JB29','JB34','JB36','JB37','JB38',
  // KA
  'KA05','KA06',
  // KB
  'KB03','KB04','KB07','KB08','KB10','KB11','KB13','KB16',
  // LA
  'LA07','LA10','LA14',
  // LB
  'LB02','LB03','LB04','LB05','LB07','LB08','LB09','LB10','LB12','LB13','LB14','LB19','LB21','LB23','LB26','LB28','LB29','LB30','LB32','LB33','LB34','LB38',
  // MA
  'MA01','MA02','MA05','MA06','MA08','MA09',
  // MB
  'MB01','MB02','MB05','MB06','MB08','MB09','MB10','MB11','MB12','MB13','MB14','MB15','MB16','MB17','MB18','MB19',
  // NB
  'NB04',
  // OA
  'OA01','OA03',
  // OB
  'OB02','OB03'
]);
var Q_EXPS_BOX  = new Set([]);
var Q3_TYPE     = new Set([]);
var Q_OPTS_BOX = new Set([
  // AA
  'AA02','AA20','AA24','AA29',
  // AB
  'AB15','AB19','AB34','AB37','AB38','AB56','AB73','AB77','AB81',
  // BA
  'BA06',
  // BB
  'BB02','BB24','BB32','BB37','BB56',
  // CA
  'CA14','CA19',
  // CB
  'CB12','CB43',
  // DA
  'DA08','DA37',
  // DB
  'DB20','DB36','DB50','DB51'
]);
var NUMS        = ['①','②','③','④','⑤'];
