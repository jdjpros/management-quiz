# 🔧 관리자 콘솔 스크립트 템플릿

> admin.html 로그인 후 브라우저 콘솔(F12)에 붙여넣어 실행
> ADMIN_UID로 로그인되어 있어야 작동 (보안 규칙)

---

## 📝 문제 수정

### 1) 특정 문제 1개 통째로 교체
```js
// AA 단원 3번째 문제 (인덱스 2) 통째 교체
db.ref('questions/management/units/AA/2').set({
  id: 'AA03',
  stem: '새로운 지문 내용...',
  opts: ['①선택지1','②선택지2','③선택지3','④선택지4'],
  exps: [
    { ox:'O', text:'1번 해설' },
    { ox:'X', text:'2번 해설' },
    { ox:'O', text:'3번 해설' },
    { ox:'O', text:'4번 해설' }
  ]
}).then(()=>console.log('✅ AA[2] 저장 완료')).catch(e=>console.error('❌', e));
```

### 2) 특정 문제의 특정 필드만 패치
```js
// AA 단원 3번째 문제의 stem만 수정
db.ref('questions/management/units/AA/2/stem')
  .set('수정된 지문 텍스트...')
  .then(()=>console.log('✅ stem 수정 완료'));

// 특정 해설(exps의 2번째)만 수정
db.ref('questions/management/units/AA/2/exps/1')
  .set({ ox:'X', text:'수정된 해설' })
  .then(()=>console.log('✅ exps[1] 수정 완료'));
```

### 3) 문제 ID로 검색 후 수정 (인덱스 모를 때)
```js
// 'UA42' 문제 찾아서 수정
db.ref('questions/management/units').once('value').then(s=>{
  var units = s.val();
  for(var u in units){
    var arr = units[u] || [];
    for(var i=0; i<arr.length; i++){
      if(arr[i] && arr[i].id === 'UA42'){
        console.log('Found at units/' + u + '/' + i);
        // 여기서 db.ref('questions/management/units/'+u+'/'+i+'/stem').set('새 텍스트');
        return;
      }
    }
  }
  console.log('Not found');
});
```

---

## 🏷 메타 변수 관리 (O_TYPE / Q3_TYPE / Q_OPTS_BOX / Q_EXPS_BOX)

### O_TYPE에 문제 ID 추가
```js
db.ref('questions/management/meta/o_type').once('value').then(s=>{
  var arr = s.val() || [];
  arr.push('UA99');
  return db.ref('questions/management/meta/o_type').set([...new Set(arr)]);
}).then(()=>console.log('✅ O_TYPE에 UA99 추가'));
```

### O_TYPE에서 문제 ID 제거
```js
db.ref('questions/management/meta/o_type').once('value').then(s=>{
  var arr = (s.val()||[]).filter(id => id !== 'UA99');
  return db.ref('questions/management/meta/o_type').set(arr);
}).then(()=>console.log('✅ O_TYPE에서 UA99 제거'));
```

### Q3_TYPE / Q_OPTS_BOX / Q_EXPS_BOX 동일 패턴
```js
// 위 코드에서 'o_type' → 'q3_type' / 'q_opts_box' / 'q_exps_box'
```

---

## 👥 사용자 데이터 조회

### 모든 사용자 목록 + 학습량
```js
db.ref('users').once('value').then(s=>{
  var users = s.val() || {};
  Object.entries(users).forEach(([uid, u]) => {
    var stateCount = Object.keys(u.state || {}).filter(k => k.endsWith('_j') || k.endsWith('_bj')).length;
    console.log(uid, u.profile?.email || '(이메일 없음)', 'state ' + stateCount + '개', '마지막 ' + (u.profile?.lastActive || '미접속'));
  });
});
```

### 특정 사용자의 플랜 + state 조회
```js
db.ref('users/USER_UID_HERE').once('value').then(s=>{
  console.log(s.val());
});
```

### 오늘 접속한 사용자만
```js
var today = new Date().toISOString().slice(0,10);
db.ref('users').once('value').then(s=>{
  var users = s.val() || {};
  var todayUsers = Object.entries(users).filter(([uid,u])=>u.profile?.lastActive===today);
  console.log('오늘 접속:', todayUsers.length + '명');
  todayUsers.forEach(([uid,u])=>console.log('  -', u.profile?.email || uid));
});
```

---

## 🗑 위험한 작업 (확인 후 실행)

### 특정 사용자 데이터 완전 삭제
```js
// 매우 위험! 사용자 본인이 직접 못 지운 경우만
var uid = 'USER_UID_HERE';
if(confirm('정말 ' + uid + ' 데이터를 삭제하시겠습니까?')){
  db.ref('users/' + uid).remove().then(()=>console.log('✅ 삭제 완료'));
}
```

### 모든 사용자의 특정 노드 일괄 삭제 (예: 마이그레이션 플래그 리셋)
```js
// 모든 사용자의 misc.migration_v4_done 삭제
db.ref('users').once('value').then(s=>{
  var users = s.val() || {};
  var updates = {};
  Object.keys(users).forEach(uid => {
    updates['users/' + uid + '/misc/migration_v4_done'] = null;
  });
  if(confirm('정말 모든 사용자의 마이그레이션 플래그를 리셋하시겠습니까?')){
    return db.ref().update(updates);
  }
}).then(()=>console.log('✅ 일괄 리셋 완료'));
```

---

## 📦 백업 / 복원

### 전체 문제 데이터 백업 (JSON 다운로드)
```js
db.ref('questions/management').once('value').then(s=>{
  var data = s.val();
  var blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'management_questions_backup_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  console.log('✅ 백업 다운로드 완료');
});
```

### 백업 파일 업로드 → Firebase 복원
```js
// 1. 콘솔에서 파일 input 만들기
var input = document.createElement('input');
input.type = 'file'; input.accept = '.json';
input.onchange = e => {
  var f = e.target.files[0];
  var reader = new FileReader();
  reader.onload = ev => {
    var data = JSON.parse(ev.target.result);
    if(confirm('정말 questions/management를 이 백업으로 덮어쓰시겠습니까?')){
      db.ref('questions/management').set(data).then(()=>console.log('✅ 복원 완료'));
    }
  };
  reader.readAsText(f);
};
input.click();
```

---

## 💡 사용 팁

1. **admin.html을 항상 켜두기**: 콘솔 스크립트는 admin.html이 로그인된 탭에서만 작동 (db / auth 변수 활용)
2. **읽기 전에 확인**: 수정 전 `.once('value')`로 현재 값 먼저 확인
3. **백업 먼저**: 큰 변경 전엔 위 "전체 문제 데이터 백업" 실행
4. **에러 처리**: 모든 `.then()` 뒤에 `.catch(e=>console.error('❌', e))` 추가 권장
5. **보안 규칙**: 관리자 UID(`LvVdz8pZmcO6Qb2YPUjnkUYZLBL2`)로 로그인 안 했으면 write 차단됨

---

**작성자**: Claude Opus 4.7
**작성일**: 2026-05-13
