// Phase 1: relocate the existing nodes; runtime handlers remain on those nodes.
(() => {
  const lessonPanel = document.getElementById('lesson-panel');
  const toolbar = document.querySelector('.viewport-toolbar');
  const previewControls = document.querySelector('.preview-controls');
  const brand = document.querySelector('.demo-brand');
  const actionStatus = document.getElementById('action-status');
  const reset = document.getElementById('reset');

  function createDrawer(side, name) {
    const label = document.createElement('button');
    label.type = 'button';
    label.className = `ui-edge ui-edge-${side}`;
    label.id = `ui-${side}-label`;
    label.textContent = name;
    label.setAttribute('aria-expanded', 'false');
    label.setAttribute('aria-controls', `ui-${side}-drawer`);
    const drawer = document.createElement('section');
    drawer.id = `ui-${side}-drawer`;
    drawer.className = `ui-drawer ui-drawer-${side}`;
    drawer.setAttribute('aria-labelledby', label.id);
    drawer.hidden = true;
    drawer.inert = true;
    document.body.append(label, drawer);
    return { label, drawer };
  }

  const left = createDrawer('left', '教学');
  const right = createDrawer('right', '场景');
  left.drawer.append(lessonPanel);

  const displayActions = document.createElement('div');
  displayActions.className = 'ui-display-actions';
  displayActions.append(brand.querySelector('.quality-link'), document.getElementById('fullscreen'));
  const captureActions = document.createElement('div');
  captureActions.className = 'ui-capture-actions';
  captureActions.append(document.getElementById('snapshot'));
  const cameraLabel = document.createElement('label');
  cameraLabel.htmlFor = 'camera-view';
  cameraLabel.textContent = '演示视角';
  toolbar.insertBefore(cameraLabel, document.getElementById('camera-view'));
  right.drawer.append(brand, toolbar, document.querySelector('.viewport-label'), previewControls, captureActions, displayActions);

  const strip = document.createElement('div');
  strip.className = 'ui-status-strip';
  const lessonStatus = document.createElement('p');
  lessonStatus.className = 'ui-lesson-status';
  lessonStatus.setAttribute('role', 'status');
  lessonStatus.setAttribute('aria-live', 'polite');
  lessonStatus.hidden = true;
  const resetShortcut = document.createElement('button');
  resetShortcut.id = 'ui-reset';
  resetShortcut.type = 'button';
  resetShortcut.textContent = '复位';
  resetShortcut.disabled = true;
  strip.append(actionStatus, lessonStatus, resetShortcut);
  document.body.append(strip);

  // Copy the actual bound function, including the runtime's existing interlock.
  function syncReset() {
    resetShortcut.disabled = reset.disabled;
    resetShortcut.onclick = reset.onclick;
  }
  new MutationObserver(syncReset).observe(reset, { attributes: true, attributeFilter: ['disabled'] });
  syncReset();

  // Surface existing feedback while its drawer is collapsed. No invented run state.
  let lastLessonText = '';
  new MutationObserver(() => {
    const body = lessonPanel.querySelector('.lesson-task-body:not(.lesson-ghost)');
    const validation = body?.querySelector('.lesson-validation');
    const text = body?.querySelector('.lesson-status')?.textContent ||
      (validation && !validation.hidden ? validation.textContent : '');
    if (text === lastLessonText) return;
    lastLessonText = text;
    lessonStatus.textContent = text;
    lessonStatus.hidden = !text;
    actionStatus.hidden = Boolean(text);
  }).observe(lessonPanel, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(() => {
    actionStatus.hidden = false;
    lessonStatus.hidden = true;
  }).observe(actionStatus, { childList: true, subtree: true, characterData: true });

  function setOpen(item, open) {
    if (!open && item.drawer.contains(document.activeElement)) item.label.focus();
    item.drawer.inert = !open;
    item.drawer.hidden = !open;
    item.label.setAttribute('aria-expanded', String(open));
  }
  const compact = matchMedia('(max-width: 1099px)');
  compact.addEventListener('change', () => {
    if (compact.matches && !left.drawer.hidden && !right.drawer.hidden) setOpen(right, false);
  });
  for (const item of [left, right]) {
    item.label.addEventListener('click', () => {
      const open = item.drawer.hidden;
      if (open && compact.matches) {
        setOpen(item === left ? right : left, false);
      }
      setOpen(item, open);
    });
  }
})();
