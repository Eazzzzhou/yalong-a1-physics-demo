import {actionToPose, modelPoseToServoAngles} from './angle-map.js';
import {JOINT_LABELS} from './levels.js';

const number = value => String(Number(value.toFixed(4)));
const signed = value => `${value > 0 ? '+' : ''}${number(value)}`;

// 编译教学指令：在任何关节运动前验证整段输入，并生成执行器和屏幕共用的指令。
export function compileLesson(rows, state, home) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('请先填写关节动作');
  let predicted = {q: [...state.q], opening: state.opening};
  const lines = [];
  const commands = rows.map((row, rowIndex) => {
    const {joint, angle, durationMs, waitSeconds} = row;
    const prefix = `第 ${rowIndex + 1} 行`;
    if (!Object.hasOwn(JOINT_LABELS, joint)) throw new Error(`${prefix}：关节不存在`);
    if (![angle, durationMs, waitSeconds].every(Number.isFinite)) {
      throw new Error(`${prefix}：请填写完整、有效的数字`);
    }
    if (durationMs < 0 || waitSeconds < 0) {
      throw new Error(`${prefix}：运动时间和等待时间不能为负数`);
    }
    const fromAngle = modelPoseToServoAngles(predicted, home)[joint];
    const target = actionToPose(row, home, predicted);
    if (joint === 'gripper' && (target.opening < -1e-8 || target.opening > 12 + 1e-8)) {
      const minimum = -predicted.opening / 12 * 25.8;
      const maximum = (12 - predicted.opening) / 12 * 25.8;
      throw new Error(`${prefix}：夹爪转动量须在 ${number(minimum)}° 到 ${number(maximum)}° 之间`);
    }
    const moveLine = lines.length;
    lines.push(`rotate(${JOINT_LABELS[joint]}, ${signed(angle)}°, ${number(durationMs)}ms);`);
    let waitLine = null;
    if (waitSeconds > 0) {
      waitLine = lines.length;
      lines.push(`wait(${number(waitSeconds)}s);`);
    }
    predicted = target;
    return {joint, angle, durationMs, waitSeconds, target, moveLine, waitLine,
      motion: {joint, fromAngle, targetAngle: fromAngle + angle, deltaAngle: angle}};
  });
  return {commands, lines};
}
