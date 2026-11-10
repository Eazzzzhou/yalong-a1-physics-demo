"""Extract shared convex collision proxies from the full GLB (metres at runtime).

Individual plates/housings remain separate, preserving the space between them.
Small fasteners, cables and labels do not participate in rigid collision.
"""
import json
import re
import struct
from pathlib import Path
import numpy as np
from scipy.spatial import ConvexHull

root = Path(__file__).resolve().parents[1]
data = (root / 'assets/experimental-box.glb').read_bytes()
length = struct.unpack_from('<I', data, 12)[0]
gltf = json.loads(data[20:20 + length])
binary = data[28 + length:]
arm = re.compile(r'^(base_(cradle_[^-s]|cradle_-1|mounting_plate|servo_metal_housing)|lower_arm_plate|lower_cross_spacer|mid__(lower_servo_metal_housing|yoke_side)|mid__upper_servo_metal_housing|gripper_servo_metal_housing|wrist_(cradle|neck_plate|gear_support)|jaw_(left|right)_(finger_plate|cross_spacer|root_arm))')
station = re.compile(r'^(case_(side|end)|screen_(glass|bezel)|compute_(cover|window_frame)|board_pcb|oled_board|button_cap|sensor_.*_socket_|gimbal_(base|servo_shell|turntable|folded_side)|camera_(metal_shell|rear_cover|lens_rim)|speaker_mount_ring|arm_mount_adapter)')
result = {}
for node in gltf['nodes']:
    name = node.get('name', '')
    if 'mesh' not in node or not (arm.search(name) or station.search(name)):
        continue
    points = []
    for primitive in gltf['meshes'][node['mesh']]['primitives']:
        accessor = gltf['accessors'][primitive['attributes']['POSITION']]
        view = gltf['bufferViews'][accessor['bufferView']]
        offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
        points.append(np.ndarray((accessor['count'], 3), dtype='<f4', buffer=binary,
                                 offset=offset, strides=(view.get('byteStride', 12), 4)))
    points = np.unique(np.concatenate(points).round(4), axis=0)
    hull = ConvexHull(points)
    remap = {int(old): new for new, old in enumerate(hull.vertices)}
    faces = []
    for face, equation in zip(hull.simplices, hull.equations):
        a, b, c = points[face]
        if np.dot(np.cross(b-a, c-a), equation[:3]) < 0:
            face = face[[0, 2, 1]]
        faces.extend(remap[int(i)] for i in face)
    result[name] = {'vertices': points[hull.vertices].round(4).flatten().tolist(), 'indices': faces}
(root / 'assets/collision-shapes.json').write_text(json.dumps(result, separators=(',', ':')), encoding='utf-8')
print(f'{len(result)} shared collision parts')
