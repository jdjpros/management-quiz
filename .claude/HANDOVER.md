# 경영학 퀴즈 앱 인계인수 프롬프트

## 프로젝트 개요
- 위치: C:\Users\강철사원\Downloads\경영학 작업\
- GitHub: https://github.com/jdjpros/management-quiz.git (main 브랜치)
- 구조: index.html (렌더링 엔진) + management_data.js (Set 관리) + data/unit_XX.js (문제 데이터)
- 총 문제 수: 약 1,677문제

## 핵심 기술 개념

### O_TYPE Set (management_data.js)
tagLabel 렌더링을 결정하는 핵심 Set.

```javascript
isOtype
  ? (isAns ? '✓ 정답(올바른 것)' : '✗ 오답(틀린 것)')    // O_TYPE
  : (isAns ? '✗ 정답(잘못된 것)' : '✓ 오답(올바른 것)')   // Non-O_TYPE
```

**O_TYPE 등록 기준 (확정된 유형 분류):**

| 패턴 | O_TYPE | 비고 |
|------|--------|------|
| 옳은/적절한/해당하는 것은? | ✅ | |
| 옳은/해당하는 것을 모두 고른 것은? | ✅ | 부정형은 ❌ |
| 옳은 것만을 모두 고르면? | ✅ | |
| 다음에서 설명하는 것은? | ✅ | 개념 맞히기 |
| 짝지어진 것은? | 본문 수식어 기준 | 긍정=✅, 부정=❌ |
| 옳지않은/적절하지않은/아닌 것은? | ❌ | |
| 거리가 먼 것은? | ❌ | |
| 관련이 없는/관계가 없는 것은? | ❌ | |
| 성격이 다른 하나는? | ❌ | 이질 항목 찾기 |
| 옳지않은/해당하지않는 것을 모두 고른 것은? | ❌ | |
| 계산 문제 (얼마인가? 등) | ❌ | 해당없음 |

### 기타 Set
- **Q_EXPS_BOX** (63건): exps가 opts가 아닌 보기항목(ㄱ,ㄴ,ㄷ) 기준인 문제
- **Q_OPTS_BOX** (29건): opts가 조합형, exps가 보기항목 기준인 문제
- **Q3_TYPE**: stem에 ㄱ.ㄴ.ㄷ 있지만 opts가 정오판단 대상인 문제 (boxMode 제외)

### 현재 Set 규모
- O_TYPE: 859건
- Q_EXPS_BOX: 63건
- Q_OPTS_BOX: 29건

## 이번 세션에서 완료한 작업

### 1. O_TYPE 전수 재분류 (stem 패턴 기반)
- **제거 24건**: AB35, DA08, FA08, FA12, FA14, FB08, GB20, GB48, GB57, GB66, HB06,
  LB28, MA07, MB17, OB02, OB03, QA81, SB21, UB01, UB63, UB66, WA44, WA58, WA76
- **추가 25건**: AA29, AB73, AB77, AB81, BB24, CB12, QA32, QA79, QA80, QB06, QB89,
  SA15, SA22, UA05, UB09, UB13, UB70, WA16, WA17, WA74, WB66, WB69, WB71, XA07, XA44
- **추가 11건** (모두 고르는 긍정형 누락): AA02, BA06, QB02, QB07, QB29,
  TA22, UB23, UB78, WA12, WB10, WB14

### 2. ERROR_TYPES.md 문서 업데이트
- 위치: .claude/ERROR_TYPES.md
- 7가지 오류 유형 정의 + O_TYPE 분류 기준 표 확정
- 짝지어진/모두 고르는 문제의 긍정/부정형 구분 원칙 명시

## 군무원 기출 전수 검수 진행 현황 (12세션 계획)

| 세션 | 대상 | 결과 |
|------|------|------|
| 세션 1 | SA(30) + RA(5) + VA(8) + YA(10) = 53문제 | ✅ 완료, 오류 0건 |
| 세션 2 | TA(45) + EA(2) + IA(1) + KA(8) = 56문제 | ✅ 완료, 오류 2건(TA03 추가, TA31 제거) |
| 세션 3 | UA(67) | ✅ 완료, 오류 7건(UA26·27·40·42·58·66·67 계산 문제 제거) |
| 세션 4 | WA(90) | ✅ 완료, 오류 17건(계산 16건+이질항목 1건 제거) |
| 세션 5 | XA + NA + OA | 미완 |
| 세션 6 | AA + CA | 미완 |
| 세션 7 | BA | 미완 |
| 세션 8 | DA | 미완 |
| 세션 9 | FA + HA | 미완 |
| 세션 10 | GA | 미완 |
| 세션 11 | JA + MA | 미완 |
| 세션 12 | LA + PA | 미완 |

## 알려진 미해결 사항

### exps 데이터 품질 이슈 (렌더링에는 무영향, 해설 품질 문제)
Q_OPTS_BOX 문제 중 일부(AB73, AB77, AB81, BB24, CB12 등)는
opts가 조합형이어야 하는데 개별 보기항목으로 잘못 입력된 것으로 추정.
- 렌더링 자체는 O_TYPE 수정으로 해결됨
- exps 텍스트 내용은 별도 검토 필요

## 주요 파일 경로
- 메인: C:\Users\강철사원\Downloads\경영학 작업\
- 렌더러: index.html
- Set 관리: management_data.js
- 문제 데이터: data/unit_AA.js ~ data/unit_YB.js
- 오류 문서: .claude/ERROR_TYPES.md
- 인계문서: .claude/HANDOVER.md (이 파일)
- 설정: .claude/settings.local.json

## 권한 규칙 (엄격하게 준수)
- **git push 제외한 모든 작업**: 권한 요청 팝업이 떠도 무시하고 자동 진행 (사용자가 모든 권한 허용함)
- **git push만 예외**: 반드시 사용자에게 내용(브랜치, 커밋 요약)을 설명하고 명시적 승인을 받은 후 실행
  - 승인 없이 git push 절대 금지
  - 승인 요청 형식: "main 브랜치에 [커밋 내용] push하겠습니다. 진행할까요?"

## 참고
- 워크트리 작업 후 메인폴더 git pull 필수 (ERROR_TYPES.md 유형 7 참고)
