import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './StarWeaverScreen.module.css';

import ConstellationBoard from '../components/ConstellationBoard.jsx';
import ConstellationCard from '../components/ConstellationCard.jsx';
import { allSkyStars } from '../game/sky.js';
import {
  EPITHET_GROUPS,
  epithetGroupFor,
  randomEpithet,
} from '../game/epithets.js';
import { downloadCardImage } from '../game/cardImage.js';
import { MAX_MY_CONSTELLATIONS } from '../game/progress.js';
import { emptySketch, isUsableSketch } from '../game/constellationSketch.js';

/** 카드가 성립하려면 최소한 이만큼은 이어야 한다. */
const MIN_LINES = 2;

const NAME_MAX = 14;
const POWER_MAX = 45;
const AUTHOR_MAX = 10;
const CUSTOM_EPITHET_MAX = 24;
const EPITHETS_AT_FIRST = 8;

/**
 * 도감에 담아 둔 성좌를 편집 화면이 읽을 수 있는 초안 모양으로 되돌린다.
 * 별은 이미 이어 두었으니 카드 채우기(2단계)부터 보여 준다.
 */
function draftFromCard(card) {
  return {
    version: 1,
    step: 2,
    lines: card.lines ?? [],
    epithet: card.card?.epithet ?? '',
    name: card.name ?? '',
    power: card.card?.power ?? '',
    author: card.author ?? '',
    sketch: isUsableSketch(card.sketch) ? card.sketch : emptySketch(),
    finishedCard: null,
  };
}

/**
 * 나만의 성좌 만들기 (ToDo.md Phase 4-B).
 *
 * 도감 5장을 다 모은 뒤에 열린다. 카드 5장을 보며 형식을 익힌 아이가
 * 같은 카드를 빈칸으로 받아 채우는 활동이다.
 *
 * 별자리는 자연이 정한 것이 아니라 **사람이 붙인 약속**이라는 단원 핵심 개념을
 * 직접 해 보며 익히는 것이 목적이다.
 *
 * 세 걸음으로 나눠 한 화면에 하나씩만 시킨다.
 *   1) 별 잇기  2) 카드 채우기  3) 완성
 */
