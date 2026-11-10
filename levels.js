export const PREPARATION_ANGLES = {
  base: -0.8,
  shoulder: -59.7,
  elbow: -55.6,
  wrist: -83.2,
  gripper: -0.8,
};

export const JOINT_LABELS = {
  base: '底座',
  shoulder: '大臂',
  elbow: '中间关节',
  wrist: '腕部',
  gripper: '夹爪',
};

export const LEVELS = [
  {
    id: 1,
    title: '设置关节角度',
    description: '填写 5 个关节的转动角度，执行后依次调整各关节',
    fixedTiming: true,
    actions: Object.entries(PREPARATION_ANGLES).map(([joint, angle]) => ({
      joint, angle, durationMs: 900, waitSeconds: 0,
    })),
  },
  {
    id: 2,
    title: '控制底座',
    description: '让底座小幅旋转',
    actions: [{joint: 'base', angle: 7.2, durationMs: 800, waitSeconds: 1.0}],
  },
  {
    id: 3,
    title: '控制大臂',
    description: '调整大臂的俯仰',
    actions: [{joint: 'shoulder', angle: -51.7, durationMs: 900, waitSeconds: 1.0}],
  },
  {
    id: 4,
    title: '控制中间关节',
    description: '调整中间关节的角度',
    actions: [{joint: 'elbow', angle: -47.6, durationMs: 900, waitSeconds: 1.0}],
  },
  {
    id: 5,
    title: '控制腕部',
    description: '改变手腕和夹爪的朝向',
    actions: [{joint: 'wrist', angle: -91.2, durationMs: 900, waitSeconds: 1.0}],
  },
  {
    id: 6,
    title: '控制夹爪',
    description: '依次完成张开、闭合、再张开',
    actions: [
      {joint: 'gripper', angle: 25.0, durationMs: 700, waitSeconds: 0.8},
      {joint: 'gripper', angle: 6.6, durationMs: 900, waitSeconds: 1.0},
      {joint: 'gripper', angle: 25.0, durationMs: 900, waitSeconds: 1.0},
    ],
  },
  {
    id: 7,
    title: '组合关节姿态',
    description: '按顺序把机械臂摆回待机姿态，体会多个关节先后动作',
    actions: [
      {joint: 'shoulder', angle: -59.7, durationMs: 1400, waitSeconds: 1.4},
      {joint: 'elbow', angle: -55.6, durationMs: 1400, waitSeconds: 1.4},
      {joint: 'wrist', angle: -83.2, durationMs: 1400, waitSeconds: 1.4},
      {joint: 'base', angle: -0.8, durationMs: 1400, waitSeconds: 1.4},
      {joint: 'gripper', angle: -0.8, durationMs: 1400, waitSeconds: 1.4},
    ],
  },
];
