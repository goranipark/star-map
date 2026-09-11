import { useState } from 'react';
import BackgroundStars from '../components/BackgroundStars.jsx';
import styles from './TitleScreenV2.module.css';

export default function TitleScreenV2({ onStart, onOpenAlmanac, completedCount = 0 }) {
  const [step, setStep] = useState(0);
  const returning = completedCount > 0;
  const dialogue = [
    {
      text: returning ? '다시 만나서 반가워. 네가 이어 준 별들이 오늘도 반짝이고 있어. 우리, 다음 이야기도 만나 볼까?' : '안녕, 나는 북극성 폴라리스야. 밤하늘이 낯설어도 괜찮아. 내가 네 길잡이가 되어 줄게.',
      reply: returning ? '다시 만나서 반가워!' : '반가워!',
      scene: '폴라리스가 별빛 사이로 손을 내밉니다.',
    },
    {
      text: '북쪽 하늘에서 나를 찾아봐. 다른 별들이 내 주위를 도는 동안, 나는 거의 같은 자리에 머물러 있어. 길을 찾고 싶을 때 나를 기억해 줘.',
      reply: '네 주변에는 누가 있어?',
      scene: '맞잡은 손끝에서 작은 별빛이 피어납니다.',
    },
    {
      text: '작은곰과 큰곰, 그리고 카시오페이아도 있어. 별과 별을 하나씩 이어 보면 숨어 있던 모습이 나타날 거야. 자, 첫 별을 함께 찾아볼까?',
      reply: returning ? '이어서 별을 만나러 가자' : '좋아, 첫 별을 찾아보자',
      scene: '두 사람 앞에 북쪽 밤하늘이 펼쳐집니다.',
    },
  ];
  const current = dialogue[step];
  return (
    <section className={styles.wrap} aria-labelledby="welcome-title">
      <div className={styles.cosmos} aria-hidden="true"><BackgroundStars count={160} /></div>
      <div className={styles.cover}>
        <div className={styles.art}>
          <img src={`${import.meta.env.BASE_URL}art/polaris-portal.png`} alt="은빛 머리와 별빛 망토를 두른 북극성 폴라리스가 다정하게 손을 내밀고 있어요." fetchPriority="high" />
          <span className={styles.artLabel}>THE NORTH STAR　 ✦　 POLARIS</span>
        </div>
        <div className={styles.content}>
          <div className={styles.brand}>✦　 POLARIS’ STAR MAP</div>
          <div className={styles.story}>
            <p className={styles.chapter}>북극성을 따라</p>
            <h1 id="welcome-title" className={styles.title} aria-label="북극성을 따라, 별자리 속으로">별자리 속으로</h1>
            <div className={styles.ornament} aria-hidden="true"><span />✧<span /></div>
            <div className={styles.dialogue}>
              <div className={styles.speaker}>✦ 폴라리스 <span>너의 북극성</span></div>
              <div className={styles.words} aria-live="polite" aria-atomic="true">
                <p key={step} className={styles.invitation}>{current.text}</p>
              </div>
              <p className={styles.scene}>{current.scene}</p>
              <div className={styles.dots} aria-label={`초대 이야기 ${step + 1} / ${dialogue.length}`}>
                {dialogue.map((_, index) => <span key={index} className={index === step ? styles.activeDot : ''} />)}
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.start} onClick={() => step < dialogue.length - 1 ? setStep(step + 1) : onStart()}><span aria-hidden="true">✧</span>{current.reply}<span aria-hidden="true">→</span></button>
              {step < dialogue.length - 1 && <button type="button" className={styles.skip} onClick={onStart}>대화 건너뛰고 별 잇기</button>}
              <button type="button" className={styles.almanac} onClick={onOpenAlmanac}>나의 밤하늘 도감 <span aria-hidden="true">↗</span></button>
            </div>
            {completedCount > 0 && <p className={styles.saved}>지금까지 {completedCount}개의 별자리를 만났어요</p>}
          </div>
          <p className={styles.footer}>별을 잇다　·　이야기를 만나다　·　나의 밤하늘을 만들다</p>
        </div>
      </div>
    </section>
  );
}