export default function StarWeaverScreen({ onSave, onExit, onFeedback, myConstellations = [], editing = null, draft, onDraftChange, draftFailed, conflict }) {
  /*
    editing이 있으면 도감의 작품을 고치는 중이다. 만들다 만 초안 대신 그 작품에서 시작하고,
    저장할 때도 새 칸을 쓰지 않고 원래 칸을 덮어쓴다(progress.js의 saveMyConstellation).
    App이 editing마다 이 화면을 새로 마운트하므로 초기값은 한 번만 읽힌다.
  */
  const initial = editing ? draftFromCard(editing) : draft;

  const [step, setStep] = useState(initial?.step ?? 1);
  const [lines, setLines] = useState(initial?.lines ?? []);
  const [clearToken, setClearToken] = useState(0);

  const [epithet, setEpithet] = useState(initial?.epithet ?? '');
  const draftEpithetGroup = epithetGroupFor(initial?.epithet);
  const [activeEpithetGroupId, setActiveEpithetGroupId] = useState(
    draftEpithetGroup?.id ?? EPITHET_GROUPS[0].id
  );
  const [showAllEpithets, setShowAllEpithets] = useState(
    () => Boolean(draftEpithetGroup && draftEpithetGroup.items.indexOf(initial?.epithet) >= EPITHETS_AT_FIRST)
  );
  const [editingCustomEpithet, setEditingCustomEpithet] = useState(
    () => Boolean(initial?.epithet && !draftEpithetGroup)
  );
  const [customEpithet, setCustomEpithet] = useState(
    () => initial?.epithet && !draftEpithetGroup ? initial.epithet : ''
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [power, setPower] = useState(initial?.power ?? '');
  const [author, setAuthor] = useState(initial?.author ?? '');
  const [sketch, setSketch] = useState(
    () => isUsableSketch(initial?.sketch) ? initial.sketch : emptySketch()
  );
  const [drawingSketch, setDrawingSketch] = useState(false);

  const [saved, setSaved] = useState(false);
  const [finishedCard, setFinishedCard] = useState(initial?.finishedCard ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [replaceId, setReplaceId] = useState('');
  const [chosenCard, setChosenCard] = useState(null);
  /** 이미 도감에 있는 칸을 덮어쓰는 중이면 칸이 가득 차도 교체를 물을 필요가 없다. */
  const keepingId = finishedCard?.id ?? editing?.id;
  const atCapacity = myConstellations.length >= MAX_MY_CONSTELLATIONS
    && !myConstellations.some((c) => c.id === keepingId);

  useEffect(() => {
    onDraftChange?.(saved ? null : { version: 1, step, lines, epithet, name, power, author, sketch, finishedCard });
  }, [step, lines, epithet, name, power, author, sketch, finishedCard, saved, onDraftChange]);

  useEffect(() => {
    if (!conflict) return;
    setStep(2);
    setReplaceId('');
    setFinishedCard(null);
  }, [conflict]);

  const handleLines = useCallback((next) => {
    setLines((previous) => {
      if (JSON.stringify(previous) !== JSON.stringify(next) && sketch.strokes.length) {
        setSketch(emptySketch());
      }
      return next;
    });
  }, [sketch.strokes.length]);

  const clearAll = () => {
    setClearToken((n) => n + 1);
    setLines([]);
    setSketch(emptySketch());
  };

  /** 이은 선에 쓰인 별만 모아 성좌 하나를 만든다. */
  const myConstellation = useMemo(() => {
    const usedIds = new Set(lines.flat());
    const stars = allSkyStars
      .filter((s) => usedIds.has(s.id))
      // 저장할 때 화면 좌표는 필요 없다. 하늘 좌표만 있으면 언제든 다시 그린다.
      .map(({ id, ra, dec, mag, isPolaris }) => ({ id, ra, dec, mag, isPolaris }));

    return {
      id: 'my-pending',
      name: name.trim() || '이름 없는 성좌',
      aka: '내가 만든 성좌',
      latinName: '',
      isMine: true,
      stars,
      lines,
      ...(sketch.strokes.length ? { sketch } : {}),
      card: {
        epithet: epithet || '이름 없는',
        power: power.trim() || '아직 권능을 적지 않았어요.',
      },
      author: author.trim(),
    };
  }, [lines, name, epithet, power, author, sketch]);

  const enoughLines = lines.length >= MIN_LINES;
  const cardReady = Boolean(epithet && name.trim() && power.trim());
  const activeEpithetGroup = EPITHET_GROUPS.find(
    (group) => group.id === activeEpithetGroupId
  ) ?? EPITHET_GROUPS[0];
  const visibleEpithets = showAllEpithets
    ? activeEpithetGroup.items
    : activeEpithetGroup.items.slice(0, EPITHETS_AT_FIRST);

  const chooseRandomEpithet = () => {
    const chosen = randomEpithet(epithet);
    const group = epithetGroupFor(chosen);
    setEpithet(chosen);
    setEditingCustomEpithet(false);
    if (group) {
      setActiveEpithetGroupId(group.id);
      setShowAllEpithets(group.items.indexOf(chosen) >= EPITHETS_AT_FIRST);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!enoughLines || !cardReady) return;
    if (atCapacity && !replaceId) return;
    const finished = finishedCard ?? {
      ...myConstellation,
      // 고치는 중이면 도감의 같은 칸을 그대로 쓴다. 만든 날짜도 처음 만든 날로 남긴다.
      id: editing?.id ?? `my-${crypto.randomUUID()}`,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    setFinishedCard(finished);
    setDrawingSketch(false);
    setIsSaving(true);
    const ok = await onSave?.(finished, atCapacity ? replaceId : null, atCapacity ? chosenCard : null);
    setIsSaving(false);
    if (ok === 'conflict') {
      setStep(2);
      setReplaceId('');
      setChosenCard(null);
      setFinishedCard(null);
      return;
    }
    setSaved(ok === true);
    setStep(3);
  };

  const handleDownload = async () => {
    const ok = await downloadCardImage(finishedCard ?? myConstellation);
    setDownloadFailed(!ok);
  };

  return (
    <section className={styles.wrap}>
      {draftFailed && <p role="alert" className={styles.hint}>초안을 기기에 저장하지 못했어요. 이 화면을 닫기 전에 그림으로 저장해 주세요.</p>}
      {/* ---------------- 1) 별 잇기 ---------------- */}
      <div style={{ display: step === 1 ? 'contents' : 'none' }} aria-hidden={step !== 1}>
          <div className={styles.boardArea}>
            <ConstellationBoard
              constellation={{ id: 'free', name: '나만의 성좌', stars: [], lines: [] }}
              mode="free"
              initialLines={lines}
              onLinesChange={handleLines}
              clearToken={clearToken}
              onFeedback={onFeedback}
            />
          </div>

          <aside className={styles.panel}>
            <p className="eyebrow">STEP 1 / 3</p>
            <h2 className={styles.heading}>별을 이어 보세요</h2>
            <p className={styles.guide}>
              밤하늘 아무 별이나 이어서 나만의 모양을 만들어요.
              <br />
              이미 이은 선을 한 번 더 이으면 지워집니다.
            </p>

            <div className={styles.counter}>
              <span className={`mono ${styles.count}`}>{lines.length}</span>
              <span className={styles.countLabel}>개 선</span>
            </div>

            {!enoughLines && (
              <p className={styles.hint}>선을 {MIN_LINES}개 이상 이어 주세요.</p>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className="btnGhost"
                onClick={clearAll}
                disabled={lines.length === 0}
              >
                전체 지우기
              </button>
              <button
                type="button"
                className="btnPrimary"
                onClick={() => setStep(2)}
                disabled={!enoughLines}
              >
                다음
              </button>
            </div>

            <button type="button" className={styles.exitLink} onClick={onExit}>
              그만두고 도감으로
            </button>
          </aside>
      </div>

      {/* ---------------- 2) 카드 채우기 ---------------- */}
      {step === 2 && (
        <>
          <div className={styles.cardArea}>
            <ConstellationCard
              constellation={myConstellation}
              large
              editableSketch={drawingSketch}
              onSketchChange={setSketch}
            />
            <section className={styles.sketchTools} aria-label="별자리 상상화 도구">
              <div className={styles.sketchIntro}>
                <span className={styles.optional}>선택 활동</span>
                <strong>별자리 상상화</strong>
                <p>별의 배열에서 떠오른 모습을 선으로 표현해 보세요.</p>
              </div>
              <div className={styles.sketchActions}>
                <button
                  type="button"
                  className={drawingSketch ? 'btnPrimary' : 'btnGhost'}
                  onClick={() => setDrawingSketch((value) => !value)}
                >
                  {drawingSketch ? '그리기 마치기' : '상상선 그리기'}
                </button>
                <button
                  type="button"
                  className="btnGhost"
                  disabled={!sketch.strokes.length}
                  onClick={() => setSketch({ ...sketch, strokes: sketch.strokes.slice(0, -1) })}
                >
                  실행 취소
                </button>
                <button
                  type="button"
                  className="btnGhost"
                  disabled={!sketch.strokes.length}
                  onClick={() => setSketch(emptySketch())}
                >
                  그림 지우기
                </button>
              </div>
              {drawingSketch && <p className={styles.drawingHint}>왼쪽 카드의 별자리 위에 손가락이나 마우스로 그려 보세요.</p>}
            </section>
          </div>

          <aside className={styles.panel}>
            <p className="eyebrow">STEP 2 / 3</p>
            <h2 className={styles.heading}>{editing ? '카드를 고쳐 주세요' : '카드를 채워 주세요'}</h2>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>
                칭호 — 어떤 성좌인가요?
                <button type="button" className={styles.pickBtn} onClick={chooseRandomEpithet}>
                  {epithet ? '다시 골라 줘' : '골라 줘'}
                </button>
              </span>
              <div className={styles.epithetPicker}>
                <p className={styles.selectedEpithet} aria-live="polite">
                  {epithet ? `「 ${epithet} 」` : '칭호를 골라 주세요'}
                </p>
                <div className={styles.epithetTabs} role="tablist" aria-label="칭호 종류">
                  {EPITHET_GROUPS.map((group) => (
                    <button
                      type="button"
                      role="tab"
                      id={`epithet-tab-${group.id}`}
                      aria-controls="epithet-options"
                      aria-selected={activeEpithetGroup.id === group.id}
                      className={`${styles.epithetTab} ${activeEpithetGroup.id === group.id ? styles.epithetTabOn : ''}`}
                      key={group.id}
                      onClick={() => {
                        setActiveEpithetGroupId(group.id);
                        setShowAllEpithets(false);
                        setEditingCustomEpithet(false);
                      }}
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
                <div
                  id="epithet-options"
                  className={styles.epithetOptions}
                  role="tabpanel"
                  aria-labelledby={`epithet-tab-${activeEpithetGroup.id}`}
                >
                  <p className={styles.groupDescription}>{activeEpithetGroup.description}</p>
                  <div className={styles.chips}>
                    {visibleEpithets.map((item) => (
                      <button
                        type="button"
                        key={item}
                        className={`${styles.chip} ${epithet === item ? styles.chipOn : ''}`}
                        onClick={() => {
                          setEpithet(item);
                          setEditingCustomEpithet(false);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <div className={styles.epithetActions}>
                    <button
                      type="button"
                      className={styles.moreEpithets}
                      aria-expanded={showAllEpithets}
                      onClick={() => setShowAllEpithets((value) => !value)}
                    >
                      {showAllEpithets ? '간단히 보기' : '8개 더 보기'}
                    </button>
                    <button
                      type="button"
                      className={styles.moreEpithets}
                      aria-expanded={editingCustomEpithet}
                      onClick={() => setEditingCustomEpithet((value) => !value)}
                    >
                      직접 써 보기
                    </button>
                  </div>
                  {editingCustomEpithet && (
                    <label className={styles.customEpithet}>
                      <span className="srOnly">직접 쓴 칭호</span>
                      <input
                        className={styles.input}
                        value={customEpithet}
                        maxLength={CUSTOM_EPITHET_MAX}
                        placeholder="예) 달의 비밀을 간직한"
                        onChange={(event) => {
                          const value = event.target.value;
                          setCustomEpithet(value);
                          setEpithet(value);
                        }}
                      />
                      <span className={`mono ${styles.countTiny}`}>
                        {customEpithet.length} / {CUSTOM_EPITHET_MAX}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>이름</span>
              <input
                className={styles.input}
                value={name}
                maxLength={NAME_MAX}
                placeholder="예) 용감한 고양이"
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                권능 — 이 성좌는 무엇을 할 수 있나요?
              </span>
              <input
                className={styles.input}
                value={power}
                maxLength={POWER_MAX}
                placeholder="예) 무서운 꿈을 쫓아내 준다"
                onChange={(e) => setPower(e.target.value)}
              />
              <span className={`mono ${styles.countTiny}`}>
                {power.length} / {POWER_MAX}
              </span>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>만든 사람 (안 써도 됩니다)</span>
              <input
                className={styles.input}
                value={author}
                maxLength={AUTHOR_MAX}
                placeholder="예) 4학년 3반 김하늘"
                onChange={(e) => setAuthor(e.target.value)}
              />
            </label>

            {atCapacity && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>도감 {MAX_MY_CONSTELLATIONS}칸이 가득 찼어요. 교체할 작품을 골라 주세요.</span>
                <select className={styles.input} value={replaceId} onChange={(event) => {
                  setReplaceId(event.target.value);
                  setChosenCard(myConstellations.find((card) => card.id === event.target.value) ?? null);
                }}>
                  <option value="">기존 작품 유지</option>
                  {myConstellations.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {replaceId && <span className={styles.hint}>완성하기를 누르면 선택한 작품을 새 작품으로 교체해요.</span>}
                <button type="button" className="btnGhost" onClick={handleDownload}>새 작품을 그림으로 저장하기</button>
              </label>
            )}

            <div className={styles.actions}>
              <button type="button" className="btnGhost" onClick={() => { setDrawingSketch(false); setStep(1); }}>
                별 다시 잇기
              </button>
              <button type="button" className="btnPrimary" onClick={handleSave} disabled={isSaving || !cardReady || (atCapacity && !replaceId)}>
                {editing ? '고친 내용 저장하기' : '성좌 완성하기'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ---------------- 3) 완성 ---------------- */}
      {step === 3 && (
        <>
          <div className={styles.cardArea}>
            <ConstellationCard constellation={myConstellation} large />
          </div>

          <aside className={styles.panel}>
            <p className="eyebrow">STEP 3 / 3</p>
            <h2 className={styles.heading}>{editing ? '성좌를 고쳤어요' : '성좌가 태어났어요'}</h2>
            <p className={styles.guide}>
              {saved
                ? (editing ? '도감에 고친 내용을 담았어요. ' : '도감 마지막 칸에 담았어요. ')
                : '기기에 저장하지 못했어요. 이 화면에서 다시 저장하거나 그림으로 내려받아 주세요. '}
              그림으로 저장하면 선생님께 내거나 인쇄해서 붙일 수 있어요.
            </p>

            {downloadFailed && (
              <p className={styles.hint}>
                그림 저장이 되지 않았어요. 다른 브라우저에서 다시 해 보세요.
              </p>
            )}

            <div className={styles.actions}>
              {!saved && <>
                <button type="button" className="btnPrimary" onClick={handleSave} disabled={isSaving || (atCapacity && !replaceId)}>다시 저장하기</button>
                <button type="button" className="btnGhost" onClick={() => { setStep(2); setFinishedCard(null); }}>카드 수정하기</button>
              </>}
              <button type="button" className="btnPrimary" onClick={handleDownload}>
                그림으로 저장하기
              </button>
              <button type="button" className="btnGhost" onClick={onExit}>
                도감 보기
              </button>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}
