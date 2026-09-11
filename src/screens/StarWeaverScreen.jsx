import { useCallback, useMemo, useState } from 'react';
import styles from './StarWeaverScreen.module.css';

import ConstellationBoard from '../components/ConstellationBoard.jsx';
import ConstellationCard from '../components/ConstellationCard.jsx';
import { allSkyStars } from '../game/sky.js';
import { EPITHET_GROUPS, randomEpithet } from '../game/epithets.js';
import { downloadCardImage } from '../game/cardImage.js';

/** 카드가 성립하려면 최소한 이만큼은 이어야 한다. */
const MIN_LINES = 2;

const NAME_MAX = 14;
const POWER_MAX = 45;
const AUTHOR_MAX = 10;

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
export default function StarWeaverScreen({ onSave, onExit, onFeedback }) {
  const [step, setStep] = useState(1);
  const [lines, setLines] = useState([]);
  const [clearToken, setClearToken] = useState(0);

  const [epithet, setEpithet] = useState('');
  const [name, setName] = useState('');
  const [power, setPower] = useState('');
  const [author, setAuthor] = useState('');

  const [saved, setSaved] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  const handleLines = useCallback((next) => setLines(next), []);

  const clearAll = () => {
    setClearToken((n) => n + 1);
    setLines([]);
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
      card: {
        epithet: epithet || '이름 없는',
        power: power.trim() || '아직 권능을 적지 않았어요.',
      },
      author: author.trim(),
    };
  }, [lines, name, epithet, power, author]);

  const enoughLines = lines.length >= MIN_LINES;
  const cardReady = Boolean(epithet && name.trim() && power.trim());

  const handleSave = () => {
    const finished = {
      ...myConstellation,
      id: `my-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    onSave?.(finished);
    setSaved(true);
    setStep(3);
  };

  const handleDownload = async () => {
    const ok = await downloadCardImage(myConstellation);
    setDownloadFailed(!ok);
  };

  return (
    <section className={styles.wrap}>
      {/* ---------------- 1) 별 잇기 ---------------- */}
      {step === 1 && (
        <>
          <div className={styles.boardArea}>
            <ConstellationBoard
              constellation={{ id: 'free', name: '나만의 성좌', stars: [], lines: [] }}
              mode="free"
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
        </>
      )}

      {/* ---------------- 2) 카드 채우기 ---------------- */}
      {step === 2 && (
        <>
          <div className={styles.cardArea}>
            <ConstellationCard constellation={myConstellation} large />
          </div>

          <aside className={styles.panel}>
            <p className="eyebrow">STEP 2 / 3</p>
            <h2 className={styles.heading}>카드를 채워 주세요</h2>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>
                칭호 — 어떤 성좌인가요?
                <button type="button" className={styles.pickBtn} onClick={() => setEpithet(randomEpithet())}>
                  골라 줘
                </button>
              </span>
              <div className={styles.epithets}>
                {EPITHET_GROUPS.map((group) => (
                  <div key={group.label} className={styles.epithetGroup}>
                    <p className={styles.groupLabel}>{group.label}</p>
                    <div className={styles.chips}>
                      {group.items.map((item) => (
                        <button
                          type="button"
                          key={item}
                          className={`${styles.chip} ${epithet === item ? styles.chipOn : ''}`}
                          onClick={() => setEpithet(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
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

            <div className={styles.actions}>
              <button type="button" className="btnGhost" onClick={() => setStep(1)}>
                별 다시 잇기
              </button>
              <button type="button" className="btnPrimary" onClick={handleSave} disabled={!cardReady}>
                성좌 완성하기
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
            <h2 className={styles.heading}>성좌가 태어났어요</h2>
            <p className={styles.guide}>
              {saved && '도감 마지막 칸에 담았어요. '}
              그림으로 저장하면 선생님께 내거나 인쇄해서 붙일 수 있어요.
            </p>

            {downloadFailed && (
              <p className={styles.hint}>
                그림 저장이 되지 않았어요. 다른 브라우저에서 다시 해 보세요.
              </p>
            )}

            <div className={styles.actions}>
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
