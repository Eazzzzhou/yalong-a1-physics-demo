import { LEVELS, JOINT_LABELS } from './levels.js';

export function initLessonPanel({ runner }) {
  const panel = document.querySelector('.demo-view #lesson-panel');
  if (!panel) return;

  panel.innerHTML = `
    <section class="lesson-picker" aria-labelledby="lesson-picker-title">
      <p class="lesson-eyebrow">机械臂 · 关节控制</p>
      <h2 id="lesson-picker-title">选择关卡</h2>
      <div class="lesson-cards"></div>
    </section>
    <section class="lesson-task" aria-labelledby="lesson-title" hidden>
      <div class="lesson-navigation">
        <button type="button" class="lesson-back">← 返回</button>
        <select class="lesson-select" aria-label="切换关卡"></select>
      </div>
      <p class="lesson-eyebrow lesson-number"></p>
      <h2 id="lesson-title" tabindex="-1"></h2>
      <p class="lesson-description"></p>
      <div class="lesson-table-scroll" tabindex="0" role="region" aria-label="关节动作填写表">
        <table class="lesson-table">
          <thead><tr><th scope="col">顺序</th><th scope="col">关节</th><th scope="col">转动量 °</th><th scope="col">时间 ms</th><th scope="col">等待 s</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="lesson-actions">
        <button type="button" class="lesson-fill">一键填写</button>
        <button type="button" class="lesson-execute">验证并执行</button>
      </div>
      <div class="lesson-feedback" role="status" aria-live="polite" aria-atomic="true">
        <p class="lesson-validation" hidden>验证通过</p>
        <p class="lesson-status"></p>
      </div>
    </section>
    <p class="lesson-busy-note" role="status" hidden>动作进行中，请稍候。</p>`;

  const find = selector => panel.querySelector(selector);
  const picker = find('.lesson-picker');
  const task = find('.lesson-task');
  const cards = find('.lesson-cards');
  const select = find('.lesson-select');
  const title = find('#lesson-title');
  const tableBody = find('tbody');
  const backButton = find('.lesson-back');
  const fillButton = find('.lesson-fill');
  const executeButton = find('.lesson-execute');
  const validation = find('.lesson-validation');
  const status = find('.lesson-status');
  const busyNote = find('.lesson-busy-note');
  const cardButtons = [];
  let currentLevel = null;
  let inputRows = [];
  let pending = false;
  let lastBusy = null;

  const isBusy = () => pending || runner.busy;
  const isFilled = () => inputRows.length > 0 && inputRows.every(row =>
    Object.values(row.fields).every(input => input.value.trim() !== '' && Number.isFinite(input.valueAsNumber))
  );

  function syncControls() {
    const busy = Boolean(isBusy());
    lastBusy = busy;
    for (const button of cardButtons) button.disabled = busy;
    backButton.disabled = busy;
    select.disabled = busy;
    fillButton.disabled = busy;
    for (const row of inputRows) {
      for (const input of Object.values(row.fields)) input.disabled = busy;
    }
    executeButton.disabled = busy || !isFilled();
    busyNote.hidden = !runner.busy || pending;
    panel.setAttribute('aria-busy', String(pending));
  }

  function clearResult() {
    validation.hidden = true;
    status.textContent = '';
    for (const row of inputRows) {
      row.actual = null;
      const {element} = row;
      element.classList.remove('is-blocked');
      element.classList.remove('is-active');
      element.removeAttribute('aria-current');
    }
  }

  function deltaText(joint, delta) {
    const rounded = Number(delta.toFixed(1));
    const label = joint === 'gripper' ? '指令变化' : '本次转动';
    return `${label} ${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}°`;
  }

  function updateDeltas() {
    for (const row of inputRows) {
      if(row.actual != null){row.delta.textContent = `实际转动 ${row.actual.toFixed(1)}°`;continue;}
      const input = row.fields.angle;
      if (input.value.trim() === '' || !Number.isFinite(input.valueAsNumber)) {
        row.delta.textContent = '';
        continue;
      }
      const joint = row.standard.joint;
      row.delta.textContent = deltaText(joint, input.valueAsNumber);
    }
  }

  function addInput(row, key, label, step) {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.step = step;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `第${row.index + 1}行 ${JOINT_LABELS[row.standard.joint]} ${label}`);
    input.addEventListener('beforeinput', event => {
      if (isBusy()) event.preventDefault();
    });
    input.addEventListener('input', () => {
      if (isBusy()) {
        input.value = row.values[key];
        syncControls();
        return;
      }
      row.values[key] = input.value;
      clearResult();
      updateDeltas();
      syncControls();
    });
    row.fields[key] = input;
    row.values[key] = '';
    cell.append(input);
    if (key === 'angle') {
      row.delta = document.createElement('small');
      row.delta.className = 'lesson-delta';
      cell.append(row.delta);
    }
    row.element.append(cell);
  }

  function openLevel(level) {
    if (isBusy()) return;
    currentLevel = level;
    picker.hidden = true;
    task.hidden = false;
    select.value = String(level.id);
    find('.lesson-number').textContent = `第 ${level.id} 关`;
    title.textContent = level.title;
    find('.lesson-description').textContent = level.description;
    tableBody.replaceChildren();
    inputRows = [];
    const standards = level.actions;
    standards.forEach((standard, index) => {
      const element = document.createElement('tr');
      const order = document.createElement('td');
      order.textContent = String(index + 1);
      const joint = document.createElement('th');
      joint.scope = 'row';
      joint.textContent = JOINT_LABELS[standard.joint];
      element.append(order, joint);
      const row = { standard, index, element, fields: {}, values: {} };
      addInput(row, 'angle', '转动量（度）', '0.1');
      if (level.fixedTiming) {
        for (const key of ['durationMs', 'waitSeconds']) {
          const cell = document.createElement('td');
          cell.textContent = standard[key].toFixed(key === 'durationMs' ? 0 : 1);
          element.append(cell);
        }
      } else {
        addInput(row, 'durationMs', '时间（毫秒）', '1');
        addInput(row, 'waitSeconds', '等待（秒）', '0.1');
      }
      inputRows.push(row);
      tableBody.append(element);
    });
    clearResult();
    syncControls();
    title.focus({ preventScroll: true });
    panel.scrollTop = 0;
  }

  for (const level of LEVELS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lesson-card';
    const number = document.createElement('span');
    number.className = 'lesson-card-number';
    number.textContent = String(level.id).padStart(2, '0');
    const name = document.createElement('span');
    name.textContent = level.title;
    button.append(number, name);
    button.addEventListener('click', () => openLevel(level));
    cards.append(button);
    cardButtons.push(button);
    const option = document.createElement('option');
    option.value = String(level.id);
    option.textContent = `${level.id} · ${level.title}`;
    select.append(option);
  }

  select.addEventListener('change', () => {
    if (isBusy()) {
      select.value = String(currentLevel.id);
      return;
    }
    const level = LEVELS.find(item => String(item.id) === select.value);
    if (level) openLevel(level);
  });

  fillButton.addEventListener('click', () => {
    if (isBusy() || !currentLevel) return;
    const suggestions = runner.suggestedActions(currentLevel.actions);
    for (const [index, row] of inputRows.entries()) {
      for (const [key, input] of Object.entries(row.fields)) {
        input.value = suggestions[index][key].toFixed(key === 'durationMs' ? 0 : 1);
        row.values[key] = input.value;
      }
    }
    clearResult();
    updateDeltas();
    syncControls();
  });

  function onProgress({ phase, rowIndex, motion }) {
    for (const row of inputRows) {
      const active = (phase === 'moving' || phase === 'waiting') && row.index === rowIndex;
      row.element.classList.toggle('is-active', active);
      if (active) row.element.setAttribute('aria-current', 'step');
      else row.element.removeAttribute('aria-current');
    }
    if (motion) inputRows[rowIndex].delta.textContent = deltaText(motion.joint, motion.deltaAngle);
    if(phase==='blocked'){
      inputRows[rowIndex].actual=motion.deltaAngle;
      inputRows[rowIndex].element.classList.add('is-blocked');
      inputRows[rowIndex].delta.textContent=`实际转动 ${motion.deltaAngle.toFixed(1)}°`;
    }
    if (phase === 'validating') status.textContent = '验证中…';
    if (phase === 'validated') {
      validation.hidden = false;
      status.textContent = '';
    }
    if (phase === 'moving') status.textContent = `第 ${rowIndex + 1} 行 · 运动中…`;
    if (phase === 'waiting') status.textContent = `第 ${rowIndex + 1} 行 · 等待中…`;
    if (phase === 'complete') {
      status.textContent = '执行完成';
    }
  }

  executeButton.addEventListener('click', async () => {
    if (isBusy() || !currentLevel || !isFilled()) return;
    const rows = inputRows.map(row => ({
      joint: row.standard.joint,
      angle: row.fields.angle.valueAsNumber,
      durationMs: currentLevel.fixedTiming ? row.standard.durationMs : row.fields.durationMs.valueAsNumber,
      waitSeconds: currentLevel.fixedTiming ? row.standard.waitSeconds : row.fields.waitSeconds.valueAsNumber
    }));
    updateDeltas();
    pending = true;
    clearResult();
    status.textContent = '准备执行…';
    syncControls();
    try {
      await runner.execute(rows, onProgress);
    } catch (error) {
      for (const { element } of inputRows) {
        element.classList.remove('is-active');
        element.removeAttribute('aria-current');
      }
      status.textContent = error instanceof Error ? error.message : '执行未完成';
    } finally {
      pending = false;
      syncControls();
    }
  });

  backButton.addEventListener('click', async () => {
    if (isBusy()) return;
    pending = true;
    clearResult();
    status.textContent = '正在返回准备姿势…';
    syncControls();
    try {
      await runner.prepare();
      currentLevel = null;
      inputRows = [];
      tableBody.replaceChildren();
      task.hidden = true;
      picker.hidden = false;
      panel.scrollTop = 0;
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : '返回未完成';
    } finally {
      pending = false;
      syncControls();
      if (!currentLevel) cardButtons[0].focus({ preventScroll: true });
    }
  });

  syncControls();
  // 原动作没有状态订阅接口，仅在 busy 变化时更新控件。
  function observeBusy() {
    if (!panel.isConnected) return;
    if (Boolean(isBusy()) !== lastBusy) {
      if (!isBusy()) updateDeltas();
      syncControls();
    }
    requestAnimationFrame(observeBusy);
  }
  requestAnimationFrame(observeBusy);
}
