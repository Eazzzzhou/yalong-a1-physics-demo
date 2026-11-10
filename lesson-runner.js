import {modelPoseToServoAngles, targetActionsToDeltas} from './angle-map.js';
import {compileLesson} from './lesson-program.js';

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

export function createLessonRunner({teaching, exploder, screen}) {
  const home = [...teaching.home];
  let locked = false;

  function acquire() {
    if (locked || teaching.state.busy) {
      throw new Error('当前动作尚未完成，请等待后再操作');
    }
    locked = true;
    try {
      if (!teaching.beginLesson()) {
        throw new Error('当前动作尚未完成，无法开始关卡操作');
      }
    } catch (error) {
      locked = false;
      throw error;
    }
  }

  function release() {
    try {
      teaching.endLesson();
    } finally {
      locked = false;
    }
  }

  async function collapseExplosion() {
    if (!exploder || (!exploder.exploded && !(exploder.progress > 0))) return;
    exploder.collapse();
    // 父页面的渲染循环持续驱动 exploder.update；目标收拢不等于动画已收拢。
    while (exploder.progress > 0) await nextFrame();
  }

  function animatePose(target, durationMs) {
    return teaching.movePose(target, durationMs);
  }

  // 创建时 runtime 已初始化且无动作；真机准备角对应模型自身 home。
  teaching.pose(home, 0);

  return {
    get busy() {
      return locked || Boolean(teaching.state.busy);
    },

    getAngles() {
      return modelPoseToServoAngles(teaching.state, home);
    },

    suggestedActions(actions) {
      return targetActionsToDeltas(actions, modelPoseToServoAngles(teaching.state, home));
    },

    async execute(rows, onProgress = () => {}) {
      acquire();
      let executing = false;
      try {
        const program = compileLesson(rows, teaching.state, home);
        await collapseExplosion();
        screen.show(program);
        onProgress({phase: 'validating', rowIndex: null});
        await delay(600);
        screen.update('compiled');
        onProgress({phase: 'validated', rowIndex: null});
        await delay(800);
        for (let rowIndex = 0; rowIndex < program.commands.length; rowIndex++) {
          executing = true;
          const {target, motion, durationMs, waitSeconds, moveLine, waitLine} = program.commands[rowIndex];
          screen.update('moving', moveLine);
          onProgress({phase: 'moving', rowIndex, motion});
          try {
            await animatePose(target, durationMs);
          } catch (error) {
            const actual = modelPoseToServoAngles(teaching.state, home)[motion.joint] - motion.fromAngle;
            onProgress({phase: 'blocked', rowIndex, motion: {...motion, deltaAngle: actual}});
            throw new Error(`第 ${rowIndex + 1} 行：${error.message}；实际转动 ${actual.toFixed(1)}°`);
          }
          screen.update('waiting', waitLine ?? moveLine);
          onProgress({phase: 'waiting', rowIndex, motion});
          await delay(waitSeconds * 1000);
        }
        screen.update('complete');
        onProgress({phase: 'complete', rowIndex: null});
      } catch (error) {
        screen.error(error.message, executing);
        throw error;
      } finally {
        release();
      }
    },

    async prepare() {
      acquire();
      try {
        await collapseExplosion();
        await animatePose({q: home, opening: 0}, 600);
        screen.reset();
      } finally {
        release();
      }
    },
  };
}
