const names = {
 screen_glass: '显示屏玻璃', screen_bezel: '显示屏边框',
 work_panel: '操作面板', panel_silkscreen: '面板印字', panel_vector_silkscreen: '面板印字',
 base_mounting_plate: '机械臂底板', arm_mount_adapter: '机械臂安装座',
 compute_cover: '计算模块盖板', compute_window_frame: '计算模块边框',
 board_pcb: '开发板', oled_board: '控制显示板', speaker_mount_ring: '扬声器',
};
const groups = [
 [/^case_/, '实验箱外壳'], [/^button_cap_/, '控制按钮'], [/^sensor_/, '传感器插座'],
 [/^gimbal_/, '云台支架'], [/^camera_/, '相机'], [/^base_/, '机械臂底座'],
 [/^lower_/, '机械臂大臂'], [/^mid__/, '机械臂中间关节'], [/^wrist_/, '机械臂腕部'],
 [/^gripper_/, '夹爪舵机'], [/^jaw_left_/, '左夹指'], [/^jaw_right_/, '右夹指'],
];
export function partLabel(name) {
 return names[name] || groups.find(([pattern]) => pattern.test(name))?.[1] || name;
}
