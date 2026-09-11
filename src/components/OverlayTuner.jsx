import { useEffect, useMemo, useState } from 'react';
import styles from './OverlayTuner.module.css';

import { constellations, getConstellation } from '../game/constellations.js';
import { downloadConstellationReference } from '../game/cardImage.js';

/**
 * 별자리 위치 맞추기 도구 (수업용 화면에는 나오지 않는다).
 *
 * 삽화 속 곰·왕비·용 몸 위에 정확한 별자리를 얹으려면, 별자리를 어디로 옮기고
 * 얼마나 키우고 몇 도 돌릴지 정해야 한다. 그림을 새로 뽑을 때마다 달라지므로
 * 숫자를 코드에 손으로 적는 대신 화면에서 눈으로 맞추고 결과만 복사한다.
 *
 * 여는 방법: 주소 끝에 ?tune=1 을 붙인다.
 *   http://localhost:5173/?tune=1
 *
 * 옮기고·돌리고·키우는 것은 모양을 바꾸지 않으므로 별자리는 계속 정확하다.
 */
export default function OverlayTuner({ slideKey, overlay, onChange }) {
  const entries = useMemo(
    () =>
      (overlay ?? []).map((e) =>
        typeof e === 'string'
          ? { id: e, x: 0, y: 0, scale: 1, rotate: 0 }
          : { x: 0, y: 0, scale: 1, rotate: 0, ...e }
      ),
    [overlay]
  );

  const [values, setValues] = useState(entries);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  // 다른 컷으로 넘어가면 그 컷의 값으로 갈아끼운다
  useEffect(() => {
    setValues(entries);
    setActive(0);
    setCopied(false);
  }, [slideKey, entries]);

  if (!overlay?.length) {
    return (
      <aside className={styles.panel}>
        <p className="eyebrow">위치 맞추기</p>
        <p className={styles.note}>
          이 컷에는 겹쳐 그릴 별자리가 없습니다.
          <br />
          별자리가 나오는 컷으로 넘겨 보세요.
        </p>
      </aside>
    );
  }

  const current = values[active] ?? entries[0];

  const update = (patch) => {
    const next = values.map((v, i) => (i === active ? { ...v, ...patch } : v));
    setValues(next);
    setCopied(false);
    onChange?.(next);
  };

  const reset = () => {
    const next = values.map((v, i) =>
      i === active ? { id: v.id, x: 0, y: 0, scale: 1, rotate: 0 } : v
    );
    setValues(next);
    setCopied(false);
    onChange?.(next);
  };

  const json = JSON.stringify(
    values.map((v) => ({
      id: v.id,
      x: round(v.x),
      y: round(v.y),
      scale: round(v.scale, 2),
      rotate: round(v.rotate),
    }))
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className={styles.panel}>
      <p className="eyebrow">위치 맞추기 · 개발용</p>

      {values.length > 1 && (
        <div className={styles.tabs}>
          {values.map((v, i) => (
            <button
              type="button"
              key={v.id}
              className={`${styles.tab} ${i === active ? styles.tabOn : ''}`}
              onClick={() => setActive(i)}
            >
              {getConstellation(v.id)?.name ?? v.id}
            </button>
          ))}
        </div>
      )}

      <Slider
        label="좌우"
        value={current.x}
        min={-50}
        max={50}
        step={0.5}
        onChange={(x) => update({ x })}
      />
      <Slider
        label="위아래"
        value={current.y}
        min={-50}
        max={50}
        step={0.5}
        onChange={(y) => update({ y })}
      />
      <Slider
        label="크기"
        value={current.scale}
        min={0.2}
        max={2}
        step={0.02}
        onChange={(scale) => update({ scale })}
      />
      <Slider
        label="회전"
        value={current.rotate}
        min={-180}
        max={180}
        step={1}
        unit="°"
        onChange={(rotate) => update({ rotate })}
      />

      <div className={styles.actions}>
        <button type="button" className={styles.smallBtn} onClick={reset}>
          이 별자리 초기화
        </button>
      </div>

      <p className={styles.label}>constellations.json 의 overlay 값</p>
      <code className={styles.code}>{json}</code>
      <button type="button" className="btnPrimary" onClick={copy}>
        {copied ? '복사했습니다' : '복사하기'}
      </button>

      {/* 삽화를 뽑을 때 AI에게 함께 올려 줄 별자리 참고 그림 */}
      <p className={styles.label}>AI에게 줄 별자리 참고 그림</p>
      <div className={styles.refRow}>
        {values.map((v) => (
          <button
            type="button"
            key={v.id}
            className={styles.smallBtn}
            onClick={() => downloadConstellationReference(getConstellation(v.id))}
          >
            {getConstellation(v.id)?.name ?? v.id} 내려받기
          </button>
        ))}
      </div>
    </aside>
  );
}

function Slider({ label, value, min, max, step, unit = '', onChange }) {
  return (
    <label className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className={`mono ${styles.rowValue}`}>
        {round(value, 2)}
        {unit}
      </span>
    </label>
  );
}

function round(n, digits = 1) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

/** 주소에 ?tune=1 이 있으면 도구를 연다. */
export function isTuning() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('tune') === '1';
}

/** 도구에서 별자리를 고를 수 있도록 전체 목록을 내보낸다. */
export const allConstellations = constellations;
