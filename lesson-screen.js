import * as T from 'three';
import {finishes} from './finish-calibration.js';

const STATES = {
  idle: '等待程序',
  compiling: '正在编译…',
  compiled: '编译通过',
  moving: '正在执行',
  waiting: '等待下一步',
  complete: '执行完成',
  error: '编译未通过',
  stopped: '执行已停止',
};

export function createLessonScreen({teaching, renderer}) {
  const glass = teaching.objects.get('screen_glass');
  if (!glass) throw new Error('模型缺少实验箱屏幕 screen_glass');
  const canvas = document.createElement('canvas');
  canvas.width = 1440;
  canvas.height = 810;
  const context = canvas.getContext('2d');
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = renderer.getMaxAnisotropy();
  // 显示内容自发光，表面接收现有环境反射；转动视角时高光随之变化。
  const material = new T.MeshPhysicalMaterial({
    ...finishes.screenGlass.parameters,
    emissive: '#ffffff',
    emissiveMap: texture,
    emissiveIntensity: 1,
    toneMapped: false,
  });

  // 来自 cad/build.py 的 563.5 × 316.75 mm 屏幕，箱盖打开 100°。
  // 玻璃没有 UV；在其正面加一层显示平面，保留原玻璃及整组拆解关系。
  const display = new T.Mesh(new T.PlaneGeometry(560, 313), material);
  display.name = 'lesson-code-screen';
  display.rotation.x = T.MathUtils.degToRad(80);
  glass.geometry.computeBoundingBox();
  glass.geometry.boundingBox.getCenter(display.position);
  display.position.add(new T.Vector3(0, 0, 1).applyEuler(display.rotation));
  glass.add(display);

  const accessible = document.createElement('section');
  accessible.className = 'lesson-screen-text';
  accessible.setAttribute('aria-label', '实验箱屏幕：机械臂控制伪代码');
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const code = document.createElement('pre');
  accessible.append(status, code);
  document.querySelector('#viewport').append(accessible);

  let lines = [];
  let phase = 'idle';
  let error = '';
  let activeLine = null;

  function draw() {
    const ctx = context;
    ctx.fillStyle = '#101e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '500 48px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#e6ece2';
    ctx.fillText('机械臂控制 · 伪代码', 60, 65);
    ctx.textAlign = 'right';
    ctx.fillStyle = error ? '#ffbc9b' : '#b4e4c1';
    ctx.fillText(STATES[phase], 1380, 65);
    ctx.fillStyle = '#3b5548';
    ctx.fillRect(60, 112, 1320, 2);
    ctx.textAlign = 'left';
    const compact = lines.length > 7;
    ctx.font = `${compact ? 44 : 56}px Consolas, "Microsoft YaHei", monospace`;
    lines.forEach((line, index) => {
      const y = 166 + index * (compact ? 52 : 72);
      if (index === activeLine) {
        ctx.fillStyle = '#315844';
        ctx.fillRect(44, y - (compact ? 24 : 34), 1352, compact ? 48 : 68);
      }
      ctx.fillStyle = '#9eafa2';
      ctx.fillText(String(index + 1).padStart(2, '0'), 62, y);
      ctx.fillStyle = '#edf5ec';
      ctx.fillText(line, 132, y);
    });
    if (!lines.length) {
      ctx.font = '36px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#c9d8ca';
      ctx.fillText(phase === 'error' ? '请修改左侧输入后重新执行' : '填写左侧转动量，然后执行', 60, 220);
    }
    ctx.fillStyle = '#3b5548';
    ctx.fillRect(60, 710, 1320, 2);
    ctx.font = `${error ? 30 : 38}px "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = error ? '#ffbc9b' : '#b4e4c1';
    const footer = error ? error
      : phase === 'idle' ? '就绪'
      : phase === 'compiling' ? '检查转动量与执行顺序'
      : phase === 'compiled' ? '即将开始动作'
      : phase === 'complete' ? '程序结束'
      : `第 ${activeLine + 1} 行`;
    ctx.fillText(footer, 60, 758, 1320);
    status.textContent = `${STATES[phase]}。${footer}`;
    code.textContent = lines.join('\n');
    texture.needsUpdate = true;
  }

  draw();
  return {
    show(program) {
      lines = program.lines;
      phase = 'compiling';
      error = '';
      activeLine = null;
      draw();
    },
    update(nextPhase, line = null) {
      phase = nextPhase;
      activeLine = line;
      draw();
    },
    error(message, execution = false) {
      if(!execution)lines = [];
      phase = execution ? 'stopped' : 'error';
      error = message;
      activeLine = null;
      draw();
    },
    reset() {
      lines = [];
      phase = 'idle';
      error = '';
      activeLine = null;
      draw();
    },
  };
}
