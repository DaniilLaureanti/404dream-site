export const THOUGHTS = Object.freeze([
  'Почему я живу на автопилоте?',
  'Кто я на самом деле?',
  'Почему я снова делаю это?',
  'Почему мне тяжело в тишине?',
  'Как выйти из бесконечных новостей?',
  'Кто во мне думает?',
  'Почему я реагирую так остро?',
  'Где проходит граница между мной и ролью?',
  'Почему я застрял в старой обиде?',
  'Что значит быть собой?',
  'Почему я боюсь одиночества?',
  'Как научиться отпускать прошлое?',
  'Почему я не слышу тело?',
  'Что делать с тревожными мыслями?',
  'Куда уходит энергия?',
  'Почему память подсовывает искажённые сцены?',
  'Кто управляет моими эмоциями?',
  'Почему я прокрастинирую?',
  'Как перестать жить по чужим сценариям?',
  'Почему я всё время в телефоне?',
  'Где моя внутренняя опора?',
  'Почему повторяются одни и те же отношения?',
  'Что такое свободная воля?',
  'Как заботиться о себе без чувства вины?',
  'Почему я ощущаю пустоту?',
  'Как научиться слышать свой внутренний голос?',
  'Кто говорит во мне, когда я думаю?',
  'Почему я легко раздражаюсь?',
  'Что со мной делают соцсети?',
  'Почему я забываю важные моменты?',
  'Почему мне страшно что-то менять?',
  'Как перестать сравнивать себя?',
  'Что такое любовь к себе?',
  'Почему я не могу заснуть?',
  'Как справляться с эмоциями на работе?',
  'Почему мысли мешают расслабиться?',
  'Куда уходят мои желания?',
  'Почему мне сложно слушать другого?',
  'Как пережить потерю?',
  'Почему я не чувствую радость?',
  'Где мои границы?',
  'Как отключить внутреннего критика?',
  'Почему мне скучно?',
  'Что такое счастье?',
  'Кто я без социальных сетей?',
  'Почему прошлое всё время всплывает?',
  'Как перестать зависеть от чужого мнения?',
  'Почему моя голова постоянно занята?',
  'Как научиться замечать хорошее?',
  'Почему я всё время устал?',
  'Что мне дают эмоции?',
  'Как понять свои ценности?',
  'Почему я избегаю сложных тем?',
  'Что со мной происходит, когда я сплю?',
  'Почему я осуждаю себя?',
  'Как перестать спорить с реальностью?',
  'Где заканчивается контроль?',
  'Что даёт мне тишина?',
  'Почему страх тормозит меня?',
  'Как увидеть свои шаблоны?',
  'Почему я переживаю о будущем?',
  'Кто я, когда никто не смотрит?',
  'Как сделать шаг вперёд?'
]);

export function startThoughts({
  container,
  items = THOUGHTS,
  count = 36,
  windowRef = globalThis.window,
  documentRef = globalThis.document
} = {}) {
  const noAnimation = !container || !windowRef || !documentRef || items.length === 0;
  const reduceMotion = windowRef?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const isMobile = windowRef?.innerWidth < 768;

  if (noAnimation || reduceMotion || isMobile) return () => {};

  const thoughtElements = Array.from({ length: count }, () => {
    const thought = documentRef.createElement('span');
    thought.className = 'thought';
    thought.textContent = items[Math.floor(Math.random() * items.length)];
    thought.style.fontSize = `${12 + Math.random() * 16}px`;
    thought.dataset.speed = (0.15 + Math.random() * 0.55).toFixed(3);
    thought.style.left = `${(Math.random() * 100).toFixed(2)}%`;
    thought.style.top = `${(Math.random() * 100).toFixed(2)}%`;
    container.appendChild(thought);
    return thought;
  });

  let animationFrameId = 0;

  const animate = () => {
    thoughtElements.forEach(thought => {
      let top = parseFloat(thought.style.top) - parseFloat(thought.dataset.speed);

      if (top < -10) {
        top = 110;
        thought.style.left = `${(Math.random() * 100).toFixed(2)}%`;
        thought.textContent = items[Math.floor(Math.random() * items.length)];
      }

      thought.style.top = `${top}%`;
    });

    animationFrameId = windowRef.requestAnimationFrame(animate);
  };

  animationFrameId = windowRef.requestAnimationFrame(animate);

  return () => {
    windowRef.cancelAnimationFrame(animationFrameId);
    thoughtElements.forEach(thought => thought.remove());
  };
}

