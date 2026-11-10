import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {partLabel} from './part-labels.js';

// Shared full/lite collision geometry. Values below are simulation estimates,
// not measured motor torque or a safety controller for physical hardware.
export const PHYSICS = Object.freeze({step: 1/240, maxJointSpeed: 1.5,
 padMass: .008, clampForce: 1.2, friction: .8});

export async function createRobotPhysics({world, objects, root, cloud, blocks}) {
 const response = await fetch('./assets/collision-shapes.json');
 if (!response.ok) throw Error('碰撞模型加载失败');
 const geometry = await response.json();
 const records = [];
 const scale = new T.Vector3();
 for (const [name, {vertices,indices}] of Object.entries(geometry)) {
  const mesh = objects.get(name);
  if (!mesh) throw Error('碰撞零件缺失：' + name);
  let link = -1, parent = mesh;
  while (parent) {
   if (parent.name === 'rig-jaw_left') { link = 4; break; }
   if (parent.name === 'rig-jaw_right') { link = 5; break; }
   if (/^rig-J[123]$/.test(parent.name)) { link = +parent.name.slice(-1); break; }
   if (parent.name === 'rig-base') { link = 0; break; }
   if (parent === cloud) { link = 6; break; }
   parent = parent.parent;
  }
  const p = new T.Vector3(), r = new T.Quaternion();
  mesh.matrixWorld.decompose(p, r, scale);
  const points = Float32Array.from(vertices, (v, i) => v * scale.getComponent(i % 3));
  const desc = RAPIER.ColliderDesc.convexMesh(points,Uint32Array.from(indices));
  if (!desc) throw Error('碰撞形状无效：' + name);
  const rb = world.createRigidBody((link < 0 ? RAPIER.RigidBodyDesc.fixed() : RAPIER.RigidBodyDesc.kinematicPositionBased()).setTranslation(...p).setRotation(r));
  let c;
  // Jaw hulls are used for robot/fixture clearance only. Their inner concave
  // gripping surfaces are represented by the two compliant contact pads.
  const collisionGroups=link<0?0x00010007:(link===4||link===5)?0x00020000:0x00020001;
  try { c = world.createCollider(desc.setFriction(.65).setCollisionGroups(collisionGroups), rb); }
  catch(error) { throw Error(`碰撞形状 ${name} 创建失败：${error.message}`); }
  const bounds = new T.Box3().setFromArray(points), center = bounds.getCenter(new T.Vector3());
  records.push({name, mesh, link, p, r, rb, c, shape: c.shape, bounds, box: new T.Box3(), center,
   radius: bounds.getSize(new T.Vector3()).length() / 2, worldCenter: new T.Vector3()});
 }
 const identity = new T.Quaternion();
 const floor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
 const fixed = [
  {name:'操作面板', p:new T.Vector3(0,.091,0), half:new T.Vector3(.304,.004,.216)},
  {name:'桌面', p:new T.Vector3(0,-.005,0), half:new T.Vector3(2,.005,2)},
 ].map(item => {
  const c = world.createCollider(RAPIER.ColliderDesc.cuboid(...item.half).setTranslation(...item.p).setFriction(.65), floor);
  return {...item, link:-1, r:identity, c, shape:c.shape, box:new T.Box3(item.p.clone().sub(item.half), item.p.clone().add(item.half))};
 });
 function capture() {
  for (const a of records) {
   a.mesh.matrixWorld.decompose(a.p, a.r, scale);
   a.worldCenter.copy(a.center).applyQuaternion(a.r).add(a.p);
   a.box.copy(a.bounds).applyMatrix4(new T.Matrix4().compose(a.p,a.r,new T.Vector3(1,1,1)));
  }
 }
 function contact(a,b) {
  if (!a.box.intersectsBox(b.box)) return null;
  const hit = a.shape.contactShape(a.p,a.r,b.shape,b.p,b.r,0);
  // Sub-millimetre clearance tolerance absorbs CAD seam/solver roundoff.
  return hit && hit.distance < -.00015 ? {a:a.name,b:b.name,depth:-hit.distance} : null;
 }
 function collision() {
  capture();
  for (let i=0;i<records.length;i++) {
   const a=records[i]; if(a.link<0) continue;
   for (const b of fixed) {
    if (a.link===0 && b.name==='操作面板') continue; // mounted base
    const hit=contact(a,b); if(hit)return hit;
   }
   for(let j=0;j<records.length;j++) {
    const b=records[j];
    if(b.link>=0 && j<=i)continue;
    if(a.link===b.link)continue;
    // Adjacent links share bearings; the two jaws share meshed drive gears.
    if(a.link<6 && b.link>=0 && b.link<6 &&
      (Math.abs(Math.min(a.link,4)-Math.min(b.link,4))<=1))continue;
    if(a.link===0 && b.name==='arm_mount_adapter')continue;
    if(a.link===6 && /^gimbal_/.test(b.name))continue; // folding pivot assembly
    const hit=contact(a,b); if(hit)return hit;
   }
  }
  return null;
 }
 function sync() {
  capture();
  for(const a of records) if(a.link>=0){a.rb.setNextKinematicTranslation(a.p);a.rb.setNextKinematicRotation(a.r);}
 }
 function describe(hit){return `${partLabel(hit.a)}碰到${partLabel(hit.b)}，动作已停止`;}
 return {records,collision,sync,describe};
}
