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
    title: "doc2graph — 버전 변천사 보고서 (v01 → v06)",
    doc: "대상 문서: MG손해보험 무배당 mg뉴파워보장보험 약관 (mg_new_power, 97p)",
  },

  /* 맨 위 블록 — 이 프로젝트로 '무엇을 만들려는가'(목적)만 담는다.
   * 수치·버전 성과는 아래 '버전 변천사'·'그래프 진화'에서 보이므로 여기서 반복하지 않음.
   * lead 는 강조(<b>·<i>) 위해 HTML 그대로 렌더. points 는 목적을 항목별로(무엇을·어떻게·어디로·지금). */
  summary: {
    lead:
      "<b>만들고 싶은 것</b> — 보통의 RAG 는 문서를 잘게 잘라 질문과 비슷한 조각을 찾아옵니다. " +
      "그래서 <i>여러 사실을 이어 붙여야 답이 나오는</i> 질문에는 약합니다. 우리가 만들려는 건 " +
      "문서 속 사실을 <b>Entity·Relationship·Claim</b> 으로 뽑아 서로 <b>연결</b>한, " +
      "<b>multi-hop</b> 추론이 가능한 <b>지식그래프(KG)</b> — RAG 를 한 단계 끌어올리는 ‘쓸만한’ 그래프입니다.",
    points: [
      { k: "무엇을", v: "문서 한 건을 노드(개념·수치·코드) + 관계 + 근거 있는 claim 으로 이뤄진 그래프로." },
      { k: "어떻게", v: "무거운 프레임워크 없이 직접 구현 · 닫힌 스키마로 질의 가능하게 · 모든 노드·엣지에 원문 근거(evidence) 보존." },
      { k: "어디로", v: "지금은 약관 1건이지만, 다음 목표는 여러 문서·여러 도메인으로 확장하는 것(North Star)." },
      { k: "지금",   v: "버전을 거치며 계속 고도화 중 — 아래에서 v01 → v06 의 변화와 현재 그래프를 직접 볼 수 있습니다." },
    ],
    /* claim on/off 정책 명시 (코드 토글은 추후). 그래프 연결성과 무관해 비용 절감용으로 끔. */
    note:
      "<b>claim 추출</b> <span class=\"off-pill\">현재 OFF</span> — claim(면책·지급조건·정의 같은 산문 사실)은 " +
      "그래프 <b>연결성에는 영향이 없어</b>, 지금 단계에서는 LLM 비용을 아끼려 끈 채로 진행합니다. " +
      "필요할 때 다시 <b>ON</b> 으로 켤 수 있습니다(추출 2번째 패스 토글). " +
      "<span class=\"note-cav\">※ 아래 그래프·claim_type 표는 claim 을 켠 v06 기준입니다.</span>",
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
        "정확도보다 '파이프라인이 끝까지 도는가'를 먼저 확인. PDF 한 개를 그래프까지 한 바퀴 돌리는 것이 목표.",
      schema: [
        "Entity 7종: Person · Org · Product · Concept · Condition · Numeric · Date",
        "Relationship: open rel_type (자유 동사구, 사전 목록 없음 — resolve 에서 정규화)",
        "Claim: subject / text / evidence (이항관계로 환원 안 되는 사실)",
        "도메인 전용 5타입(Coverage/Term/Trigger/Exclusion/Amount)은 overfit 우려로 폐기 → 범용 스키마 전환",
      ],
      changes: [
        "전 파이프라인 ①~⑥ 최초 구현·완주, Neo4j Browser 시각화 확인",
        "few-shot 예시는 비보험(ACME 스마트워치)로 형식만 학습 (overfit 회피)",
        "gleaning · embedding · community 는 의도적으로 제외(범위 통제)",
      ],
      problems: [
        "섹션 구조 없음(flat) → traversal 약함",
        "산문 조문 claim 누락 · 별표 코드 누락 · 수치 entity 고아화",
        "미매칭 claim 102개가 Document 노드에 매달림(허브)",
      ],
      eval: "정식 회귀 전. MVP 동작 확인 수준(코드 동결점 git tag v0.1-mvp).",
    },
    {
      id: "v02",
      title: "v02 — quality baseline",
      date: "2026-06-11",
      tag: "닫힌 스키마 + 조항 구조",
      goal:
        "품질 단계로 전환 — 그래프 개선·질문 기반 검증 피드백을 반영해 'queryable 한 그래프'를 목표로.",
      schema: [
        "Relationship open → closed enum 12종 (common 7 + insurance 5)",
        "온톨로지 외부화: ontologies/common.json + insurance.json",
        "Section / MENTIONS 백본 도입(22 sections) — 조항 구조 부여",
      ],
      changes: [
        "chunk.py: 특약 hard boundary · coverage_id carry-forward · MAX_TOKENS 1500 · OCR 헤더 복구",
        "extract: '제N조' entity 기계 차단 · 표 처리 · rel_type 닫힌 enum",
        "resolve: canon_key 정규화 · 괄호 제거 2차 매칭 · claim canonical 키에 coverage 추가",
        "load 재작성: ASCII 관계타입 매핑 · sources_json · 검증 쿼리 5종 자동 실행",
      ],
      problems: [
        "dropped 182 폭증 — 닫힌 enum + target 미승격으로 dangling 대량 발생",
        "claim 수 감소(596→378)",
        "결함 #1~#9: 핵심 #2 산문 claim 누락 · #7 별표8 코드 통째 누락 → 전부 extract 단계로 수렴",
      ],
      eval: "26문항 수동 Cypher 회귀 도입 → PASS 16 / PARTIAL 6 / FAIL 4. 부재 판정 = entity+claim+edge 3중 검색 후.",
    },
    {
      id: "v03",
      title: "v03 — gleaning + LLM-judge eval",
      date: "2026-06-12",
      tag: "2차 회수 + 평가 체계화",
      goal: "확정된 결함 기반 extract 정밀화 + 놓친 것 2차 회수(gleaning).",
      schema: [
        "스키마 변화 없음(v02 유지). 추출 '깊이'와 '평가'에 집중한 버전.",
      ],
      changes: [
        "glean.py 신설: 표적 gleaning(claims·table_codes·numeric_links), chunk당 1회",
        "dangling 기계 rescue — LLM 없이 끝점 복구로 별표 코드 생존(#7 해소)",
        "EXTRACT_VARIANT 상수로 추출/글린 A·B 연결",
        "LLM-judge eval 체제: 5폴더(노드·관계·내용보존·근거·노이즈) + synthesis → 원인별 수정",
      ],
      problems: [
        "#10 제43조 소멸시효 claim 소실(extract 비결정성/퇴행)",
        "#12 갱신형 특약 헤더 소실(이미지 배너+OCR off) → 'parse 무죄' 더 이상 성립 안 함",
        "별표 참조 정의 미추출('정의된다' 82→21 급감)",
      ],
      eval: "PASS 18 / PARTIAL 6 / FAIL 2. 고립 노드 30%→14%. gleaning 효과 실증(rescue·claims 타깃).",
    },
    {
      id: "v05",
      title: "v05 — Code 타입 + MS식 claim_type + 구조 개편",
      date: "2026-06-15 ~ 06-16",
      tag: "스키마 보강 + de-hub (v0.4 스키마 작업 포함)",
      goal:
        "정확도 최우선 방침 하에 (a) 스키마 보강 (b) 상류 파이프라인 구조 정리(분절·resolve·참조구조).",
      schema: [
        "Entity 8번째 타입 Code 신설 — 분류코드(C44·I60)를 doc-scope 식별자로 (Numeric 오분류 124개 해결, v05 Code 203개)",
        "Claim 을 MS GraphRAG식으로 확장: claim_type 닫힌 enum 7종(의무/면책/지급조건/해지·실효/납입·환급/정의·범위/기타) + object 필드",
        "status·ISO date 는 약관에 안 맞아 제외(전부 TRUE·상대 날짜)",
        "Section / Document 노드 제거 → coverage_id·title·page 를 속성으로 강등(provenance-as-property)",
      ],
      changes: [
        "dangling → 0: 미해결 끝점을 Concept/Numeric 으로 승격해 엣지 부활 + doc-anchored claim 재앵커",
        "chunk.py: OCR 장번호 흡수 + 헤더 없는 본문 특약줄 경계 승격(분절 오염 해소, coverage 22→36)",
        "bare-number 정규화(지급률 % 복원) · ACME 환각 제거 · 별표 REFERENCES 엣지",
        "recall 강화: 정의문 강제 · 단서(예외) 강제 프롬프트(#20/#22) + glean 선정 신호 보강",
        "기계 불변식 게이트 check_baseline.py 신설(토큰 0 구조지표 diff, 매 단계 검증)",
      ],
      problems: [
        "2-16 known-gap: 갱신형 특약 헤더가 상류에서 파싱 탈락(re-parse 필요)",
        "회귀 2건: Q-001·Q-007 claim 이 재추출 stochastic drop 으로 소실(정확도 최우선상 방치 불가)",
        "별표/외부표 참조(#21)는 스키마 빈틈으로 보류(제2조·MH001·제8조 3회 등장)",
      ],
      eval:
        "26문항 회귀 = PASS 17(깨끗 13 + 개선 4) + 데이터로 해결 1(Q-005) + PARTIAL 4 + 회귀 2 + 정보없음 2. multi-hop 답변이 뚜렷이 개선됐다.",
    },
    {
      id: "v06",
      title: "v06 — 연결성: 섬 파편화 해소 (2-패스 + 별표 링크)",
      date: "2026-06-18 ~ 06-19",
      tag: "topology fix (스키마 변화 없음)",
      goal:
        "추출 품질이 아니라 그래프 '형태'를 고친다. v0.5 그래프가 457개의 섬(connected component)으로 쪼개져 있었다 — 노드 82%가 degree ≤ 1, 가장 큰 connected component(LCC)가 전체의 21.6%뿐. multi-hop traversal 이 섬을 못 건너는 병목이다. 측정으로 진짜 원인을 확정하고 딱 둘만 고쳤다.",
      schema: [
        "스키마 변화 없음(Entity 8종·rel 13종·claim_type 7종 그대로). enum 에 손 안 댐.",
        "claim 의 '역할'을 고정 — 연결을 만들지 않는 참고용 잎(구조 엣지는 HAS_CLAIM 1종뿐).",
        "chunk 노드는 만들지 않음 — 노드·엣지마다 evidence(원문 인용)가 sources_json 에 이미 있어 근거(grounding)는 충족된다.",
      ],
      changes: [
        "extract.py 2-패스: Pass1 Entity+Relationship(cross-ref 를 정의된다/참조한다 엣지로 명시 추출) → Pass2 Claim(ent+rel 보고 잔여 조건문만). claim 에 갇혔던 연결 182개 회수.",
        "resolve.py link_table_rows(): appendix 청크의 원문 【별표N】 마커를 검출해 표 행을 가장 가까운 별표에 포함한다로 기계 연결(766건). 표가 청크 넘기면 carry-forward, CJK 괄호로 오인 방지.",
        "glean.py 제거 — 2-패스 추출이 그 역할(항·호·표코드·수치연결)을 직접 흡수. 26문항 회귀로 커버를 확인한 뒤 파이프라인에서 뺐다.",
        "측정 우선: _connectivity / _appendix_probe / _claim_audit 로 원인 확정 후에만 손댐 — 순진한 coverage 묶기(거대허브)·별표 regex 스파인(오버핏) 둘 다 시뮬레이션으로 걸러 폐기.",
      ],
      problems: [
        "별표1(장해분류표)이 degree 246 의 초대형 허브 — 의미는 있으나 traversal noise 우려. 필요하면 부위별 중간 카테고리로 쪼갤 수 있다.",
        "남은 고립 노드 ~140개: 별표 행 70개(위치 매칭 실패로 못 붙은 것) + 본문 70개(정의 용어가 claim 안에만 있고 엣지가 없음, 표가 아님).",
        "현재 26문항은 검색 시작점을 키워드로 찍는(entity-anchored) 유형이라, 'LCC 79%'의 진짜 가치(시작점을 몰라도 따라가는 traversal 견고성)는 이 세트만으로는 다 측정되지 않는다 — traversal-stress 쿼리는 아직 안 만듦.",
      ],
      eval:
        "26문항 회귀 = PASS 23 / PARTIAL 3 / FAIL 0 (v0.4 21/5/0). 새로 통과한 2개 모두 v0.6의 직접 성과 — MH001(뇌졸중→분류코드를 한 홉에 도달)·Q-005(소멸시효가 깔끔한 엣지로 연결). 남은 PARTIAL 3개는 연결성 문제가 아니라 본문 claim을 덜 뽑은 recall 갭(Q-006·Q-007·GS003).",
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
      headline: "그래프를 '질의 가능'하게 — 열린 어휘 → 닫힌 스키마 + 조항 구조",
      problems: [
        "관계 타입이 열린 자유 어휘 82종 — '포함한다'와 '포함된다'가 따로 생기는 등 동의어 난립 → Cypher 질의 불가",
        "섹션 구조 없음(flat) → 조항 단위 traversal·요약 불가",
        "고립 노드 291개 — 그래프가 듬성듬성, claim 102개는 Document 허브에 매달림",
      ],
      fixes: [
        "rel_type 닫힌 enum 12종으로 고정(common 7 + insurance 5), 온톨로지 외부화(common/insurance.json)",
        "chunk.py: 특약 hard boundary + coverage_id carry-forward → Section 22개 백본",
        "'제N조' 엔티티 기계 차단 · 표 처리 · MAX_TOKENS 1500 · load 검증쿼리 5종",
      ],
      results: [
        "rel_type 82→12종으로 정규화 → Cypher 질의 가능해짐(핵심 성과)",
        "관계 234→550으로 더 많이 포착, Section 0→22 구조 부여",
        "26문항 수동 Cypher 회귀 도입 → 16 PASS / 6 PARTIAL / 4 FAIL",
        "⚠ 부작용: dropped 28→182 폭증(닫힌 enum + target 미승격으로 dangling 대량) · claim 596→378 감소 = 다음 버전 숙제",
      ],
      example: {
        title: "관계 어휘(rel_type)",
        before: "포함한다 / 포함된다 / 요구한다 … 자유 동사구 82종 (동의어 난립, 질의 불가)",
        after: "분류번호 · 포함한다 · 조건 · 지급률 · 한도 · 제외한다 · 정의된다 … 고정 12종",
      },
    },
    {
      from: "v02", to: "v03",
      commit: "f672386 (06-12)",
      headline: "놓친 것 2차 회수 — gleaning + dangling 자동 복구 + 평가 체계화",
      problems: [
        "dropped 182 — 관계 끝점(코드 등)이 노드로 안 올라와 대량 폐기. 별표8 분류표 코드 통째 누락(#7)",
        "산문 조문 claim 누락(#2) → claim 378로 빈약",
        "고립률 ~30%(고립 275) — 추출은 됐으나 연결이 안 됨",
      ],
      fixes: [
        "glean.py 신설 — 표적 2차 추출(claims·table_codes·numeric_links), chunk당 1회",
        "dangling rescue — LLM 없이 끝점을 노드로 복구해 폐기 엣지 부활",
        "LLM-judge eval 5종 체제(노드·관계·내용·근거·노이즈) + synthesis 도입",
      ],
      results: [
        "claim 378→642(gleaning 회수), 관계 550→787",
        "dropped 182→39(rescue 효과), 고립 275→148(고립률 30%→14%)",
        "Condition 143→294(질병 타이핑 강화)",
        "26문항 회귀 18 PASS / 6 PARTIAL / 2 FAIL — 별표 코드(#7) 생존",
        "⚠ 잔존: #10 제43조 claim 비결정적 소실 · #12 갱신형 특약 헤더 parse 탈락('parse 무죄' 깨짐)",
      ],
      example: {
        title: "별표8 분류표 코드",
        before: "코드가 끝점 미승격으로 dangling 폐기 → 질병↔코드 질의 불가 (#7)",
        after: "rescue로 코드 노드 생존 → 그래프에 적재(별표 코드 질의 가능)",
      },
    },
    {
      from: "v03", to: "v05",
      commit: "v0.4: 0f000c6 (06-15) → v0.5: 58b27b1 (06-16)",
      headline: "스키마 보강(Code·claim_type) + 구조 개편(de-hub, dangling 0) — v0.4 작업 포함",
      problems: [
        "분류코드(C44·I60)가 Numeric으로 오분류 124개 — I21이 3노드로 쪼개짐(C-002)",
        "claim이 subject/text뿐 → 면책·지급조건 등 '유형'으로 질의 불가",
        "Section/Document가 허브 노드 — 단일문서 한정 크러치(다문서 확장에 불리)",
        "여전히 dangling 39 · 고립 148 · 분절 오염(coverage 22 < 실제 ~35)",
      ],
      fixes: [
        "Entity 8번째 타입 Code 신설 — 분류코드를 doc-scope 식별자로 (C-002 해결)",
        "claim_type 닫힌 enum 7종 + object 필드 (MS GraphRAG식 선별 채용; status·ISO date 제외)",
        "Section/Document 노드 제거 → coverage·page 속성화(provenance-as-property, de-hub)",
        "dangling→0: 미해결 끝점을 Concept/Numeric 승격 + doc-anchored claim 재앵커",
        "chunk 분절 수정(coverage 22→36) · bare-number % 복원 · ACME 환각 제거 · 별표 참조 엣지(참조한다) · recall 강화 프롬프트(#20/#22)",
      ],
      results: [
        "Code 0→203(C-002 실측 해결), Date 3→0(흡수)",
        "dropped 39→0(dangling 완전 해소), claim 642→937(+claim_type 7종 분류)",
        "coverage 22→36, rel_type 12→13(참조한다 추가), 고립 148→121",
        "평가: v0.4 21 PASS / 5 PARTIAL / 0 FAIL(FAIL 처음 0) → v0.5 구조개편 후 multi-hop/traversal 답변성↑",
        "⚠ 잔존: 별표 분류표 질병↔코드 링크 미연결(고립 121의 절반) · 2-16 헤더 parse gap · 재추출로 Q-001·Q-007 claim 확률적 소실(회귀 2)",
      ],
      example: {
        title: "분류코드 I21 (급성심근경색증)",
        before: "Numeric으로 인식돼 'I21'·'21' 등 여러 노드로 분산 — 코드 질의 불가 (C-002)",
        after: "Code 타입 단일 노드 I21 → 질병 -[분류번호]→ I21 multi-hop 질의 가능",
      },
    },
    {
      from: "v05", to: "v06",
      commit: "523b759 (06-19)",
      headline: "그래프를 '하나의 대륙'으로 — claim에 갇힌 연결 회수 + 별표 표 행 연결",
      problems: [
        "그래프가 457개의 섬(connected component)으로 쪼개짐 — 노드 82%가 degree ≤ 1, 가장 큰 connected component(LCC)가 전체의 21.6%뿐. multi-hop traversal 질의가 섬을 못 건넌다",
        "관계가 돼야 할 것이 claim 안에 갇힘 — claim 937개 > 관계 744개. 관계·참조 형태의 claim 182개(19%)가 원래 엣지였어야 함. 별표 연결도 엣지 34 vs claim 69로, 2/3이 claim에 묶여 있었다",
        "별표 표 행(전체 별표의 67%)이 본문과 끊긴 별개의 대륙 — 헤더 【별표N】이 자기 행들을 거느리지 못함(소속 정보가 'appendix'로 뭉개져 load 단계에선 복구 불가)",
      ],
      fixes: [
        "extract.py 2-패스 — Pass1 Entity+Relationship(cross-ref를 정의된다/참조한다 엣지로), Pass2 Claim(잔여 조건문만). claim 마지막 = 연결을 먼저 확보",
        "resolve.py link_table_rows() — appendix 원문 【별표N】 마커 검출해 표 행을 가장 가까운 별표에 포함한다로 기계 연결(766건 주입)",
        "glean.py 제거(2-패스가 역할 흡수) · claim = 참고용 잎으로 역할 고정(구조 엣지는 HAS_CLAIM뿐)",
        "측정 먼저 — coverage 묶기(거대허브 재발)·별표 regex 스파인(오버핏)은 시뮬레이션으로 미리 폐기",
      ],
      results: [
        "섬(connected component) 457→165개, LCC 21.6%→79.2%(1120노드 중 887개) = 그래프가 사실상 하나로 이어짐",
        "관계 744→1591(2-패스 +108, 별표 링크 +766 등), 완전 고립(degree 0) 117→19개, degree ≤ 1 76%→39%",
        "claim 937→1016이나 분포 재편: 정의·범위 379→284(cross-ref가 엣지로 빠짐) · 지급조건 230→369(전용 claim 패스가 더 꼼꼼)",
        "26문항 회귀 23 PASS / 3 PARTIAL / 0 FAIL(v0.4 21/5/0) — MH001·Q-005가 multi-hop/엣지로 승격되며 +2 PASS",
        "⚠ 잔존: 별표1 deg 246 거대 허브 · 고립 ~140 · 키워드 앵커 회귀셋으로는 79% 연결성의 진짜 가치 미측정(traversal-stress 쿼리 숙제)",
      ],
      example: {
        title: "별표 표 행 연결 (별표8 질병분류표)",
        before: "코드 행이 헤더와 안 이어짐 — '암이라 함은 별표2에서 정한 질병' 같은 정의가 claim에 갇혀 object조차 '없음', 별표는 본문과 끊긴 섬",
        after: "별표2 -[포함한다]→ 분류표 행 766건 연결 + cross-ref가 정의된다/참조한다 엣지로 → 뇌졸중 -[분류번호]→ I60·I61 한 홉(MH001 PASS)",
      },
    },
  ],

  /* 그래프 형태의 진화 (버전 간 정성 비교) -------------------------------- */
  graphEvolution: [
    { aspect: "구조(Section)",   v01: "flat, 섹션 없음", v02: "Section 22 백본", v03: "Section 22 유지", v05: "Section 노드 제거 → 속성화(coverage 36)", v06: "동일 (속성화 유지)" },
    { aspect: "Entity 타입 수",  v01: "7종", v02: "7종", v03: "7종", v05: "8종 (Code 추가, Date 흡수)", v06: "8종 (변화 없음)" },
    { aspect: "Relationship",    v01: "open(자유)", v02: "closed enum 12", v03: "closed enum 12", v05: "closed enum 13", v06: "closed enum 13 (cross-ref를 엣지로 회수)" },
    { aspect: "Claim",           v01: "subject/text", v02: "subject/text", v03: "subject/text", v05: "+ claim_type(7종)·object", v06: "참고용 잎 (연결 안 함)" },
    { aspect: "Claim 앵커",      v01: "102 → Document", v02: "34 → Document", v03: "44 → Document", v05: "전부 Entity (Document 제거)", v06: "전부 Entity (HAS_CLAIM)" },
    { aspect: "추출 방식",       v01: "단일 호출", v02: "단일 호출", v03: "단일 + glean", v05: "단일 + glean", v06: "2-패스(Ent+Rel→Claim), glean 제거" },
    { aspect: "연결성(섬·LCC)", v01: "고립 291", v02: "고립 275", v03: "고립 148(Section 백본이 가림)", v05: "섬 457·LCC 21.6%(de-hub로 파편화 노출)", v06: "섬 165·LCC 79.2%" },
    { aspect: "dangling drop",   v01: "28", v02: "182", v03: "39", v05: "0", v06: "0" },
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
      detail: "노드·엣지마다 evidence(원문 인용)+page+chunk_id 가 sources_json 에 이미 들어 있어 근거(grounding) 요건을 충족한다. 별도 (:Chunk) 노드는 또 다른 허브만 만들 뿐이라 추가하지 않음." },
  ],

  /* 테스트 방법.  type = 채점 주체 구분:
   *   "육안"      = 사람이 직접 눈으로 판단
   *   "LLM-judge" = LLM 이 채점 (LLM-as-a-judge)
   *   "기계"      = 코드가 자동·결정적으로 측정/비교 (LLM 안 씀)            */
  tests: [
    { name: "26문항 수동 Cypher 회귀", type: "육안",
      file: "eval/manual_cypher_test.md (살아있는 정본)",
      desc: "A·B(단순조회·조건정리)=오정보 0 감시 / C·D·E·F(비교·요약·확인불가·multi-hop)=전부 PASS 목표. 부재 판정은 entity+claim+edge 3중 검색 후에만." },
    { name: "직접 육안 검토 (수동 spot-check)", type: "육안",
      file: "그래프 뷰어(report) · Neo4j Browser · resolved.json",
      desc: "추출 결과를 사람이 직접 눈으로 확인 — 그래프 뷰어에서 노드·엣지·evidence 를 훑고, 의심 가는 조항을 원문과 대조해 환각·누락·오병합을 spot-check. 자동화가 못 잡는 '말이 되나'를 사람이 판단." },
    { name: "LLM-judge eval 5종", type: "LLM-judge",
      file: "eval/01~05 폴더 README = 작업 지시서",
      desc: "노드 coverage / 관계 정확·귀속 / 내용 보존 / 근거 provenance / 노이즈. 결과는 YYYY-MM-DD__agent__*.md, synthesis 후 원인별 수정." },
    { name: "gold 슬라이스 대조", type: "육안",
      file: "eval/gold/제2조·제5조·제8조",
      desc: "스키마-라이트 gold 를 한 조항씩 사람이 만들어 우리 그래프와 대조 → recall 측정. 결론: 스키마는 충분, 병목은 recall." },
    { name: "기계 불변식 게이트", type: "기계",
      file: "eval/check_baseline.py",
      desc: "토큰 0 구조 지표 diff(Section/dropped/coverage/orphan/ACME 등)를 매 단계 검증. LLM 평가가 놓치는 구조 결함 포착." },
    { name: "회귀 러너", type: "기계",
      file: "eval/run_eval.py",
      desc: "md 문항별 cypher 블록 파싱 → Neo4j 읽기전용 실행 → eval/_results.md 덤프. baseline 과 행 단위 비교." },
    { name: "[v06] 연결성 진단 스위트", type: "기계",
      file: "eval/_connectivity*.py · _appendix_probe.py · _claim_audit.py",
      desc: "connected component 수·degree 분포·고립률 측정(_connectivity), 순진한 fix 시뮬레이션(_connectivity_sim), 별표 행 고아 진단(_appendix_probe), 'claim이 연결을 먹는다' 확정(_claim_audit). 코드 수정 전 '측정 먼저' 게이트." },
  ],
};
