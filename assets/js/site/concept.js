const studies = {
  missing: {
    number: '01 / 04',
    title: 'MISSING / Отсутствующий фрагмент',
    caption: 'Форма продолжается. Данные — нет. Один точный квадрат меняет восприятие всего объекта.'
  },
  misplaced: {
    number: '02 / 04',
    title: 'MISPLACED / Смещённая деталь',
    caption: 'Карман на месте — только это место неправильное. Одна деталь выходит из общей системы.'
  },
  corrupted: {
    number: '03 / 04',
    title: 'CORRUPTED / Нарушенная геометрия',
    caption: 'Объект узнаваем. Но один участок словно сдвинулся при загрузке и продолжил жить по другим правилам.'
  },
  unavailable: {
    number: '04 / 04',
    title: 'UNAVAILABLE / Недоступная функция',
    caption: 'Карман виден, его конструкция настоящая. Но вход намеренно зашит: ожидание функции встречает отказ.'
  }
};

const study = document.querySelector('#error-study');
const controls = [...document.querySelectorAll('[data-error-mode]')];

if (study && controls.length) {
  controls.forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.dataset.errorMode;
      const content = studies[mode];
      if (!content) return;

      study.dataset.mode = mode;
      study.querySelector('[data-study-number]').textContent = content.number;
      study.querySelector('[data-study-title]').textContent = content.title;
      study.querySelector('[data-study-caption]').textContent = content.caption;
      controls.forEach(control => {
        control.setAttribute('aria-pressed', String(control === button));
      });
    });
  });
}
