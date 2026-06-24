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
    title: "doc2graph — 버전 변천사 보고서 (v01 → v08)",
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
    {
      id: "v07",
      title: "v07 — 눈으로 본 문제 수정: 숫자노드 클러터 + 열거 recall (claim OFF)",
      date: "2026-06-22",
      tag: "정리 + 열거 recall (스키마 변화 없음, claim OFF)",
      goal:
        "뷰어에서 육안으로 발견한 두 문제 — (1) 이름이 '36·1·2'인 '그냥 숫자' 노드, (2) 2~4노드 섬 — 을 오버핏·복잡구조 없이 고친다. claim은 OFF로 유지하고, Entity·Relationship으로 명확히 표현되는 것만 담는 방향을 굳혔다. 전부 재추출 1회 + resolve 변경으로 처리(enum·스키마 불변).",
      schema: [
        "스키마 변화 없음(Entity 8종·rel 13종 그대로). claim_type은 OFF라 미사용.",
        "claim OFF 유지 — Pass3(Claim)·resolve claim 경로 생략(src/config.py EXTRACT_CLAIMS=False). 원문은 chunks에 보존.",
      ],
      changes: [
        "숫자노드 정리(resolve): 별표 분류표 '행번호'(1|위,십이지장)·목차 '페이지번호'(보장명···101)를 evidence 모양으로 제거(drop_structural_numbers) + 지급률 값 '%' 복원(normalize_bare_numbers 완화). 엣지 종류가 아닌 evidence로 판정 — 재추출마다 바뀌는 오추출 엣지에 안 휘둘리게(행번호가 분류번호→조건으로 바뀐 회귀를 이 방식으로 차단).",
        "열거 완전성(extract Pass1·2): 'A는 B,C,D를 제외/포함' 나열을 항목마다 entity+엣지로 강제('등' 금지). 영업일→토/일/공휴일/근로자의날 degree 1→6, 제외한다 58→94.",
        "precision 게이트(resolve): link_table_rows가 별표를 Numeric값에 잇던 '별표1→60%' 값-포함 오류 254개 차단(값은 항목에 종속, 별표 멤버 아님). 그로 떠버린 죽은 값노드 118개 제거(drop_orphan_values, ontology '고립 수치=무의미' 원칙).",
        "recall 탐지기 도구화(eval/_recall_probe.py): degree÷원문등장으로 gold 없이 under-connected 노드 발굴 → 섬을 5종류로 분류(대부분 정상 잎·claim-off 고아, 진짜 깨끗한 누락은 '열거 멤버'뿐).",
      ],
      problems: [
        "claim OFF의 직격탄: 제5조류 면책·예외·통지의무 등 산문 사실은 그래프에 없음(gold 제5조 E-R recall 0/10). 고립 83개 다수가 이 때문(피보험자·가입금액·면책 위험행위 7종 등) — 연결성 결함이 아니라 토글 선택의 비용.",
        "백로그: 제외한다 주어 오결합('전문의(치과의사 제외)'가 질병·상품에 결합)·방향 오류 일부, 별표6 중복표 14행 누락(별표5와 겹침), 수익자=보험수익자 분리(과병합 위험으로 보류).",
        "지급률/조건 엣지 under-extraction — 값이 항목과 안 이어진 게 고립 값노드의 근본 원인(이번엔 제거로 정리, 근본은 추출 recall 과제).",
      ],
      eval:
        "claim OFF라 26문항(claim 조회형 ~17/26)은 부적합 → gold E-R 슬라이스로 측정. 제8조(지급절차) 13/18(~72%) — 영업일 4종·가지급 50%·예외 6종 포착, v0.6에서 ⚠였던 제8조↔별표1-1(지연이자) 연결도 메워짐. 제5조(면책) 0/10 = claim-형 조문이라 예고된 정상. precision 샘플(rel별 40개): 조건 0.925 · 제외한다 0.775 · 포함한다 ~0.85(별표→Numeric 게이트 후).",
    },
    {
      id: "v08",
      title: "v08 — 스칼라 값 fold(속성화) + 원문 lexical 층(Chunk 노드)",
      date: "2026-06-24",
      tag: "표현 정리 + 원문 복원 층 (스키마 변화 없음, claim OFF)",
      goal:
        "두 가지를 더한다. (1) '1cm·50%·2' 같은 리터럴 스칼라를 독립 Numeric 노드 대신 host entity '속성'으로 흡수(fold) — 대표 GraphRAG 관행이고, 같은 값('50%')이 18개 노드로 안 합쳐져 '값 노드'의 역질의 이점이 실제로 없음을 데이터로 확인한 결과. (2) 원문 조각을 (:Chunk) 노드로 얹어(lexical 층) 추출이 못 뽑은 산문 문장까지 100% 복원 가능하게 + 모든 entity를 자기 출처 chunk에 FROM_CHUNK로 연결. resolve/load만 변경, 추출 스키마·enum 불변. claim은 OFF 유지.",
      schema: [
        "스키마 변화 없음(Entity 8종·rel enum 그대로). claim OFF 유지(claims=0).",
        "스칼라 fold: 값-전용 Numeric 노드를 host 속성(value_attrs / PAY_RATE·PAY_AMOUNT·LIMIT)으로 흡수 → Numeric 노드 308→7. config.FOLD_SCALAR_VALUES 토글(resolve+load).",
        "lexical 층: (:Chunk{text}) + (:Entity)-[:FROM_CHUNK]->(:Chunk) + (:Chunk)-[:NEXT_CHUNK]->(:Chunk) 순서 백본. config.BUILD_LEXICAL_GRAPH 토글(load만). 아래 뷰어도 chunks를 읽어 Chunk 노드(종이색 네모)·FROM_CHUNK·NEXT_CHUNK로 함께 표시(원문은 160자 미리보기, 전문은 Neo4j).",
      ],
      changes: [
        "resolve.fold_scalar_values + load: 들어오는 값-엣지(지급률·지급금액·한도·조건-수치)만 가진 깨끗한 스칼라를 host 속성으로 흡수하고 노드+엣지 제거. evidence·page 100% 보존(value_attrs_json + PAY_RATE 등 flat 속성으로 '값 기준 역질의' 가능).",
        "load lexical 블록: outputs/chunks를 (:Chunk) 노드로 적재(DETACH DELETE로 멱등 교체), entity sources의 실재 chunk_id로 FROM_CHUNK, 문서 순서로 NEXT_CHUNK 백본(chunk_id 숫자 파싱 정렬 — 1000+ 문자열정렬 깨짐 방지).",
        "의미/출처 분리 규약: FROM_CHUNK/NEXT_CHUNK는 의미 카운트·고립 지표에서 제외(_appendix_probe 차수도 동일 수정). 의미 연결은 typed-edge가, 원문 복원은 chunk가 — 두 트랙 분리.",
        "적대리뷰 5관점 통과(내 쪽 Neo4j 없어 Cypher 직접 실행 불가 → 리뷰로 대체) + 사용자 load 실행 후 원문 대조 검증(제30조 633~677행 한 글자 누락 0, 비-내용 마커만 정상 제거).",
      ],
      problems: [
        "의미(semantic)-only 고립이 83→105로 늘었다 — fold가 값-엣지만 갖던 host를 갈 곳 없게 만든 부작용(+재추출 jitter). lexical이 '출처' 차원에선 전부 복원하지만 '의미 엣지' 차원 고립은 의도적으로 남겨 claim 트랙에서 다룬다.",
        "의미 고립 105는 '의미 엣지' 기준 수치 — 뷰어에서 타입 필터의 Chunk를 끄면 이 105가 드러나고, 켜면 FROM_CHUNK로 전부 출처 원문에 연결된다(두 상태를 토글로 직접 비교 가능).",
        "보류: 재-chunking(더 작게=추출 정확↑ vs 교차-chunk relation↓ sweet spot 측정), claim→chunk 직접 연결(claim-on 시), 조건 flat 속성 저가치 재검토.",
      ],
      eval:
        "이번 스냅샷은 fold·lexical에 더해 추출 1회 재실행 포함(Condition 146→174 등 소폭은 LLM 비결정성). lexical 투영·load 리포트 기준: Chunk 114·FROM_CHUNK 2297·NEXT_CHUNK 113, 모든 entity가 chunk에 연결돼 출처 LCC 100%·원문 완전 복원. 원문 대조: '보험료의 자동대출납입' 구간(제30조) chunk.text가 원문과 1:1 일치.",
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
    {
      from: "v06", to: "v07",
      commit: "(2026-06-22)",
      headline: "눈으로 본 문제 수정 — '그냥 숫자' 노드 정리 + 열거 연결, precision 게이트 (claim OFF 유지)",
      problems: [
        "뷰어 육안: 노드 이름이 '36·1·2' 같은 맨숫자 — 별표 장해표 행번호·목차 페이지번호가 값으로 오추출, 지급률 값엔 '%'도 빠짐",
        "2~4노드 섬 — '영업일' 같은 용어가 '토/일/공휴일 제외' 열거를 거느리지 못함(토요일·공휴일이 노드조차 없음)",
        "(검증 중 발견) link_table_rows가 별표를 숫자값에 이어 '별표1-포함한다->60%' 값-포함 오류 254개 → 포함한다 precision 0.70",
      ],
      fixes: [
        "drop_structural_numbers + normalize_bare_numbers 완화: 행번호·목차번호 제거(evidence 모양 기반, 엣지 종류 무관), 지급률 % 복원",
        "extract Pass1·2 열거 완전성: 나열 항목마다 entity+제외/포함 엣지 강제('등' 금지)",
        "link_table_rows 게이트(별표→Numeric 차단) + drop_orphan_values(연결 없는 죽은 값노드 제거, ontology '고립 수치=무의미')",
      ],
      results: [
        "맨숫자 클러터 노드 144→소수(진짜 값만 잔존: 지수 25·치아 14 등), 죽은 값노드 118 제거",
        "영업일 degree 1→6(토/일/공휴일/근로자의날 EXCLUDES), 제외한다 58→94",
        "별표→Numeric 포함 오류 254→0(포함한다 precision 0.70→~0.85), 고립 201→83(전부 의미 용어, 죽은 숫자 0)",
        "gold 제8조 E-R recall ~72%(별표1-1 지연이자 연결 보강). ⚠ claim OFF로 제5조류 면책은 0/10 = 의도된 비용",
      ],
      example: {
        title: "영업일 정의(열거 제외)",
        before: "영업일 -[참조한다]→ 별표15 뿐. '토요일·일요일·공휴일·근로자의 날'은 노드조차 없음(열거가 '등'으로 뭉개짐)",
        after: "영업일 -[제외한다]→ 토요일/일요일/공휴일/근로자의 날 (4종 전부 노드+엣지) — degree 1→6",
      },
    },
    {
      from: "v07", to: "v08",
      commit: "(2026-06-24)",
      headline: "값은 노드가 아니라 속성으로(fold) + 원문을 그래프에 얹다(lexical 층)",
      problems: [
        "'1cm·50%·2' 같은 리터럴 스칼라가 독립 Numeric 노드 308개 — 대표 KG와 다르고, 같은 값('50%')이 18개 노드로 안 합쳐져 '값 노드'의 역질의 이점이 실제로 없었다.",
        "claim OFF의 직격탄: 추출이 entity·관계로 못 떨군 산문 문장(예: '회사는 자동대출납입 종료 15일 내 안내' 의무)이 그래프에서 통째로 소실 → '전화-음성녹음' 2노드 섬처럼 맥락 끊긴 고아 발생, 원문 추적조차 불가.",
        "값에만 매달렸던 entity는 값 노드가 빠지면 갈 곳이 없어 고립.",
      ],
      fixes: [
        "스칼라 fold(resolve.fold_scalar_values + load): 들어오는 값-엣지(지급률·지급금액·한도·조건-수치)만 가진 깨끗한 스칼라를 host 속성으로 흡수, 노드+엣지 제거. evidence·page 100% 보존(value_attrs_json + PAY_RATE/PAY_AMOUNT/LIMIT flat 속성 → 값 기준 역질의 가능). config.FOLD_SCALAR_VALUES.",
        "lexical 층(load): outputs/chunks를 (:Chunk{text}) 노드로 적재, entity sources로 (:Entity)-[:FROM_CHUNK]->(:Chunk), 문서 순서로 (:Chunk)-[:NEXT_CHUNK]->(:Chunk). 추출이 놓친 문장도 chunk.text에 보존돼 완전 복원, 모든 entity가 출처 chunk에 연결. config.BUILD_LEXICAL_GRAPH.",
        "의미/출처 분리 규약: FROM_CHUNK/NEXT_CHUNK는 의미 카운트·고립 지표에서 제외 — 의미 연결은 typed-edge가, 원문 복원은 chunk가 책임지는 두 트랙으로 분리.",
      ],
      results: [
        "Numeric 노드 308→7(스칼라 ~301개가 속성으로 흡수), 엔티티 1410→1139·관계 2015→1667. 지급률은 엣지→속성으로 완전 이동(rel 타입 13→12). evidence는 한 건도 안 잃음.",
        "lexical 층(뷰어에 종이색 Chunk 노드로 표시): Chunk 114·FROM_CHUNK 2297·NEXT_CHUNK 113 — 모든 entity가 chunk에 연결돼 '출처 기준' 연결성 100%, 원문 완전 복원. '보험료의 자동대출납입' 섬이 chunk_014로 복원돼 ⑤항 의무·'전화=음성녹음' 정의가 한 원문 조각에서 재회.",
        "⚠ 의미(semantic)-only 고립은 83→105로 늘었다 — fold가 값-엣지만 갖던 host를 갈 곳 없게 만든 부작용 + 재추출 jitter. 뷰어에서 Chunk를 끄면 이 105가 드러나고, 켜면 FROM_CHUNK로 전부 연결된다. '의미 엣지' 고립은 의도적으로 남겨 claim 트랙에서 다룬다.",
        "※ 이 스냅샷은 fold·lexical에 더해 추출 1회 재실행을 포함(Condition 146→174 등 소폭 변동은 LLM 비결정성).",
      ],
      example: {
        title: "보험료의 자동대출납입 (원문 복원)",
        before: "'전화 -[정의된다]→ 음성녹음' 2노드 섬 + '회사는 자동대출납입 종료 15일 내 안내' 의무 문장은 그래프에 아예 없음(claim OFF로 소실, 원문 추적 불가).",
        after: "보험료의자동대출납입·전화·음성녹음이 모두 chunk_014에 FROM_CHUNK로 연결 — 제30조 ①~⑤·정의·제31조 전문이 chunk.text에 보존돼 한 글자도 안 빠지고 복원(원문 1:1 대조 검증 완료).",
      },
    },
  ],

  /* 그래프 형태의 진화 (버전 간 정성 비교) -------------------------------- */
  graphEvolution: [
    { aspect: "구조(Section)",   v01: "flat, 섹션 없음", v02: "Section 22 백본", v03: "Section 22 유지", v05: "Section 노드 제거 → 속성화(coverage 36)", v06: "동일 (속성화 유지)", v07: "동일 (속성화 유지)", v08: "동일 + 원문 Chunk 노드 추가(lexical 층, load만)" },
    { aspect: "Entity 타입 수",  v01: "7종", v02: "7종", v03: "7종", v05: "8종 (Code 추가, Date 흡수)", v06: "8종 (변화 없음)", v07: "8종 (변화 없음)", v08: "8종 (Numeric은 fold로 308→7)" },
    { aspect: "Relationship",    v01: "open(자유)", v02: "closed enum 12", v03: "closed enum 12", v05: "closed enum 13", v06: "closed enum 13 (cross-ref를 엣지로 회수)", v07: "closed enum 13 (열거 멤버 강제)", v08: "closed enum 12 (지급률 엣지→속성 fold) + 구조 FROM_CHUNK/NEXT_CHUNK" },
    { aspect: "Claim",           v01: "subject/text", v02: "subject/text", v03: "subject/text", v05: "+ claim_type(7종)·object", v06: "참고용 잎 (연결 안 함)", v07: "OFF (미추출, claims=0)", v08: "OFF (claims=0) — 산문은 chunk.text로 보존" },
    { aspect: "Claim 앵커",      v01: "102 → Document", v02: "34 → Document", v03: "44 → Document", v05: "전부 Entity (Document 제거)", v06: "전부 Entity (HAS_CLAIM)", v07: "— (claim 0)", v08: "— (claim 0)" },
    { aspect: "추출 방식",       v01: "단일 호출", v02: "단일 호출", v03: "단일 + glean", v05: "단일 + glean", v06: "2-패스(Ent+Rel→Claim), glean 제거", v07: "타입별 패스(Ent→Rel), Pass3(claim) OFF", v08: "동일(Ent→Rel, claim OFF) + resolve fold·load lexical" },
    { aspect: "연결성(섬·LCC)", v01: "고립 291", v02: "고립 275", v03: "고립 148(Section 백본이 가림)", v05: "섬 457·LCC 21.6%(de-hub로 파편화 노출)", v06: "섬 165·LCC 79.2%", v07: "섬 109·LCC 82.7%(죽은 값노드 정리)", v08: "의미층 고립 105(fold 부작용)·출처층 chunk로 100%·원문 복원" },
    { aspect: "dangling drop",   v01: "28", v02: "182", v03: "39", v05: "0", v06: "0", v07: "16", v08: "15" },
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
