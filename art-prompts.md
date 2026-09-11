# 신화 삽화 프롬프트 — 별자리 5개 · 총 29컷

| 별자리 | 신화 장면 | 별자리 컷 | 파일 이름 |
|---|---|---|---|
| 작은곰자리 | 5 | 1 | `ursa-minor-1~6` |
| 큰곰자리 | 5 | 1 | `ursa-major-1~6` |
| 카시오페이아자리 | 5 | 1 | `cassiopeia-1~6` |
| 케페우스자리 | 4 | 1 | `cepheus-1~5` |
| 용자리 | 5 | 1 | `draco-1~6` |

> 화풍: **옛 성도(星圖) 판화풍** — 17세기 별자리 지도처럼, 깊은 남색 밤하늘 위에
> 금빛 판화 선으로 신화 인물을 그린다. 앱의 다크 네이비 + 골드 색감과 그대로 맞물리고,
> 실제 옛날 성도가 이렇게 생겼기 때문에 교육적으로도 진짜다.
>
> 아트 디렉션은 기존 스타일 카드에 맞는 것이 없어 처음부터 새로 구성했다.

---

## 쓰는 방법

1. ChatGPT(또는 쓰는 이미지 생성 도구)를 연다.
2. 아래 **`[공통 화풍]` 전체를 먼저 붙여넣고**, 이어서 **`SCENE 1`** 문단을 붙여 한 장 뽑는다.
3. 첫 장이 마음에 들면, **같은 대화창에서** 그 별자리의 나머지 SCENE을 이어서 요청한다.
   → 같은 대화 안에서 이어 뽑아야 한 별자리 안에서 화풍이 유지된다.
   → 별자리가 바뀔 때는 새 대화창을 열고 `[공통 화풍]`부터 다시 붙이면 된다.
4. 마음에 안 들면 "같은 화풍으로 다시" 라고 요청한다.

### 뽑을 때 챙길 것

- **정사각형(1:1)** 으로 요청한다. 앱에서 정사각형 칸에 들어간다.
- **배경은 투명이 아니라 불투명한 남색**이어야 한다. 앱 카드 안에 얹히기 때문이다.
- **글자를 넣지 않는다.** AI가 알 수 없는 글자를 그려 넣는 일이 흔하다.
- 저장 형식은 **PNG · JPG 아무거나** 됩니다. 앱이 알아서 찾습니다. 크기는 1024×1024 권장.

---

## 두 종류의 컷

| 종류 | 내용 |
|---|---|
| **신화 장면** | 이야기를 그린 보통 삽화. 별을 그리지 않는다 |
| **★ 별자리 컷** | 이야기 **맨 마지막 한 장**. 실제 별자리 위에 옛사람의 상상도를 얹은 그림 |

### ★ 별자리 컷이란

옛날 성도에 실려 있던 바로 그 그림입니다 — **진짜 별 배치 위에 곰·왕비·용의 몸을
겹쳐 그린 것.** 아이가 퍼즐에서 이어 본 그 모양이 그대로 나오고, 이야기가
"오늘 밤 직접 찾아보자"로 마무리됩니다.

만드는 순서는 이렇습니다.

1. 앱에서 **별자리 참고 그림**을 내려받는다 (아래 설명)
2. AI에게 그 그림을 **함께 올려 주고**, "이 별 배치에 맞춰 몸을 그려 달라"고 한다
3. AI는 **몸의 윤곽선만** 그린다 (별은 그리지 않는다)
4. 앱이 그 위에 정확한 별자리를 다시 얹는다

### 별자리 참고 그림 내려받기

1. 주소 끝에 `?tune=1` 을 붙여 엽니다 → `http://localhost:5173/?tune=1`
2. 그 별자리의 **마지막 컷**으로 넘깁니다
3. 오른쪽 판 맨 아래 **`○○자리 내려받기`** 를 누릅니다
4. 받은 `참고-○○자리.png` 를 AI 대화창에 올리고 프롬프트를 붙입니다

