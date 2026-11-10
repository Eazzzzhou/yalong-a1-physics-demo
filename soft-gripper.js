import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {PHYSICS} from './robot-physics.js';

// Compliant rubber contact: finite normal force and Coulomb-limited friction.
// The block remains a free dynamic body; no joint, teleport or pose assignment.
export function createSoftGripper({world,scene,blocks,getFrame,onSlip,onGrasp}) {
 const pads=[-1,1].map(side=>{
  const rb=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
  const c=world.createCollider(RAPIER.ColliderDesc.cuboid(.0025,.012,.010).setSensor(true),rb);
  const mesh=new T.Mesh(new T.BoxGeometry(.005,.024,.020),new T.MeshStandardMaterial({color:0x20272a,roughness:.85}));
  mesh.name='夹爪接触垫';mesh.castShadow=true;scene.add(mesh);
  return {rb,c,mesh,side};
 });
 let held=null,anchor=null,previous=null,lost=0,closing=false;
 const v=value=>new T.Vector3().copy(value);
 function release(){const block=held;held=null;anchor=null;lost=0;closing=false;return block;}
 function update(opening){
  const frame=getFrame(),dt=PHYSICS.step;
  for(const p of pads){const position=frame.mid.clone().addScaledVector(frame.across,p.side*frame.half);
   p.rb.setTranslation(position,true);p.rb.setRotation(frame.rotation,true);
   p.rb.setNextKinematicTranslation(position);p.rb.setNextKinematicRotation(frame.rotation);
   p.mesh.position.copy(position);p.mesh.quaternion.copy(frame.rotation);
  }
  const velocity=previous?frame.mid.clone().sub(previous.mid).divideScalar(dt):new T.Vector3();
  const spin=previous?frame.rotation.clone().multiply(previous.rotation.clone().invert()):new T.Quaternion();
  if(spin.w<0)spin.set(-spin.x,-spin.y,-spin.z,-spin.w);
  const omega=new T.Vector3(spin.x,spin.y,spin.z).multiplyScalar(2/dt);
  if(previous&&opening<previous.opening-1e-6)closing=true;
  if(previous&&opening>previous.opening+1e-6)release();
  for(const b of blocks){
   const contacts=pads.map(p=>p.c.contactCollider(b.c,.0003));
   const bilateral=contacts.every(c=>c&&c.distance<=.0003);
   const normal=contacts.map(c=>c?Math.min(PHYSICS.clampForce,Math.max(0,-c.distance)*600):0);
   if(!held&&closing&&bilateral){
    held=b;lost=0;
    const inverse=frame.rotation.clone().invert();
    anchor={position:v(b.rb.translation()).sub(frame.mid).applyQuaternion(inverse),rotation:inverse.multiply(new T.Quaternion().copy(b.rb.rotation()))};
    onGrasp(b);
   }
   if(b===held){
    lost=bilateral?0:lost+dt;
    if(lost>.10){release();onSlip();continue;}
    if(!bilateral)continue;
    const offset=anchor.position.clone().applyQuaternion(frame.rotation);
    const desired=frame.mid.clone().add(offset);
    const desiredVelocity=velocity.clone().add(new T.Vector3().crossVectors(omega,offset));
    const force=desired.sub(v(b.rb.translation())).multiplyScalar(65).add(desiredVelocity.sub(v(b.rb.linvel())).multiplyScalar(1.6));
    const along=frame.across.clone().multiplyScalar(force.dot(frame.across));
    const tangent=force.sub(along).clampLength(0,PHYSICS.friction*(normal[0]+normal[1]));
    b.rb.applyImpulse(tangent.add(along.clampLength(0,PHYSICS.clampForce)).multiplyScalar(dt),true);
    const rotation=frame.rotation.clone().multiply(anchor.rotation).multiply(new T.Quaternion().copy(b.rb.rotation()).invert());
    if(rotation.w<0)rotation.set(-rotation.x,-rotation.y,-rotation.z,-rotation.w);
    const torque=new T.Vector3(rotation.x,rotation.y,rotation.z).multiplyScalar(.016).add(omega.clone().sub(v(b.rb.angvel())).multiplyScalar(.0002));
    torque.clampLength(0,PHYSICS.friction*(normal[0]+normal[1])*.006);
    b.rb.applyTorqueImpulse(torque.multiplyScalar(dt),true);
   }else if(closing){
    contacts.forEach((contact,i)=>{
     if(!contact||contact.distance>=0)return;
     const relative=velocity.clone().sub(v(b.rb.linvel())).dot(v(contact.normal1));
     const force=Math.min(PHYSICS.clampForce,Math.max(0,normal[i]+relative*.5));
     b.rb.applyImpulseAtPoint(v(contact.normal1).multiplyScalar(force*dt),contact.point2,true);
    });
   }
  }
  previous={mid:frame.mid.clone(),rotation:frame.rotation.clone(),opening};
 }
 return {pads,update,release,get held(){return held;},latch:block=>held===block};
}
