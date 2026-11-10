import {PREPARATION_ANGLES} from './levels.js';

export const JOINT_DIRECTIONS = {
  base: 1, // 底座
  shoulder: 1, // 大臂
  elbow: 1, // 中间关节
  wrist: 1, // 腕部
};

const JOINT_INDICES = {base: 0, shoulder: 1, elbow: 2, wrist: 3};

export function servoAngleToModel(joint, servoAngle, modelHome) {
  const index = JOINT_INDICES[joint];
  if (index === undefined) throw new Error(`未知运动关节：${joint}`);
  return modelHome[index]
    + JOINT_DIRECTIONS[joint] * (servoAngle - PREPARATION_ANGLES[joint]) * Math.PI / 180;
}

export function gripperAngleToOpening(servoAngle) {
  // 沿用旧驱动：open0 为闭合端点，open12 为抓取前的完全张开端点。
  return (servoAngle - PREPARATION_ANGLES.gripper) / (25.0 - PREPARATION_ANGLES.gripper) * 12;
}

export function modelPoseToServoAngles(state, modelHome) {
  const angles = {};
  for (const [joint, index] of Object.entries(JOINT_INDICES)) {
    angles[joint] = PREPARATION_ANGLES[joint]
      + (state.q[index] - modelHome[index]) * 180 / Math.PI / JOINT_DIRECTIONS[joint];
  }
  angles.gripper = PREPARATION_ANGLES.gripper
    + state.opening / 12 * (25.0 - PREPARATION_ANGLES.gripper);
  return angles;
}

export function actionToPose(action, modelHome, state) {
  const q = [...state.q];
  let opening = state.opening;
  if (action.joint === 'gripper') {
    opening += action.angle / (25.0 - PREPARATION_ANGLES.gripper) * 12;
  } else {
    const index = JOINT_INDICES[action.joint];
    q[index] += JOINT_DIRECTIONS[action.joint] * action.angle * Math.PI / 180;
  }
  return {q, opening};
}

// 关卡仍保存原来的目标姿态；一键填写时才按当前姿态换算成增量。
export function targetActionsToDeltas(actions, currentAngles) {
  const angles = {...currentAngles};
  return actions.map(action => {
    const angle = action.angle - angles[action.joint];
    angles[action.joint] = action.angle;
    return {...action, angle};
  });
}