> **왜 AI에게 별을 그리게 하지 않나**
> 이미지 생성기는 별을 정확한 위치에 찍지 못합니다. 개수가 늘거나 비율이 틀어진
> 별자리를 그려 버립니다. 아이들은 바로 앞 퍼즐에서 실제 좌표로 찍은 정확한 별자리를
> 이어 놓고 오기 때문에, 그림에서 다른 모양을 보면 그대로 오개념이 됩니다.
> 그래서 **별은 전부 앱이 그립니다.** AI는 몸만 그립니다.

---

## [공통 화풍] — 매번 앞에 붙일 것

```
A 17th-century celestial atlas engraving, reimagined in gold on deep midnight navy.

STYLE: Fine copperplate-engraved linework and delicate cross-hatching rendered in warm
antique gold (#E8C158) on an opaque deep navy ground (#0B0C1F). Classical Greco-Roman
mythological figures drawn in the manner of an old star map — confident engraved
contours, hatching for volume. Square 1:1 composition, subject centred, generous dark
margin around the edges. Gold is the only accent colour; no other hues. Gentle,
reverent, storybook-mythic mood suitable for a children's classroom.

MUST: All figures fully clothed in flowing classical robes, chitons or tunics.

MUST NOT — CONTENT: nudity, blood, wounds, a weapon aimed at a person, frightening or
grotesque expressions, text, lettering, numerals, signatures, decorative border frames,
logos.

MUST NOT — STARS: **Never draw a constellation.** No star patterns, no connect-the-dots
figures, no lines joining stars, no groups of stars arranged in a recognisable shape, no
star markers placed on a creature's body. Loose scattered star dust in the background is
fine, but it must read as random speckling only. The real constellations are drawn
separately and laid over the picture afterwards, so any pattern the generator invents
would be in the wrong place.
```

---

# 작은곰자리 (Ursa Minor) 신화 5컷 + 별자리 컷 1 — "하늘에 걸린 작은 국자"

> 파일 이름: `ursa-minor-1.png` ~ `ursa-minor-6.png`

## SCENE 1 — 곰이 된 엄마 칼리스토

> 슬라이드 글: "아주 먼 옛날, 깊은 숲에 곰으로 변해 버린 엄마가 살았어요. 이름은 칼리스토였습니다."

```
SCENE: A gentle she-bear stands upright among tall pines and cypresses in a night
forest, her posture soft and sorrowful rather than threatening. Faintly overlapping her
body, the translucent engraved outline of a young woman in a long classical robe shows
that she was once human. The night sky between the branches is left plain and dark.
```

**파일 이름:** `ursa-minor-1.png`

---

## SCENE 2 — 마주친 아들 아르카스

> 슬라이드 글: "어느 날 사냥을 나온 아들 아르카스가 그 곰과 마주쳤어요. 아들은 그 곰이 자기 엄마인 줄 전혀 몰랐지요."

```
SCENE: A young hunter in a short classical tunic and sandals stands at the edge of a
moonlit forest clearing. His bow hangs low and loose at his side and the arrow is still
in its quiver — he is not aiming. Across the clearing the she-bear stands perfectly
still, looking back at him. Both are frozen in a quiet moment of recognition, with a
wide stretch of dark forest floor between them.
```

**파일 이름:** `ursa-minor-2.png`

---

## SCENE 3 — 하늘로 올려 보내는 제우스

> 슬라이드 글: "하늘에서 이를 본 신 제우스는 아들이 활을 쏘기 전에 둘을 한꺼번에 하늘로 올려 보냈어요."

```
SCENE: High in the upper third of the frame, Zeus — a bearded figure in a flowing robe,
seated among engraved scrolling clouds — reaches one open hand downward. Below him a
spiralling ribbon of gold light lifts the she-bear and the young hunter gently off the
forest floor, their robes and fur streaming upward. The forest shrinks away beneath
them.
```

