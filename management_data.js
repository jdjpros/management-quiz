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
  'AA04','AA07','AA08','AA17','AA21','AA23','AA24','AA26',
  'AA27','AA29',
  // AB
  'AB02','AB03','AB06','AB14','AB15','AB19','AB21','AB23','AB24','AB26','AB30','AB34',
  'AB37','AB38','AB46','AB47','AB54','AB56','AB59','AB60','AB62','AB64','AB65','AB67',
  'AB73','AB74','AB75','AB76','AB77','AB78','AB81',
  // BA
  'BA02','BA04','BA05','BA06','BA10','BA12','BA13','BA17','BA25','BA28','BA30','BA33',
  'BA35','BA36','BA43','BA45','BA52','BA55',
  // BB
  'BB02','BB13','BB14','BB15','BB21','BB22','BB23','BB24','BB29','BB30','BB31','BB32',
  'BB33','BB34','BB37','BB41','BB43','BB44','BB45','BB46','BB47','BB49','BB51','BB52',
  'BB53','BB55','BB56','BB57','BB58',
  // CA
  'CA01','CA09','CA14','CA16','CA17','CA18','CA19','CA21',
  // CB
  'CB03','CB12','CB14','CB20','CB21','CB22','CB25','CB28','CB31','CB33','CB36','CB37',
  'CB38','CB40','CB42','CB43',
  // DA
  'DA01','DA03','DA04','DA13','DA19','DA26','DA37','DA38','DA39','DA46','DA48','DA49',
  'DA51','DA52','DA54',
  // DB
  'DB04','DB06','DB07','DB10','DB12','DB19','DB20','DB22','DB25','DB28','DB31','DB32',
  'DB33','DB34','DB35','DB36','DB37','DB43','DB45','DB46','DB48','DB49','DB50','DB57',
  'DB58','DB59','DB60','DB61','DB62','DB64','DB69','DB70','DB72','DB74','DB80','DB81',
  'DB82','DB83','DB86',
  // EB
  'EB08','EB09',
  // FA
  'FA03','FA06','FA07','FA13','FA15','FA17','FA18','FA20','FA21','FA25','FA26','FA27',
  // FB
  'FB03','FB09','FB11','FB14','FB16','FB17','FB18','FB19','FB22','FB23','FB26','FB28',
  'FB31','FB32','FB33','FB35','FB37','FB40','FB41','FB42','FB49','FB51','FB52','FB53',
  'FB54','FB57','FB59','FB63','FB66','FB67',
  // GA
  'GA01','GA02','GA03','GA11','GA12','GA13','GA18','GA19','GA20','GA21','GA23','GA24','GA29',
  'GA31','GA32','GA33','GA34','GA38','GA39','GA40','GA41','GA44',
  // GB
  'GB01','GB03','GB08','GB09','GB10','GB11','GB12','GB13','GB15','GB16','GB17','GB21',
  'GB22','GB23','GB26','GB27','GB29','GB30','GB37','GB38','GB40','GB43','GB45','GB46',
  'GB47','GB49','GB50','GB51','GB53','GB54','GB55','GB62','GB65','GB67','GB69','GB74',
  'GB75','GB76',
  // HA
  'HA02','HA05','HA06','HA11','HA14',
  // HB
  'HB07','HB09','HB10','HB12',
  // IB
  'IB02',
  // JA
  'JA03','JA05','JA07','JA09','JA10','JA14','JA22','JA27','JA29','JA31',
  // JB
  'JB03','JB04','JB06','JB07','JB11','JB12','JB19','JB25','JB26','JB29','JB34','JB36',
  'JB37','JB38',
  // KA
  'KA05','KA06',
  // KB
  'KB03','KB04','KB07','KB08','KB10','KB11','KB13','KB16',
  // LA
  'LA07','LA10','LA14',
  // LB
  'LB02','LB03','LB04','LB05','LB07','LB08','LB09','LB10','LB12','LB13','LB14','LB19',
  'LB21','LB23','LB26','LB29','LB30','LB32','LB33','LB34','LB38',
  // MA
  'MA01','MA02','MA05','MA06','MA08','MA09',
  // MB
  'MB01','MB02','MB05','MB06','MB08','MB09','MB10','MB11','MB12','MB13','MB14','MB15',
  'MB16','MB18',
  // NB
  'NB04',
  // OA
  'OA01','OA03',
  // PA
  'PA01','PA02','PA03','PA08','PA10','PA11','PA12','PA14','PA15',
  // PB
  'PB01','PB02','PB04','PB05','PB08','PB09','PB10','PB11','PB12','PB15','PB16','PB20',
  'PB21',
  // QA
  'QA05','QA07','QA08','QA11','QA12','QA13','QA14','QA15','QA16','QA17','QA19','QA20',
  'QA21','QA25','QA27','QA29','QA31','QA32','QA41','QA43','QA44','QA45','QA47','QA50',
  'QA51','QA58','QA62','QA64','QA69','QA70','QA72','QA73','QA75','QA78','QA79','QA80',
  'QA84','QA86','QA88','QA89','QA90','QA94','QA104','QA105','QA108',
  // QB
  'QB02','QB03','QB05','QB06','QB07','QB09','QB10','QB11','QB12','QB13','QB14','QB15',
  'QB16','QB17','QB19','QB20','QB21','QB23','QB24','QB25','QB26','QB27','QB28','QB29',
  'QB30','QB32','QB33','QB35','QB36','QB38','QB44','QB47','QB48','QB49','QB50','QB51',
  'QB52','QB53','QB54','QB56','QB58','QB60','QB69','QB70','QB72','QB73','QB75','QB76',
  'QB77','QB78','QB79','QB81','QB82','QB83','QB84','QB85','QB86','QB89','QB91','QB93',
  'QB94','QB96','QB97','QB99','QB100','QB102','QB103','QB104','QB105','QB106','QB108',
  // RA
  'RA01','RA02','RA03',
  // RB
  'RB02','RB03','RB04','RB05',
  // SA
  'SA01','SA04','SA05','SA08','SA09','SA10','SA11','SA15','SA16','SA17','SA18','SA21',
  'SA22','SA23','SA24','SA25','SA27','SA28','SA29','SA30',
  // SB
  'SB02','SB03','SB04','SB05','SB06','SB07','SB10','SB11','SB12','SB14','SB17','SB18',
  'SB19',
  // TA
  'TA03','TA04','TA05','TA09','TA11','TA15','TA16','TA17','TA18','TA19','TA20','TA21',
  'TA22','TA23','TA27','TA31','TA32','TA34','TA35','TA36','TA38','TA39','TA43','TA44','TA45',
  // TB
  'TB07','TB10','TB13','TB14','TB15','TB16','TB17','TB18','TB19','TB20','TB21','TB22',
  'TB25','TB26','TB27','TB28','TB29','TB35',
  // UA
  'UA05','UA06','UA07','UA11','UA13','UA15','UA26','UA27','UA31','UA32','UA33','UA39','UA40','UA42','UA43','UA45',
  'UA49','UA50','UA51','UA54','UA55','UA56','UA57','UA58','UA60','UA61','UA63','UA65','UA66','UA67',
  // UB
  'UB03','UB04','UB05','UB06','UB08','UB09','UB10','UB11','UB13','UB16','UB19','UB20',
  'UB21','UB23','UB27','UB28','UB31','UB36','UB37','UB39','UB40','UB41','UB42','UB43',
  'UB44','UB49','UB51','UB52','UB53','UB54','UB60','UB61','UB62','UB64','UB68','UB70',
  'UB71','UB72','UB73','UB78',
  // VA
  'VA05',
  // VB
  'VB02','VB06','VB09','VB11','VB14','VB15','VB16','VB17','VB18','VB19','VB21','VB23',
  'VB25','VB26','VB27',
  // WA
  'WA03','WA04','WA05','WA06','WA12','WA16','WA17','WA18','WA19','WA22','WA23','WA25','WA26','WA29','WA33','WA36','WA40','WA41',
  'WA43','WA46','WA48','WA50','WA51','WA53','WA54','WA55','WA56','WA62','WA72','WA74','WA77','WA78','WA90',
  // WB
  'WB01','WB04','WB05','WB06','WB07','WB10','WB11','WB12','WB13','WB14','WB15','WB16',
  'WB17','WB18','WB20','WB22','WB24','WB25','WB28','WB29','WB30','WB31','WB32','WB33',
  'WB34','WB35','WB36','WB37','WB38','WB39','WB40','WB44','WB45','WB46','WB47','WB48',
  'WB49','WB50','WB51','WB53','WB54','WB55','WB56','WB57','WB58','WB60','WB61','WB63',
  'WB64','WB65','WB66','WB69','WB71','WB72','WB73','WB75','WB79','WB80','WB81','WB82',
  'WB83','WB85','WB86','WB87','WB89','WB90','WB92','WB93','WB94','WB96','WB97','WB98',
  'WB99','WB100','WB101','WB102','WB103','WB104','WB106','WB107','WB108','WB109','WB111','WB113',
  'WB115',
  // XA
  'XA05','XA07','XA09','XA10','XA11','XA14','XA15','XA17','XA19','XA20','XA25','XA27','XA30','XA31','XA32','XA33','XA41',
  'XA44','XA45',
  // YA
  'YA01','YA03','YA09','YA10',
  // YB
  'YB01','YB02','YB03','YB04','YB05','YB06','YB07','YB09','YB10','YB11','YB13','YB14',
  'YB15','YB16','YB17','YB18','YB19','YB20','YB21','YB22','YB26','YB27','YB28','YB29',
  'YB31','YB34','YB36','YB37','YB40','YB42','YB43','YB45','YB46'
]);
var Q_EXPS_BOX  = new Set([
  // FB: 모두 고른 것 / 연결 유형 - ㄱ.ㄴ.ㄷ. 항목별 개별 판단
  'FB14','FB22','FB32','FB52','FB59','FB63',
  // GA
  'GA23',
  // GB
  'GB17','GB43','GB46','GB62','GB74','GB76',
  // HA
  'HA06','HA11','HA14',
  // HB
  'HB07',
  // JA
  'JA09','JA22',
  // JB
  'JB04','JB26','JB29','JB34',
  // LB
  'LB38',
  // PA
  'PA02',
  // QA
  'QA32','QA79','QA80',
  // QB
  'QB02','QB06','QB07','QB29','QB89',
  // SA
  'SA15','SA22',
  // SB
  'SB10',
  // TA
  'TA03','TA22',
  // TB
  'TB13',
  // UA
  'UA05',
  // UB
  'UB09','UB13','UB23','UB70','UB78',
  // VB
  'VB06','VB09','VB15','VB16','VB25',
  // WA
  'WA12','WA16','WA17','WA74',
  // WB
  'WB10','WB14','WB66','WB69','WB71',
  // XA
  'XA06','XA07','XA44',
  // YB
  'YB06'
]);
var Q3_TYPE     = new Set(['FA15','FB11','GB11','PA03','QA78','RB03','SA16','UA13','UA43','YA01']); // 순서/선택 나열형: stem에 ㄱ.ㄴ.ㄷ. 있지만 opts(①②③④)가 정오 판단 대상
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
