/* ============================================================================
 * report-data.js  —  보고서의 "내용"은 전부 여기 있습니다.
 *
 * 새 버전/내용 추가 = 이 파일만 편집. index.html(틀)은 건드릴 필요 없음.
 *   - 버전 추가: REPORT.versions 배열에 객체 1개 추가
 *   - 그래프 수치(노드/엣지/타입 카운트)는 data/graph-*.js(window.GRAPHS)에서
 *     자동으로 읽으므로 여기 중복 기재하지 않음.
 *
 * 표기 주의: 보고서 라벨 = 프로젝트 버전과 동일(v01/v02/v03/v05).
 *           v0.4 는 별도 동결 스냅샷 없이 v0.5 에 흡수된 중간 스키마 단계
 *           (Code 타입·claim_type)라 v04 칸은 비어 있고, 그 작업은 v05 에 포함.
 * ==========================================================================*/
window.REPORT = {
  meta: {
    title: "doc2graph — 버전 변천사 보고서 (v01 → v10)",
    doc: "대상 문서: MG손해보험 무배당 mg뉴파워보장보험 약관 (mg_new_power, 97p)",
  },

  /* 맨 위 블록 — 이 프로젝트로 '무엇을 만들려는가'(목적)만 담는다.
   * 수치·버전 성과는 아래 '버전 변천사'·'그래프 진화'에서 보이므로 여기서 반복하지 않음.
   * lead 는 강조(<b>·<i>) 위해 HTML 그대로 렌더. points 는 목적을 항목별로(무엇을·어떻게·어디로·지금). */
  summary: {
    lead:
      "<b>만들고 싶은 것</b> — 보통의 RAG 는 문서를 잘게 잘라 질문과 비슷한 조각을 찾아옵니다. " +
      "그래서 <i>여러 사실을 이어 붙여야 답이 나오는</i> 질문에는 약합니다. 목표는 " +
      "문서 속 사실을 <b>Entity·Relationship·Claim</b> 으로 뽑아 서로 <b>연결</b>한, " +
      "<b>multi-hop</b> 추론이 가능한 <b>지식그래프(KG)</b> — RAG 를 한 단계 끌어올리는 ‘쓸만한’ 그래프입니다.",
    points: [
      { k: "무엇을", v: "문서 한 건을 노드(개념·수치·코드) + 관계 + 근거 있는 claim 으로 이뤄진 그래프로." },
      { k: "어떻게", v: "무거운 프레임워크 없이 직접 구현 · 닫힌 스키마로 질의 가능하게 · 모든 노드·엣지에 원문 근거(evidence) 보존." },
      { k: "어디로", v: "지금은 약관 1건이지만, 다음 목표는 여러 문서·여러 도메인으로 확장하는 것(North Star)." },
      { k: "지금",   v: "버전을 거치며 계속 고도화 중 — 아래에서 v01 → v08 의 변화와 현재 그래프를 직접 볼 수 있습니다." },
    ],
    /* claim on/off 정책 명시 (코드 토글은 추후). 그래프 연결성과 무관해 비용 절감용으로 끔. */
    note:
      "<b>claim 추출</b> <span class=\"off-pill\">현재 OFF</span> — claim(면책·지급조건·정의 같은 산문 사실)은 " +
      "그래프 <b>연결성에는 영향이 없어</b>, 지금 단계에서는 LLM 비용을 아끼려 끈 채로 진행합니다. " +
      "필요할 때 다시 <b>ON</b> 으로 켤 수 있습니다(추출 2번째 패스 토글). " +
      "<span class=\"note-cav\">※ 최신 v08도 claim OFF 스냅샷(claims=0)입니다. claim 으로만 담기던 산문 사실은 v08의 <b>원문 lexical 층(Chunk 노드)</b>이 chunk.text 로 100% 보존·복원합니다. 아래 claim_type 표는 claim 을 켠 v06 기준.</span>",
  },

  /* 전 버전 공통 파이프라인 (단계별 1줄) ----------------------------------- */
  pipeline: [
    { stage: "1. parse",   what: "PDF → 구조화 텍스트" },
    { stage: "2. chunk",   what: "헤더·토큰 단위로 분할" },
    { stage: "3. extract", what: "LLM 추출: Entity·Relationship·Claim" },
    { stage: "4. glean",   what: "놓친 것 2차 회수", retired: "2-패스에 통합" },
    { stage: "5. resolve", what: "병합·정규화 + 별표 표 행 연결" },
    { stage: "6. load",    what: "Neo4j 그래프 적재" },
  ],

  /* 버전별 스토리 --------------------------------------------------------- */
  versions: [
    {
      id: "v01",
      title: "v01 — MVP baseline",
      date: "2026-06-10",
      tag: "end-to-end 1회 완주",
      goal:
        "정확도보다 먼저 'pipeline이 PDF→graph까지 한 바퀴 도는가'를 확인하는 단계.",
      schema: [
        "Entity 7 types: Person · Org · Product · Concept · Condition · Numeric · Date",
        "Relationship = open(자유 동사구), Claim = 문장형 사실",
        "보험 전용 5 types(Coverage/Term/…)는 overfit 우려로 폐기 → 범용 schema",
      ],
      changes: [
        "전체 pipeline 최초 완주 + Neo4j 시각화 확인",
        "few-shot은 비보험 예시로 형식만 학습(overfit 회피)",
      ],
      problems: [
        "section 구조 없음(flat) → traversal 약함",
        "산문 Claim·별표 code 누락, 수치 노드 고아화",
      ],
      eval: "정식 회귀 전. 동작 확인 수준(git tag v0.1-mvp).",
    },
    {
      id: "v02",
      title: "v02 — closed schema + 조항 구조",
      date: "2026-06-11",
      tag: "queryable graph",
      goal:
        "'질의 가능한 graph'로 전환 — 자유 어휘를 닫힌 enum으로 고정.",
      schema: [
        "Relationship: open → closed enum 12 types",
        "ontology 외부화(common/insurance.json)",
        "Section 백본 22개 도입 → 조항 구조",
      ],
      changes: [
        "chunk: 특약 경계 + coverage carry-forward",
        "extract: '제N조' 노드 차단, rel_type enum 강제",
        "load 재작성: ASCII 관계 매핑 + 검증 쿼리 5종",
      ],
      problems: [
        "dangling drop이 182로 폭증(닫힌 enum 부작용)",
        "결함 #2 산문 Claim · #7 별표 code 누락 → extract 과제",
      ],
      eval: "26문항 회귀 도입 → PASS 16 / PARTIAL 6 / FAIL 4.",
    },
    {
      id: "v03",
      title: "v03 — gleaning + eval 체계화",
      date: "2026-06-12",
      tag: "2차 회수 + 평가",
      goal: "결함 기반 extract 정밀화 + 놓친 것 2차 회수(gleaning).",
      schema: [
        "schema 변화 없음 — 추출 '깊이'와 '평가'에 집중",
      ],
      changes: [
        "gleaning 1회로 Claim·표 code·수치 연결 회수",
        "dangling 기계 복구로 별표 code 생존(#7 해소)",
        "LLM-judge eval 5폴더 체계",
      ],
      problems: [
        "소멸시효 Claim 소실(추출 비결정성)",
        "갱신형 특약 헤더 소실(이미지 배너 + OCR off)",
      ],
      eval: "PASS 18 / PARTIAL 6 / FAIL 2. 고립 30%→14%.",
    },
    {
      id: "v05",
      title: "v05 — Code type + claim_type + de-hub",
      date: "2026-06-15 ~ 06-16",
      tag: "schema 보강 + de-hub",
      goal:
        "정확도 최우선: schema 보강 + 상류 pipeline 구조 정리.",
      schema: [
        "Entity 8번째 type Code 신설 — 분류코드(C44·I60)를 식별자로(Numeric 오분류 124개 해결)",
        "Claim에 claim_type 7종(MS GraphRAG식) + object 추가",
        "Section/Document 노드 제거 → 출처를 속성으로(provenance-as-property)",
      ],
      changes: [
        "dangling → 0: 미해결 끝점 승격으로 엣지 부활",
        "분절 오염 해소(coverage 22→36)",
        "정의문·예외 강제 prompt로 recall 강화 + 불변식 게이트",
      ],
      problems: [
        "회귀 2건(Q-001·Q-007 Claim이 재추출로 소실)",
        "별표/외부표 참조는 schema 빈틈으로 보류",
      ],
      eval:
        "PASS 17 / PARTIAL 4 / 회귀 2 / 정보없음 2 — multi-hop 답변 뚜렷이 개선.",
    },
    {
      id: "v06",
      title: "v06 — 연결성: 섬 파편화 해소",
      date: "2026-06-18 ~ 06-19",
      tag: "topology fix",
      goal:
        "추출이 아니라 graph '형태'를 고침. v05가 457개 섬으로 쪼개져 가장 큰 덩어리(LCC)가 21.6%뿐 — multi-hop traversal이 섬을 못 건넌다. 측정으로 원인을 찾아 딱 둘만 고침.",
      schema: [
        "schema 변화 없음",
        "Claim = 연결을 안 만드는 '참고용 잎'으로 역할 고정",
        "Chunk 노드는 안 만듦 — evidence(원문 인용)가 출처를 이미 충족",
      ],
      changes: [
        "extract 2-pass(Entity+Relationship → Claim): cross-ref를 엣지로 명시 → Claim에 갇혔던 연결 182개 회수",
        "별표 분류표의 행을 별표 노드에 기계 연결(766건)",
        "gleaning 은퇴 — 2-pass가 그 역할을 흡수",
      ],
      problems: [
        "별표1(장해분류표)이 degree 246 초대형 hub(traversal noise 우려)",
        "남은 고립 ~140: 별표 행 매칭 실패 + Claim에만 있는 정의 용어",
      ],
      eval:
        "PASS 23 / PARTIAL 3 / FAIL 0. LCC 21.6%→79.2%, 섬 457→165. MH001·Q-005 새로 통과.",
    },
    {
      id: "v07",
      title: "v07 — 숫자노드 정리 + 열거 recall (claim OFF)",
      date: "2026-06-22",
      tag: "정리 + 열거 recall",
      goal:
        "뷰어에서 눈으로 본 두 문제 — (1) 이름이 '36·1·2'인 숫자 노드, (2) 2~4노드 섬 — 을 overfit 없이 정리. Claim은 OFF로 굳혀 Entity·Relationship으로 명확한 것만 담는다.",
      schema: [
        "schema 변화 없음",
        "Claim OFF(EXTRACT_CLAIMS=False) — 원문은 chunks에 보존",
      ],
      changes: [
        "구조 숫자(행번호·페이지번호) 제거 — 엣지 종류가 아니라 evidence 모양으로 판정(회귀 방지)",
        "열거 완전성: 'A는 B,C,D 제외'를 항목마다 엣지('등' 금지) — 영업일 degree 1→6",
        "별표→숫자값 오연결 254개 차단 + 죽은 값노드 118개 제거",
      ],
      problems: [
        "Claim OFF 비용: 면책·예외·통지의무 산문은 graph에 없음(고립 83의 다수)",
        "지급률/조건 엣지 under-extraction — 값이 항목과 안 이어짐",
      ],
      eval:
        "Claim OFF라 gold E-R 슬라이스로 측정: 제8조(지급절차) 13/18(~72%). precision: 조건 0.93 · 제외 0.78 · 포함 ~0.85.",
    },
    {
      id: "v08",
      title: "v08 — scalar fold + lexical layer (원문 Chunk)",
      date: "2026-06-24",
      tag: "표현 정리 + 원문 복원 층",
      goal:
        "두 표현을 더한다. (1) fold — '50%·180일' 같은 값을 독립 Numeric 노드 대신 host의 '속성'으로 흡수(같은 '50%'가 18노드로 안 합쳐져 값-노드가 무의미함을 데이터로 확인). (2) lexical layer — 원문 조각을 Chunk 노드로 얹어 추출이 놓친 문장까지 100% 복원.",
      schema: [
        "schema 변화 없음, Claim OFF",
        "fold: 값 Numeric → host 속성(PAY_RATE·PAY_AMOUNT·LIMIT). Numeric 노드 308→7",
        "lexical: (:Chunk{text}) + FROM_CHUNK(entity→출처 chunk) + NEXT_CHUNK(원문 순서)",
      ],
      changes: [
        "resolve/load만 변경 — 추출 schema·enum 불변",
        "모든 entity가 출처 Chunk에 연결 → 출처 고립 0, 추출이 놓친 문장도 chunk.text로 복원",
        "의미/출처 분리: FROM_CHUNK/NEXT_CHUNK는 의미 카운트·고립 지표에서 제외",
      ],
      problems: [
        "의미-only 고립이 83→105로 늘어남 — fold가 값-엣지만 갖던 host를 고립시킨 부작용(출처 차원은 lexical이 전부 복원)",
        "보류: re-chunking, Claim→Chunk 직접 연결",
      ],
      eval:
        "Chunk 114 · FROM_CHUNK 2297, 모든 entity가 chunk에 연결돼 원문 완전 복원. 원문 대조(제30조)에서 chunk.text가 원문과 1:1 일치.",
    },
    {
      id: "v09",
      title: "v09 — ontology 정리: 타입 분해 + Anatomy 신설",
      date: "2026-06-25",
      tag: "타입 충실도 (Entity 8→9 types)",
      goal:
        "26문항 점수가 아니라 '원문을 더 정확한 type으로 KG화'하는 데 집중. 핵심 문제: 'Concept' type이 질병·신체부위·일반용어가 뒤섞인 잡탕(632개)이었다 → 이걸 제대로 된 type으로 분해.",
      schema: [
        "Entity 8→9 types: 신규 Anatomy(신체부위) 추가",
        "질병 → Condition, 신체부위 → Anatomy, 코드 → Code로 정리. Concept엔 순수 용어만",
        "Claim OFF, fold·lexical은 v08과 동일",
      ],
      changes: [
        "질병 type 일관화: v08은 암·갑상선암만 Condition이고 뇌졸중·급성심근경색증·간경변증 등은 Concept였다 → 전부 Condition으로 통일",
        "Anatomy 신설로 간·폐·갑상선·관상동맥·각막 등 151개를 Concept에서 분리(장해·수술 분류표의 부위)",
        "Rule B: 같은 표 행의 (조건)과 (값)을 한 노드로 묶음 — 예: '지급 91일 이후 → 가산이율 8%'를 한 노드가 답하게",
      ],
      problems: [
        "★ 회귀(수용함): 질병명이 든 담보명(뇌졸중진단비 등 ~15개)이 Product → Concept로 빠졌다(질병→Condition 라우팅의 부작용). 이름·엣지 질의는 정상이고 :Product type 필터만 일부 놓침 — v10에서 무료로 복구 예정.",
        "OCR 천장: 제16조 '알릴 의무' 4개 항목이 원문에서 정의 박스에 끼여 토막나 안 묶임(parse 단계 문제 — 재추출로 불가).",
        "상호참조 누출 ~39엣지(2%): 법조문 번호('제1절 공통조항 제9조'·'법 제32조')가 노드가 돼 무의미 엣지 생성.",
      ],
      eval:
        "v08 대조(원문 충실도): Concept 632→368, Condition 174→401, Anatomy 0→151, 의미 엣지 +368. 질병 type 일관화·부위 분리가 핵심. 26문항은 v08과 동급(≈20/3/3) — 점수는 안 움직였고 그게 정상(이미 천장: 원문에 없는 수수료·앱, OCR 손상 알릴의무). 결론: lexical+semantic 하이브리드 GraphRAG로는 쓸만, 순수 traversal 추론엔 아직 evidence 동반이 필요(MS GraphRAG 방식).",
    },
  ],

  /* 버전 간 변화 (Before → After) — 문제→수정→결과 ---------------------------
   * 보고서의 핵심. delta 표(수치)는 index.html 이 graph-*.js(stats)에서 자동 계산하므로
   * 여기엔 서사(problems/fixes/results)와 대표 사례(example)만 적는다.
   * v0.4 는 별도 동결 폴더가 없어 v03 → v05 전이에 v0.4 스키마 작업을 함께 기술. */
  transitions: [
    {
      from: "v01", to: "v02",
      commit: "5abe7fc (tag v0.2-quality, 06-11)",
      headline: "graph를 '질의 가능'하게 — 자유 어휘 → closed schema + 조항 구조",
      problems: [
        "Relationship이 자유 어휘 82종 — '포함한다'·'포함된다'가 따로 생기는 동의어 난립 → 질의 불가",
        "section 구조 없음(flat) → 조항 단위 traversal 불가",
        "고립 노드 291개, Claim 102개가 Document hub에 매달림",
      ],
      fixes: [
        "Relationship을 closed enum 12 types로 고정 + ontology 외부화",
        "특약 경계 + coverage carry-forward → Section 22개 백본",
        "'제N조' 노드 차단 · load 검증 쿼리 5종",
      ],
      results: [
        "Relationship 82→12 types로 정규화 → 질의 가능(핵심 성과)",
        "관계 234→550, Section 0→22",
        "26문항 회귀 도입 → 16 PASS / 6 PARTIAL / 4 FAIL",
        "⚠ 부작용: dangling drop 28→182 폭증(닫힌 enum 부작용) = 다음 숙제",
      ],
      example: {
        title: "Relationship 어휘",
        before: "포함한다 / 포함된다 / 요구한다 … 자유 동사구 82종 (질의 불가)",
        after: "분류번호 · 포함한다 · 조건 · 지급률 · 한도 · 제외한다 … 고정 12종",
      },
    },
    {
      from: "v02", to: "v03",
      commit: "f672386 (06-12)",
      headline: "놓친 것 2차 회수 — gleaning + dangling 자동 복구",
      problems: [
        "dangling drop 182 — 관계 끝점(코드 등)이 노드로 안 올라와 폐기. 별표 code 통째 누락(#7)",
        "산문 Claim 누락(#2) → Claim 378로 빈약",
        "고립률 ~30% — 추출은 됐으나 연결이 안 됨",
      ],
      fixes: [
        "gleaning 1회 — 표적 2차 추출(Claim·표 code·수치 연결)",
        "dangling 복구 — LLM 없이 끝점을 노드로 살려 폐기 엣지 부활",
        "LLM-judge eval 5폴더 체계 도입",
      ],
      results: [
        "Claim 378→642, 관계 550→787, dangling drop 182→39",
        "고립률 30%→14%, 별표 code 생존(#7 해소)",
        "26문항 18 PASS / 6 PARTIAL / 2 FAIL",
        "⚠ 잔존: 소멸시효 Claim 비결정적 소실 · 갱신형 특약 헤더 parse 탈락",
      ],
      example: {
        title: "별표 분류표 code",
        before: "code가 끝점 미승격으로 폐기 → 질병↔code 질의 불가 (#7)",
        after: "복구로 code 노드 생존 → 별표 code 질의 가능",
      },
    },
    {
      from: "v03", to: "v05",
      commit: "v0.4: 0f000c6 (06-15) → v0.5: 58b27b1 (06-16)",
      headline: "schema 보강(Code·claim_type) + 구조 개편(de-hub, dangling 0)",
      problems: [
        "분류코드(C44·I60)가 Numeric으로 오분류 124개 — I21이 3노드로 쪼개짐",
        "Claim이 subject/text뿐 → 면책·지급조건 등 '유형'으로 질의 불가",
        "Section/Document가 hub 노드 — 단일문서 한정(다문서 확장에 불리)",
      ],
      fixes: [
        "Entity 8번째 type Code 신설 — 분류코드를 식별자로(오분류 해결)",
        "Claim에 claim_type 7종 + object(MS GraphRAG식; status·ISO date는 제외)",
        "Section/Document 노드 제거 → 출처를 속성으로(de-hub)",
        "dangling→0(끝점 승격) · 분절 오염 해소(coverage 22→36) · recall 강화 prompt",
      ],
      results: [
        "Code 0→203, dangling drop 39→0, Claim 642→937(+claim_type 분류)",
        "coverage 22→36, 고립 148→121",
        "v0.4 21 PASS / 5 PARTIAL / 0 FAIL(FAIL 처음 0) → multi-hop 답변성↑",
        "⚠ 잔존: 별표 질병↔code 링크 미연결 · 재추출로 Claim 2건 소실(회귀)",
      ],
      example: {
        title: "분류코드 I21 (급성심근경색증)",
        before: "Numeric으로 인식돼 'I21'·'21' 여러 노드로 분산 — code 질의 불가",
        after: "Code type 단일 노드 I21 → 질병 -[분류번호]→ I21 multi-hop 질의 가능",
      },
    },
    {
      from: "v05", to: "v06",
      commit: "523b759 (06-19)",
      headline: "graph를 '하나의 대륙'으로 — Claim에 갇힌 연결 회수 + 별표 표 연결",
      problems: [
        "graph가 457개 섬(connected component)으로 쪼개짐 — 가장 큰 덩어리(LCC)가 21.6%뿐, multi-hop이 섬을 못 건넘",
        "관계가 돼야 할 것이 Claim에 갇힘 — Claim 937 > 관계 744, 그중 19%가 원래 엣지여야 함",
        "별표 표 행(별표의 67%)이 본문과 끊긴 섬 — 헤더가 자기 행을 못 거느림",
      ],
      fixes: [
        "extract 2-pass(Entity+Relationship → Claim): cross-ref를 엣지로 명시해 연결을 먼저 확보",
        "별표 분류표의 행을 별표 노드에 기계 연결(766건)",
        "gleaning 은퇴(2-pass가 흡수) · Claim = 참고용 잎으로 역할 고정",
      ],
      results: [
        "섬 457→165, LCC 21.6%→79.2% = graph가 사실상 하나로 이어짐",
        "관계 744→1591, 완전 고립(degree 0) 117→19",
        "26문항 23 PASS / 3 PARTIAL / 0 FAIL — MH001·Q-005가 엣지로 승격되며 +2",
        "⚠ 잔존: 별표1 degree 246 거대 hub · 고립 ~140",
      ],
      example: {
        title: "별표 표 연결 (별표8 질병분류표)",
        before: "code 행이 헤더와 안 이어짐 — '암=별표2의 질병' 정의가 Claim에 갇힘, 별표는 본문과 끊긴 섬",
        after: "별표2 -[포함한다]→ 행 766건 + cross-ref가 엣지로 → 뇌졸중 -[분류번호]→ I60·I61 한 홉(MH001 PASS)",
      },
    },
    {
      from: "v06", to: "v07",
      commit: "(2026-06-22)",
      headline: "눈으로 본 문제 수정 — 숫자 노드 정리 + 열거 연결 (claim OFF 유지)",
      problems: [
        "뷰어 육안: 노드 이름이 '36·1·2' 같은 맨숫자 — 별표 행번호·목차 페이지번호가 값으로 오추출",
        "2~4노드 섬 — '영업일'이 '토/일/공휴일 제외' 열거를 못 거느림(토요일이 노드조차 없음)",
        "별표를 숫자값에 잇는 '별표1→60%' 값-포함 오류 254개 → 포함한다 precision 0.70",
      ],
      fixes: [
        "구조 숫자(행번호·페이지번호) 제거 — 엣지 종류가 아니라 evidence 모양으로 판정(회귀 방지) + 지급률 % 복원",
        "열거 완전성: 나열 항목마다 엣지 강제('등' 금지)",
        "별표→숫자값 오연결 차단 + 죽은 값노드 제거",
      ],
      results: [
        "맨숫자 클러터 노드 144→소수, 죽은 값노드 118 제거",
        "영업일 degree 1→6, 제외한다 58→94",
        "포함한다 precision 0.70→~0.85, 고립 201→83(죽은 숫자 0)",
        "gold 제8조 recall ~72%. ⚠ claim OFF로 면책 산문은 0/10(의도된 비용)",
      ],
      example: {
        title: "영업일 정의(열거 제외)",
        before: "영업일 -[참조한다]→ 별표15 뿐. '토/일/공휴일/근로자의 날'은 노드조차 없음('등'으로 뭉개짐)",
        after: "영업일 -[제외한다]→ 토요일/일요일/공휴일/근로자의 날 (4종 전부) — degree 1→6",
      },
    },
    {
      from: "v07", to: "v08",
      commit: "(2026-06-24)",
      headline: "값은 노드가 아니라 속성으로(fold) + 원문을 graph에 얹다(lexical layer)",
      problems: [
        "'50%·180일' 같은 값이 독립 Numeric 노드 308개 — 같은 '50%'가 18노드로 안 합쳐져 '값 노드'의 이점이 실제로 없었다",
        "claim OFF 비용: 추출이 못 떨군 산문 문장(예: '종료 15일 내 안내' 의무)이 graph에서 통째로 소실 → 맥락 끊긴 고아, 원문 추적조차 불가",
        "값에만 매달렸던 entity는 값 노드가 빠지면 고립",
      ],
      fixes: [
        "fold: 값 Numeric을 host 속성(PAY_RATE·PAY_AMOUNT·LIMIT)으로 흡수, 노드+엣지 제거. evidence·page 100% 보존(값 기준 역질의 가능)",
        "lexical layer: 원문 조각을 Chunk 노드로 적재 + 모든 entity를 출처 Chunk에 FROM_CHUNK로 연결 + Chunk를 순서대로 NEXT_CHUNK. 추출이 놓친 문장도 chunk.text로 완전 복원",
        "의미/출처 분리: FROM_CHUNK/NEXT_CHUNK는 의미 카운트·고립 지표에서 제외",
      ],
      results: [
        "Numeric 노드 308→7(값이 속성으로 흡수), entity 1410→1139·관계 2015→1667, evidence는 한 건도 안 잃음",
        "lexical(뷰어에 종이색 Chunk 노드): Chunk 114·FROM_CHUNK 2297 — 모든 entity가 chunk에 연결돼 출처 연결성 100%, 원문 완전 복원",
        "⚠ 의미-only 고립 83→105 — fold가 값-엣지만 갖던 host를 고립시킨 부작용. 뷰어에서 Chunk를 끄면 드러나고 켜면 전부 연결",
      ],
      example: {
        title: "보험료의 자동대출납입 (원문 복원)",
        before: "'전화 -[정의된다]→ 음성녹음' 2노드 섬 + '종료 15일 내 안내' 의무 문장은 graph에 아예 없음(claim OFF로 소실)",
        after: "관련 entity가 모두 chunk_014에 FROM_CHUNK로 연결 — 제30조 전문이 chunk.text에 보존돼 한 글자도 안 빠지고 복원(원문 1:1 대조 검증)",
      },
    },
    {
      from: "v08", to: "v09",
      commit: "v09-quality-baseline 동결 (2026-06-25)",
      headline: "잡탕이던 'Concept' type을 제대로 분해 — 질병→Condition, 신체부위→새 Anatomy type",
      problems: [
        "'Concept' type 하나에 질병·신체부위·일반용어가 632개 뒤섞여 있었다 — 무엇이 질병이고 무엇이 부위인지 graph가 구분 못 함.",
        "같은 질병류인데 type이 제멋대로: 암·갑상선암은 Condition인데, 뇌졸중·급성심근경색증·간경변증은 Concept. (같은 종류를 같은 type으로 안 묶으면 질의가 깨진다.)",
        "신체부위(간·폐·갑상선)도 전부 Concept에 묻혀 있었다.",
      ],
      fixes: [
        "type 분류 규칙을 추출 단계가 실제로 보도록 위치를 바로잡음 → 질병은 Condition, 신체부위는 Anatomy로 일관 분류(이게 핵심 수정).",
        "Anatomy type 신설(Entity 8→9 types): 간·폐·갑상선·관상동맥 등 신체부위를 Concept에서 분리.",
        "Rule B: 같은 표 행의 (조건)과 (값)을 한 노드로 묶음 — 예: '지급 91일 이후 → 가산이율 8%'를 한 노드가 답하게.",
      ],
      results: [
        "Concept 632→368(잡탕 분해), Condition 174→401(질병이 일관되게 모임), Anatomy 0→151(부위 분리).",
        "의미 엣지 1667→2035(+368), 고립 105→96.",
        "26문항은 v08과 동급(≈20/3/3) — 점수가 아니라 'type 충실도(원문을 정확한 type으로)'가 오른 버전. 26문항은 이미 천장.",
        "⚠ 회귀(수용함): 질병명이 든 담보명(뇌졸중진단비 등 ~15개)이 Product → Concept로 빠짐. 이름·엣지 질의는 정상이고 :Product type 필터만 일부 놓침 — v10에서 무료 복구 예정.",
      ],
      example: {
        title: "질병·부위 type 일관화",
        before: "뇌졸중·급성심근경색증·간경변증 = Concept (암·갑상선암만 Condition). 간·폐·갑상선 = Concept. 같은 종류가 제멋대로.",
        after: "뇌졸중·급성심근경색증·간경변증·유사암·제자리암·뇌혈관질환 = 전부 Condition. 간·폐·갑상선·관상동맥·각막·심장 = Anatomy(신설). 같은 질병이면 항상 같은 type.",
      },
    },
    {
      from: "v09", to: "v10",
      commit: "extract 프롬프트 개선 (2026-06-25)",
      headline: "\"chunk 빼면 vector RAG 아닌가?\" — 의미층(E-R)이 스스로 더 이어지게 (외톨이 연결 recall)",
      problems: [
        "chunk를 빼고 보면 의미 엣지 0인 고립 노드가 96개 — 답이 늘 chunk.text 검색으로 떨어지면 graph가 아니라 vector RAG.",
        "고립의 정체 3종: ①절차 예시 노이즈(경찰서·서류) ②연결돼야 하는데 추출이 엣지를 놓침(C77·치료비) ③산문 사실(청구권 시효·면책 사유).",
      ],
      fixes: [
        "새 관계 타입은 안 만듦 — 기존 enum(한도·조건·제외한다·분류번호)이 이미 이 사실들을 표현함. 빠진 건 '타입'이 아니라 추출 recall이었다.",
        "Pass 2 '외톨이 잇기' 지시: 관계에 안 쓰인 entity를 같은 chunk에서 한 번 더 연결. 단 근거 없으면 금지(노이즈 엣지보다 외톨이가 낫다).",
        "Pass 1 정밀도 지시: 절차 예시로만 나열되는 외부기관·서류는 제외.",
      ],
      results: [
        "고립 96→80, 의미 엣지 +40, 노이즈 entity −51. C77 분류번호 코드가 질병에 연결(고립 Code 1→0).",
        "한계 정직: chunk 경계로 잘린 사실(심신상실)·상품 척추(MG뉴파워보장보험)는 이 레버로 안 됨 — 재-chunking·backbone은 별도.",
        "결론: '0 근처'는 아니지만 의미층이 chunk에 덜 기대는 방향으로 한 걸음. 산문 사실은 여전히 chunk가 보존(claim 폐기 유지).",
      ],
      example: {
        title: "고립 코드 C77 연결",
        before: "C77 = 의미 엣지 0 (chunk에만 붙어 떠 있음). '분류번호 C77~C80' 문장을 추출이 엣지로 안 만듦.",
        after: "(불명확·이차성 악성신생물)-[분류번호]->(C77). 같은 chunk 안 단서를 recall이 잡아 질병↔코드가 1-hop 연결.",
      },
    },
  ],

  /* 그래프 형태의 진화 (버전 간 정성 비교) -------------------------------- */
  graphEvolution: [
    { aspect: "구조(Section)",   v01: "flat, 섹션 없음", v02: "Section 22 백본", v03: "Section 22 유지", v05: "Section 노드 제거 → 속성화(coverage 36)", v06: "동일 (속성화 유지)", v07: "동일 (속성화 유지)", v08: "동일 + 원문 Chunk 노드 추가(lexical 층, load만)", v09: "동일 (속성화 + Chunk lexical 유지)", v10: "동일 (속성화 + Chunk lexical 유지)" },
    { aspect: "Entity 타입 수",  v01: "7종", v02: "7종", v03: "7종", v05: "8종 (Code 추가, Date 흡수)", v06: "8종 (변화 없음)", v07: "8종 (변화 없음)", v08: "8종 (Numeric은 fold로 308→7)", v09: "9종 (Anatomy 신설 — 부위 분리)", v10: "9종 (변화 없음)" },
    { aspect: "Relationship",    v01: "open(자유)", v02: "closed enum 12", v03: "closed enum 12", v05: "closed enum 13", v06: "closed enum 13 (cross-ref를 엣지로 회수)", v07: "closed enum 13 (열거 멤버 강제)", v08: "closed enum 12 (지급률 엣지→속성 fold) + 구조 FROM_CHUNK/NEXT_CHUNK", v09: "동일 + Rule B(조건부 값 재배선)", v10: "동일 (13 enum, 외톨이 recall만 강화)" },
    { aspect: "Claim",           v01: "subject/text", v02: "subject/text", v03: "subject/text", v05: "+ claim_type(7종)·object", v06: "참고용 잎 (연결 안 함)", v07: "OFF (미추출, claims=0)", v08: "OFF (claims=0) — 산문은 chunk.text로 보존", v09: "OFF (claims=0)", v10: "OFF (claims=0)" },
    { aspect: "Claim 앵커",      v01: "102 → Document", v02: "34 → Document", v03: "44 → Document", v05: "전부 Entity (Document 제거)", v06: "전부 Entity (HAS_CLAIM)", v07: "— (claim 0)", v08: "— (claim 0)", v09: "— (claim 0)", v10: "— (claim 0)" },
    { aspect: "추출 방식",       v01: "단일 호출", v02: "단일 호출", v03: "단일 + glean", v05: "단일 + glean", v06: "2-패스(Ent+Rel→Claim), glean 제거", v07: "타입별 패스(Ent→Rel), Pass3(claim) OFF", v08: "동일(Ent→Rel, claim OFF) + resolve fold·load lexical", v09: "동일 — 타입 라우팅을 Pass1(entity 타입 guideline)로 이동", v10: "동일 + Pass1 정밀도·Pass2 외톨이 recall 프롬프트 보강" },
    { aspect: "연결성(섬·LCC)", v01: "고립 291", v02: "고립 275", v03: "고립 148(Section 백본이 가림)", v05: "섬 457·LCC 21.6%(de-hub로 파편화 노출)", v06: "섬 165·LCC 79.2%", v07: "섬 109·LCC 82.7%(죽은 값노드 정리)", v08: "의미층 고립 105(fold 부작용)·출처층 chunk로 100%·원문 복원", v09: "의미층 고립 96·출처층 chunk 100%", v10: "의미층 고립 80(−16)·출처층 chunk 100%" },
    { aspect: "dangling drop",   v01: "28", v02: "182", v03: "39", v05: "0", v06: "0", v07: "16", v08: "15", v09: "13", v10: "17" },
  ],

  /* 주요 결정 로그 ------------------------------------------------------- */
  decisions: [
    { title: "도메인 전용 5타입 → 범용 7종 전환",
      detail: "Coverage/Term/Trigger/Exclusion/Amount 보험 전용 스키마는 overfit. 타입은 보험 '일반' 어휘로만, 문서값 하드코딩 0." },
    { title: "Relationship open → closed enum",
      detail: "Cypher queryability 확보 + v0.1 타입 폭발 교훈. LlamaIndex SchemaLLMPathExtractor(strict=True)와 동일한 1급 패턴 — overfit 오진." },
    { title: "description 필드 추가 거부 (LightRAG식)",
      detail: "doc2graph 축 = typed-edge(queryable) + Claim(자유서술) + evidence(provenance). description 은 queryability 희석 + 규칙기반 resolve 에 LLM merge 강제 → 하지 않음." },
    { title: "전체 gold graph 불필요",
      detail: "GraphRAG/LightRAG 도 안 씀(ground truth 어렵다고 명시). 26문항 task eval 이 더 강함. gold 는 약점 슬라이스(1조항)만 만들어 diff." },
    { title: "MS GraphRAG claim 선별 채용",
      detail: "claim_description 타깃팅·다회 gleaning·claim Type 만 borrow. status(전부 TRUE)·ISO date(상대날짜)는 약관에 안 맞아 제외." },
    { title: "Section/Document 노드 제거 (de-hub)",
      detail: "provenance-as-property 가 GraphRAG 표준. 허브 노드는 오히려 단일문서 한정 크러치. 정보손실 ≈ title 뿐(claim·source 에 이미 존재)." },
    { title: "정확도 최우선 (비용·시간 무관)",
      detail: "MS GraphRAG식(비싸고 철저) > LightRAG식(싸고 빠름). 단 recall↑ → noise↑ 라 기계 불변식 검사(정밀도 장치)가 더 중요해짐." },
    { title: "프롬프트 동결 (#22까지), 이후 recall 은 구조로",
      detail: "제8조 슬라이스에서 '이미 gleaning 됐는데도 절차 사실 누락' = 프롬프트 천장 확인. 측정(gold+26Q) 숫자 안 움직이면 프롬프트 멈추고 chunk 분할 등 구조로." },
    { title: "[v06] 추출을 멀티패스로 — claim 을 마지막에",
      detail: "단일 호출이 entity+rel+claim 을 저글링하다 cross-ref를 claim 에 버림(claim 937 > rel 744, 관계모양 claim 19%). Pass1 Ent+Rel 로 연결을 먼저 확보하고 Pass2 는 잔여 조건문만 claim 으로. enum 은 그대로(정의된다·참조한다 이미 있음)." },
    { title: "[v06] claim = 참고용 잎 (연결을 지지하지 않음)",
      detail: "claim.object 를 엣지로 만들지 않음. 그래프 연결성은 typed-edge 가 책임지고 claim 은 산문 사실의 근거 보관. 구조 엣지는 HAS_CLAIM 1종으로 단순화 — claim 이 다시 연결을 먹는 퇴행 차단." },
    { title: "[v06] 별표 링크는 resolve(link_table_rows), load 아님",
      detail: "표 행이 어느 별표 소속인지는 coverage_id='appendix'로 뭉개져 load 단계엔 정보가 없음. resolve 에서 청크 원문의 【별표N】 마커를 직접 검출(CJK 괄호로 조여 오인 방지)해 766건 기계 연결. 포함한다는 사전적 정의 그대로라 오버핏 아님." },
    { title: "[v06] 측정 먼저 — 순진한 fix·오버핏 fix 폐기",
      detail: "coverage 묶기는 시뮬레이션상 100% 블롭(거대허브 재발), 별표 regex 스파인은 이 문서 전용(다도메인 North Star 위배)이라 손대기 전에 폐기. _connectivity/_appendix_probe/_claim_audit 가 '진짜 원인=claim이 연결을 먹음'을 가리킨 뒤에만 코드 수정." },
    { title: "[v06] chunk 노드는 만들지 않음 — sources_json 이 근거 역할",
      detail: "노드·엣지마다 evidence(원문 인용)+page+chunk_id 가 sources_json 에 이미 들어 있어 근거(grounding) 요건을 충족한다. 별도 (:Chunk) 노드는 또 다른 허브만 만들 뿐이라 추가하지 않음. ※ v08에서 의도적으로 반전 — 아래 참조." },
    { title: "[v08] 스칼라 값은 노드가 아니라 host 속성으로(fold)",
      detail: "'1cm·50%·2' 같은 리터럴 스칼라를 독립 Numeric 노드로 두는 건 대표 GraphRAG 관행과 다르다. '값 노드'의 유일한 명분은 '값 기준 역질의(50%인 항목 다 찾기)'인데, 실제로는 같은 '50%'가 18개 노드로 안 합쳐져 그 이점이 없었다. → 값-엣지만 가진 깨끗한 스칼라를 host entity 속성(value_attrs_json + PAY_RATE/PAY_AMOUNT/LIMIT)으로 흡수. evidence·page 보존, flat 속성으로 역질의는 오히려 정확해짐. resolve+load만, config.FOLD_SCALAR_VALUES 토글로 가역." },
    { title: "[v08] 원문 chunk를 노드로 — v06 결정의 의도된 반전(grounding ≠ recovery)",
      detail: "v06은 'sources_json이 근거를 충족하니 chunk 노드 불필요'라 봤다. 그 논리는 grounding(이미 뽑힌 노드·엣지의 출처)만 다뤘고 recovery(추출이 entity·관계로 아예 못 뽑은 산문 문장)를 놓쳤다 — 그런 문장은 노드 자체가 없어 sources_json이 붙을 곳도 없다(claim OFF의 '전화-음성녹음' 섬·15일 안내 의무 소실이 그 증거). chunk 노드는 다른 문제를 푼다: ①추출이 놓친 문장도 chunk.text로 100% 복원 ②모든 entity가 출처 chunk에 FROM_CHUNK로 붙어 출처 연결 100%. '또 다른 허브' 우려는 FROM_CHUNK/NEXT_CHUNK를 의미 지표에서 제외해 차단(MS GraphRAG text_units·Neo4j lexical graph 관행). load만 변경, config.BUILD_LEXICAL_GRAPH 토글." },
  ],

  /* 참고 논문 --------------------------------------------------------------- */
  papers: [
    {
      title: "DocPolicyKG: A Lightweight LLM-Based Framework for Knowledge Graph Construction from Chinese Policy Documents",
      venue: "CIKM",
      year: "2025",
      url: "https://doi.org/10.1145/3746252.3760904",
      desc: "도메인 온톨로지와 경량 LLM을 결합해 계층 구조와 문맥 의존성이 강한 정책 문서에서 엔티티·관계 그래프를 구축한다. 약관처럼 규칙과 조건이 얽힌 문서에서도 닫힌 스키마와 도메인 지식을 활용하면 작은 모델로 실용적인 KG를 만들 수 있다는 참고 사례다.",
    },
    {
      title: "Ontology Learning and Knowledge Graph Construction: A Comparison of Approaches and Their Impact on RAG Performance",
      venue: "arXiv:2511.05991",
      year: "2025",
      url: "https://arxiv.org/abs/2511.05991",
      desc: "벡터 RAG·GraphRAG·온톨로지 기반 KG-RAG를 비교해, 온톨로지와 원문 chunk 정보를 함께 보존한 그래프가 강한 검색 성능을 보인다고 보고한다. 우리 프로젝트의 타입 스키마와 Chunk lexical 층을 함께 유지하는 설계를 뒷받침한다.",
    },
    {
      title: "OG-RAG: Ontology-Grounded Retrieval-Augmented Generation For Large Language Models",
      venue: "arXiv:2412.15235",
      year: "2024",
      url: "https://arxiv.org/abs/2412.15235",
      desc: "도메인 온톨로지로 사실 묶음을 hypergraph에 구성하고, 질문에 필요한 최소 사실 집합을 골라 LLM 문맥으로 제공한다. 약관 질의에서도 단순 유사도 검색보다 엔티티 관계와 규칙 구조를 따라 필요한 근거만 모으는 retrieval이 중요하다는 방향을 제시한다.",
    },
    {
      title: "StructuGraphRAG: Structured Document-Informed Knowledge Graphs for Retrieval-Augmented Generation",
      venue: "AAAI Symposium Series",
      year: "2024",
      url: "https://doi.org/10.1609/aaaiss.v4i1.31798",
      desc: "문서의 장·절 등 구조를 활용해 엔티티와 관계를 추출하고 KG-RAG의 정확성·포괄성·문맥 적합성을 높인다. PDF를 평평한 텍스트로만 보지 않고 문서 구조를 파싱·chunk·그래프 구성 전 과정에 보존해야 한다는 점이 우리 파이프라인과 직접 맞닿아 있다.",
    },
  ],

  /* 테스트 방법.  type = 채점 주체 구분:
   *   "육안"      = 사람이 직접 눈으로 판단
   *   "LLM-judge" = LLM 이 채점 (LLM-as-a-judge)
   *   "기계"      = 코드가 자동·결정적으로 측정/비교 (LLM 안 씀)            */
  tests: [
    { name: "실제 질문 26개로 그래프에 물어보기", type: "육안",
      file: "약관을 보고 만든 26개 질문",
      desc: "질문 26개(예: '소멸시효는 몇 년?', '청약철회는 언제까지 돼?', '암 진단비랑 유사암 진단비는 뭐가 달라?')를 만들어, 그래프가 그 답을 제대로 내놓는지 하나씩 확인합니다. 한 번에 찾는 단순한 질문부터 여러 정보를 이어 붙여야 답이 나오는 질문까지 골고루 넣어, 답을 못 하거나 없는 답을 지어내는 경우를 잡아냅니다." },
    { name: "사람이 직접 눈으로 훑어보기", type: "육안",
      file: "그래프 화면 ↔ 약관 원문 대조",
      desc: "그래프를 화면에 띄워 항목과 연결을 직접 둘러보고, 수상한 곳은 약관 원문과 맞대 봅니다. 없는 내용을 지어냈는지, 빠뜨렸는지, 엉뚱한 것끼리 합쳐졌는지 — 자동 검사가 못 잡는 '이게 말이 되나?'를 사람이 판단합니다." },
    { name: "다른 AI에게 채점 맡기기", type: "LLM-judge",
      file: "다섯 관점 채점",
      desc: "또 다른 AI에게 우리 그래프를 다섯 관점으로 채점하게 합니다 — 빠진 내용은 없나, 연결이 맞나, 원문 뜻이 잘 살아 있나, 근거가 달려 있나, 쓸데없는 잡음은 없나. 사람이 일일이 보기 힘든 많은 양을 빠르게 훑는 용도입니다." },
    { name: "모범답안 만들어 맞춰보기", type: "육안",
      file: "조항별 정답지",
      desc: "모범답안을 직접 만든 뒤, 우리 그래프가 그만큼 담고 있는지 대조합니다. 그래프가 얼마나 빠짐없이 담았는지를 재는 용도입니다." },
    { name: "핵심 숫자 자동 점검", type: "기계",
      file: "버전마다 자동 비교",
      desc: "버전을 고칠 때마다 핵심 숫자(항목 수, 끊긴 연결, 어디에도 안 이어진 외톨이 항목 등)를 코드가 자동으로 비교해, 의도치 않게 망가진 데가 없는지 점검합니다. 사람·AI 평가가 놓치기 쉬운 구조적 실수를 잡습니다." },
    { name: "얼마나 잘 이어져 있나 측정", type: "기계",
      file: "연결 상태 수치화",
      desc: "그래프가 하나로 잘 이어져 있는지, 아니면 외딴 섬처럼 조각나 있는지를 숫자로 잽니다. 섬이 많으면 여러 정보를 이어서 답하기가 어려우므로, 고치기 전에 원인부터 측정하는 단계입니다." },  
  ],
};