**파일 이름:** `ursa-minor-3.png`

---

## SCENE 4 — 큰곰자리와 작은곰자리가 되다

> 슬라이드 글: "그렇게 엄마는 큰곰자리가 되고, 아들은 작은곰자리가 되었답니다."

```
SCENE: Two bears float in an empty night sky, drawn as translucent gold engraved
outlines — one large bear and one smaller bear, side by side and centred, together
filling most of the frame. Their bodies are pure line drawing with hatching, no fill.
Along the very bottom edge, a tiny dark silhouette of forest and hills. The sky itself
is completely plain and empty — no stars of any kind.
```

**파일 이름:** `ursa-minor-4.png`

---

## SCENE 5 — 꼬리 끝의 북극성

> 슬라이드 글: "작은곰자리 꼬리 끝에서 반짝이는 별이 바로 북극성이에요. 지금도 길 잃은 사람에게 북쪽을 알려주고 있지요."

```
SCENE: A small bear drawn as a translucent gold engraved outline fills the upper two
thirds of the frame, centred. Far below at the very bottom edge, a tiny traveller with a
walking staff stands on a night road, head tilted up toward the bear. The sky between
them is completely plain and empty — no stars of any kind.
```

**파일 이름:** `ursa-minor-5.png`

---



---

## ★ 별자리 컷 — 작은곰자리 (Ursa Minor)

> 슬라이드 글: "이것이 밤하늘의 작은곰자리예요. 꼬리 끝 북극성을 오늘 밤 찾아보세요."
>
> **앱에서 `참고-작은곰자리.png` 를 내려받아 AI 대화창에 함께 올린 뒤** 아래를 붙여넣습니다.

```
SCENE: A small bear seen from the side, walking, drawn over the attached star pattern.
Its long tail curves upward and away from the body and follows the three stars of the
handle, with the very tip of the tail resting on the single brightest marked point. The
four remaining stars sit inside its hindquarters and back. The bear's head is turned
slightly toward the viewer with a gentle expression.

REFERENCE: The attached image shows the real positions of this constellation's stars.
Lay the figure over exactly that arrangement — the marked points must fall on the parts of
the body described below. Match the proportions and the tilt of the attached pattern.

DRAW: Only the figure's outline, as a clean single-weight engraved gold contour with light
hatching inside. No solid fill, so the dark sky shows through the body.

DO NOT DRAW: any stars, dots, sparkles or connecting lines. Leave the sky completely plain
and dark. The stars are added afterwards by the app.
```

**파일 이름:** `ursa-minor-6.png`

---
---

# 큰곰자리 (Ursa Major) 신화 5컷 + 별자리 컷 1 — "바다로 내려가지 못한 곰"

> 파일 이름: `ursa-major-1.png` ~ `ursa-major-6.png`
> 위 **`[공통 화풍]`** 블록을 매번 앞에 붙일 것.

## SCENE 1 — 사냥꾼이던 시절의 칼리스토

> 슬라이드 글: "칼리스토는 원래 숲을 누비던 씩씩한 사냥꾼이었어요. 여신 아르테미스를 따르며 지냈지요."

```
SCENE: A confident young huntress in a knee-length classical chiton and sandals strides
through a night forest, a quiver on her back and a hound trotting at her heel. Her chin
is lifted and her stride is strong. Behind her, the goddess Artemis stands half-hidden
among the trees as a taller translucent engraved figure with a crescent moon above her
brow. The night sky between the branches is left plain and dark.
```

## SCENE 2 — 곰으로 변하다

> 슬라이드 글: "그러다 여신 헤라의 노여움을 사고 말았어요. 칼리스토는 커다란 곰으로 변해 버렸답니다."

```
SCENE: The same huntress mid-transformation in a forest clearing, kneeling with her arms
outstretched. Her human form is drawn in fine gold engraved line and dissolves outward
into the larger translucent outline of a great she-bear that overlaps and surrounds her.
High above, the silhouette of the goddess Hera in a long robe and a simple diadem turns
away among engraved clouds. Sorrowful and quiet — no pain, no grimace, no distress.
```

## SCENE 3 — 하늘의 큰 국자가 되다

> 슬라이드 글: "훗날 제우스가 칼리스토를 하늘로 올려 큰곰자리로 만들어 주었어요. 일곱 개 별이 커다란 국자 모양을 이루었지요."

```
SCENE: A great bear floats in an open night sky, drawn as a translucent gold engraved
outline seen from the side, centred and filling most of the frame. Her body is pure line
drawing with hatching, no fill. The forest is only a thin dark band along the very
bottom edge. The sky is completely plain and empty — no stars of any kind.
```

## SCENE 4 — 바다에 닿지 못하게 되다

> 슬라이드 글: "그런데 헤라는 그것마저 못마땅했어요. 큰곰이 바닷물에 몸을 담그고 쉬지 못하게 했답니다."

```
SCENE: The lower half of the frame is a calm engraved sea of stylised gold wave scrolls.
A great bear drawn as a translucent gold engraved outline hovers just above the surface
of the water, one paw reaching down but never touching it, held back by a thin arc of
gold light across the waterline. Hera stands small at the horizon with one hand raised
in refusal. Wistful and calm, no struggle. The sky above is plain and empty — no stars.
```

## SCENE 5 — 지지 않고 도는 북두칠성

> 슬라이드 글: "그래서 북두칠성은 바다 아래로 내려가지 않아요. 밤새 북극성 둘레를 빙 돌기만 하지요."

```
SCENE: A wide empty night sky above a low dark horizon line at the very bottom. A single
large gold circular orbit path is drawn across the sky as a fine dotted arc, with small
arrowheads on the arc showing the direction of travel. The centre of the circle is left
completely bare. No bear, no figures, no stars of any kind — only the dark sky, the
dotted circle and the low horizon.
```


---

## ★ 별자리 컷 — 큰곰자리 (Ursa Major)

> 슬라이드 글: "이것이 밤하늘의 큰곰자리예요. 국자 끝 두 별을 이어 늘이면 북극성이 나옵니다."
>
> **앱에서 `참고-큰곰자리.png` 를 내려받아 AI 대화창에 함께 올린 뒤** 아래를 붙여넣습니다.

```
SCENE: A great bear seen from the side, walking, drawn over the attached star pattern.
The four stars of the dipper's bowl sit across its hindquarters and back, and the three
stars of the handle run out along its long raised tail. Sturdy legs, heavy shoulders, a
calm lowered head.

REFERENCE: The attached image shows the real positions of this constellation's stars.
Lay the figure over exactly that arrangement — the marked points must fall on the parts of
the body described below. Match the proportions and the tilt of the attached pattern.

DRAW: Only the figure's outline, as a clean single-weight engraved gold contour with light
hatching inside. No solid fill, so the dark sky shows through the body.

DO NOT DRAW: any stars, dots, sparkles or connecting lines. Leave the sky completely plain
and dark. The stars are added afterwards by the app.
```

**파일 이름:** `ursa-major-6.png`

---
---

# 카시오페이아자리 (Cassiopeia) 신화 5컷 + 별자리 컷 1 — "의자에 앉은 왕비"

> 파일 이름: `cassiopeia-1.png` ~ `cassiopeia-6.png`

## SCENE 1 — 왕비와 딸

> 슬라이드 글: "아주 먼 옛날, 바닷가 나라에 카시오페이아라는 왕비가 살았어요. 아름다운 딸 안드로메다를 무척 자랑스러워했지요."

```
SCENE: A queen in a long flowing robe and a simple engraved crown sits on a high-backed
throne on a palace terrace overlooking a night sea. Her daughter, a young woman in a
long draped gown, stands beside the throne while the queen rests a proud hand on her
shoulder. Engraved columns frame them, and the sky over the distant water is left plain
and dark.
```

## SCENE 2 — 지나친 말 한마디

> 슬라이드 글: 왕비가 "내 딸은 바다의 요정들보다도 아름답단다" 하고 자랑하는 장면

```
SCENE: The queen stands at the terrace balustrade with one arm raised in a wide boastful
gesture toward the sea, her robe streaming. Below in the water, several sea nymphs rise
only to their shoulders above stylised engraved waves and look up at her, calm and
unimpressed. The expression on the queen is proud, never cruel.
```

## SCENE 3 — 노한 바다의 신

> 슬라이드 글: "그 말을 들은 바다의 신 포세이돈이 크게 노했어요. 바다에서 커다란 괴물을 보냈지요."

```
SCENE: Poseidon rises waist-deep from a storm-tossed engraved sea, a bearded figure in a
flowing robe holding a trident upright at his side, not thrust forward. Around him the
water coils into tall gold wave scrolls. In the far distance a large sea creature shows
only its smooth serpentine back arcing above the surface — a graceful silhouette, with
no teeth, no jaws and no menacing face.
```

## SCENE 4 — 페르세우스가 구해내다

> 슬라이드 글: "다행히 영웅 페르세우스가 나타나 안드로메다를 구했어요. 하지만 왕비는 벌을 피하지 못했답니다."

```
SCENE: A young hero in a short tunic and winged sandals hovers just above the sea beside
a rocky shore, one hand extended to help Andromeda step down from the rocks to safety.
Behind them the water is already settling into calm engraved ripples and the creature is
gone. A moment of rescue and relief — no fight, no raised weapon, no creature in frame.
```

## SCENE 5 — 하늘에 올려진 왕비

> 슬라이드 글: "왕비는 의자에 앉은 채로 하늘에 올려졌어요. 하루의 절반은 거꾸로 매달린 채 북극성 둘레를 돈답니다."

```
SCENE: The queen, still seated on her high-backed throne, floats in an open night sky,
drawn as a translucent gold engraved outline, centred and filling most of the frame. The
throne is tilted well past sideways so she is nearly upside down, and she holds her
posture with quiet dignity. Her robes fall upward. The sky around her is completely
plain and empty — no stars of any kind.
```


---

## ★ 별자리 컷 — 카시오페이아자리 (Cassiopeia)

> 슬라이드 글: "이것이 밤하늘의 카시오페이아자리예요. W자를 찾으면 북극성도 찾을 수 있어요."
>
> **앱에서 `참고-카시오페이아자리.png` 를 내려받아 AI 대화창에 함께 올린 뒤** 아래를 붙여넣습니다.

```
SCENE: A queen in a long flowing robe and a simple crown, seated on a high-backed
throne, drawn over the attached star pattern. The zig-zag of five marked points runs
through her figure — the outer points at the top of the throne back and at her feet, the
middle points at her raised hand, her lap and her knee. She sits with quiet dignity,
tilted at the same angle as the attached pattern.

REFERENCE: The attached image shows the real positions of this constellation's stars.
Lay the figure over exactly that arrangement — the marked points must fall on the parts of
the body described below. Match the proportions and the tilt of the attached pattern.

DRAW: Only the figure's outline, as a clean single-weight engraved gold contour with light
hatching inside. No solid fill, so the dark sky shows through the body.

DO NOT DRAW: any stars, dots, sparkles or connecting lines. Leave the sky completely plain
and dark. The stars are added afterwards by the app.
```

**파일 이름:** `cassiopeia-6.png`

---
---

# 케페우스자리 (Cepheus) 신화 4컷 + 별자리 컷 1 — "뾰족지붕 집이 된 왕"

> 파일 이름: `cepheus-1.png` ~ `cepheus-5.png`

## SCENE 1 — 왕 케페우스

> 슬라이드 글: "케페우스는 카시오페이아 왕비의 남편이자 안드로메다의 아버지인 왕이었어요."

```
SCENE: A dignified bearded king in a long robe and a tall engraved crown stands at the
centre of a palace hall, hands resting calmly before him. To one side stands the queen
on her throne, to the other his young daughter; both are drawn smaller and lighter so
the king holds the centre. Engraved columns and a plain dark night window stand behind
them.
```

## SCENE 2 — 딸을 지키려는 아버지

> 슬라이드 글: "바다 괴물이 나라를 덮치자, 왕은 딸을 지키려고 온 힘을 다했어요."

```
SCENE: The king stands on a windswept cliff above a rough engraved sea at night, his
robe and beard blown sideways, both arms spread wide in a protective stance in front of
his daughter, who shelters behind him. He is shielding, not fighting — no weapon in
hand. The sea below is turbulent gold wave scrolls; nothing is visible in the water.
```

## SCENE 3 — 되찾은 평화

> 슬라이드 글: "페르세우스가 괴물을 물리치고 안드로메다를 구한 뒤, 나라에는 다시 평화가 찾아왔지요."

```
SCENE: A quiet shore late at night. The sea has flattened into gentle engraved ripples.
The king stands with one arm around the shoulders of his daughter, the queen beside
them, and the young hero a little apart with his head bowed in farewell. Behind them the
small city on the hill glows with a few warm gold windows. Calm, grateful, still.
```

## SCENE 4 — 하늘의 작은 집

> 슬라이드 글: "왕도 하늘로 올라가 왕비 곁에 자리를 잡았어요. 뾰족한 지붕이 있는 작은 집처럼 보이는 별자리랍니다."

```
SCENE: The king floats in an open night sky, drawn as a translucent gold engraved
outline standing upright, centred and filling most of the frame, his tall crown pointing
straight upward. His body is pure line drawing with hatching, no fill. Far to one side,
the faint outline of the seated queen on her throne is just visible. The sky is
completely plain and empty — no stars of any kind.
```


---

## ★ 별자리 컷 — 케페우스자리 (Cepheus)

> 슬라이드 글: "이것이 밤하늘의 케페우스자리예요. 왕비 옆에서 뾰족지붕 집을 찾아보세요."
>
> **앱에서 `참고-케페우스자리.png` 를 내려받아 AI 대화창에 함께 올린 뒤** 아래를 붙여넣습니다.

```
SCENE: A bearded king in a long robe and a tall pointed crown, standing upright, drawn
over the attached star pattern. The topmost marked point sits at the tip of his crown, the
two middle points at his shoulders, and the two lowest points at his feet — so the five
points together read as a small house with a steep pointed roof. His arms rest calmly at
his sides.

REFERENCE: The attached image shows the real positions of this constellation's stars.
Lay the figure over exactly that arrangement — the marked points must fall on the parts of
the body described below. Match the proportions and the tilt of the attached pattern.

DRAW: Only the figure's outline, as a clean single-weight engraved gold contour with light
hatching inside. No solid fill, so the dark sky shows through the body.

DO NOT DRAW: any stars, dots, sparkles or connecting lines. Leave the sky completely plain
and dark. The stars are added afterwards by the app.
```

**파일 이름:** `cepheus-5.png`

---
---

# 용자리 (Draco) 신화 5컷 + 별자리 컷 1 — "황금 사과를 지킨 용"

> 파일 이름: `draco-1.png` ~ `draco-6.png`

## SCENE 1 — 황금 사과나무

> 슬라이드 글: "세상의 서쪽 끝에는 황금 사과가 열리는 나무가 있었어요. 무엇과도 바꿀 수 없는 귀한 나무였지요."

```
SCENE: A single ancient tree stands alone in a walled garden at the western edge of the
world at night. Round golden apples hang among its engraved leaves, drawn as solid
engraved gold fruit. Low stone walls and distant sea cliffs frame the garden. The sky
above is plain and dark. No figures present — the tree alone holds the centre.
```

## SCENE 2 — 나무를 지키는 용 라돈

> 슬라이드 글: "그 나무를 지키던 것은 라돈이라는 커다란 용이었어요. 밤에도 눈을 감지 않고 나무를 감싸고 있었답니다."

```
SCENE: A long serpentine dragon coils several times around the trunk and lower branches
of the golden apple tree, its body a graceful engraved gold line with fine scale
hatching. Its head rests near the top of the tree, eyes open and watchful but calm and
gentle — no bared teeth, no snarl, no fire. The sky behind the branches is plain and
dark, with no stars.
```

## SCENE 3 — 찾아온 헤라클레스

> 슬라이드 글: "어느 날 힘센 영웅 헤라클레스가 황금 사과를 얻으러 그곳을 찾아왔어요."

```
SCENE: A powerfully built hero in a short tunic with a lion skin over his shoulders
stands at the open gate of the garden, looking up toward the apple tree. His club rests
head-down on the ground beside him, held loosely. Across the garden the coiled dragon
lifts its head to meet his gaze. Two figures regarding each other across a wide quiet
space — no confrontation, no raised weapon.
```

## SCENE 4 — 사과는 떠나고

> 슬라이드 글: "헤라클레스는 사과를 가지고 떠났지만, 헤라는 끝까지 나무를 지킨 라돈을 잊지 않았어요."

```
SCENE: The hero walks away along a cliff path at night, small in the frame, carrying
three golden apples. Behind him the tree stands quiet with the dragon still coiled
around it, head lowered and resting. Above, the goddess Hera looks down from among
engraved cloud scrolls with one hand pressed to her heart. Melancholy and tender.
```

## SCENE 5 — 하늘을 휘감은 용

> 슬라이드 글: "그래서 라돈을 하늘에 올려 주었어요. 지금도 큰곰과 작은곰 사이를 길게 휘감고 있답니다."

```
SCENE: A long dragon winds in a great S-curve across the whole night sky, drawn as a
translucent gold engraved outline with fine scale hatching, filling the square evenly.
On either side of the winding body, the fainter outlines of a large bear and a small
bear are visible, the dragon curling between and around them. All three are pure line
drawing, no fill. The sky is completely plain and empty — no stars of any kind.
```

---


---

## ★ 별자리 컷 — 용자리 (Draco)

> 슬라이드 글: "이것이 밤하늘의 용자리예요. 큰곰과 작은곰 사이를 길게 따라가 보세요."
>
> **앱에서 `참고-용자리.png` 를 내려받아 AI 대화창에 함께 올린 뒤** 아래를 붙여넣습니다.

```
SCENE: A long serpentine dragon drawn over the attached star pattern, its body winding
along the whole chain of marked points in one continuous S-curve. The four points that form
a small quadrilateral at one end of the chain sit inside its squared head; the far end of
the chain is the tip of its tail. Fine scale hatching along the body, small folded wings,
a calm watchful eye — no bared teeth, no fire.

REFERENCE: The attached image shows the real positions of this constellation's stars.
Lay the figure over exactly that arrangement — the marked points must fall on the parts of
the body described below. Match the proportions and the tilt of the attached pattern.

DRAW: Only the figure's outline, as a clean single-weight engraved gold contour with light
hatching inside. No solid fill, so the dark sky shows through the body.

DO NOT DRAW: any stars, dots, sparkles or connecting lines. Leave the sky completely plain
and dark. The stars are added afterwards by the app.
```

**파일 이름:** `draco-6.png`

## 저장하는 곳

```
C:\Users\26_Gorani\Desktop\star-map\public\art\
```

각 컷의 파일 이름 그대로 이 폴더에 넣고 브라우저를 새로고침하면 바로 나옵니다.
파일이 없는 컷은 별자리 모양 그림이 자동으로 대신 나오므로, **한 장씩 채워 넣어도 됩니다.**
