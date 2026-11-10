import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {createSoftGripper} from './soft-gripper.js';
import {createRobotPhysics, PHYSICS} from './robot-physics.js';
export async function initTeachingDemo({scene,model,renderer,camera,controls}){
 await RAPIER.init();
 const world=new RAPIER.World({x:0,y:-9.81,z:0});world.timestep=PHYSICS.step;world.integrationParameters.lengthUnit=.1;world.numSolverIterations=12;
 const status=document.querySelector('#action-status');const say=t=>status.textContent=t;
 const objects=new Map();model.traverse(o=>objects.set(o.name,o));const find=n=>{const o=objects.get(n);if(!o)throw Error('Missing '+n);return o};
 const root=find('arm4-rebuilt-root'),groups=['J1','J2','J3'].map(j=>find('rig-'+j));
 const initial=[-58.7,-12,-6].map(T.MathUtils.degToRad),rest=groups.map(g=>g.quaternion.clone());
 const jaws=[find('rig-jaw_left'),find('rig-jaw_right')],jawRest=jaws.map(o=>o.quaternion.clone());const jawAxis=new T.Vector3(0,.6,.8).normalize();
 const plate=new T.Box3().setFromObject(find('base_mounting_plate')).getCenter(new T.Vector3());
 const yaw=new T.Group();yaw.name='底座竖直转轴';scene.add(yaw);yaw.position.copy(plate);yaw.attach(root);
 const tipNodes=['jaw_left_cross_spacer_2','jaw_right_cross_spacer_2'].map(find);const centers=tipNodes.map(o=>{o.geometry.computeBoundingBox();return o.geometry.boundingBox.getCenter(new T.Vector3())});
 let tcp=null;const rawtip=()=>centers.map((p,i)=>tipNodes[i].localToWorld(p.clone())).reduce((a,b)=>a.add(b)).multiplyScalar(.5);
 const tip=()=>tcp?find('rig-J3').localToWorld(tcp.clone()):rawtip();const axisX=new T.Vector3(1,0,0);let q=[0,...initial],opening=10;
 function pose(values=q,open=opening){q=[...values];opening=open;yaw.rotation.y=q[0];groups.forEach((g,i)=>g.quaternion.copy(rest[i]).multiply(new T.Quaternion().setFromAxisAngle(axisX,q[i+1]-initial[i])));jaws.forEach((g,i)=>g.quaternion.copy(jawRest[i]).multiply(new T.Quaternion().setFromAxisAngle(jawAxis,T.MathUtils.degToRad(open-14)*(i===0?1:-1))));scene.updateMatrixWorld(true);}
 const wrist=()=>find('rig-J3').getWorldPosition(new T.Vector3());
 pose(q,0);tcp=find('rig-J3').worldToLocal(rawtip());pose(q,10);const limits=[[-2.6,2.6],[-1.65,1.45],[-1.6,1.5],[-2.8,2.8]];
 function residual(target){const t=tip(),dir=t.clone().sub(wrist()).normalize();return [target.x-t.x,target.y-t.y,target.z-t.z,-dir.x*.008,(-1-dir.y)*.008,-dir.z*.008];}
 function solveOnce(target,seed=q){let a=[...seed];pose(a,10);let best=[...a],bestCost=Infinity;
  for(let it=0;it<130;it++){
   pose(a,10);const e=residual(target),cost=e.reduce((s,x)=>s+x*x,0);if(cost<bestCost){bestCost=cost;best=[...a]};if(cost<1e-8)break;
   const J=[];for(let k=0;k<4;k++){const b=[...a];b[k]+=.001;pose(b,10);const f=residual(target);J[k]=e.map((v,i)=>(v-f[i])/.001)}
   const A=Array.from({length:4},(_,i)=>Array.from({length:5},(_,j)=>j===4?J[i].reduce((s,x,k)=>s+x*e[k],0):J[i].reduce((s,x,k)=>s+x*J[j][k],0)+(i===j?.00001:0)));
   for(let k=0;k<4;k++){let p=k;for(let i=k+1;i<4;i++)if(Math.abs(A[i][k])>Math.abs(A[p][k]))p=i;[A[k],A[p]]=[A[p],A[k]];const d=A[k][k]||1e-10;for(let j=k;j<5;j++)A[k][j]/=d;for(let i=0;i<4;i++)if(i!==k){const m=A[i][k];for(let j=k;j<5;j++)A[i][j]-=m*A[k][j]}}
   const old=[...a];let accepted=false;for(const step of [1,.5,.2,.05]){const b=old.map((v,k)=>T.MathUtils.clamp(v+T.MathUtils.clamp(A[k][4],-.25,.25)*step,...limits[k]));pose(b,10);const rr=residual(target);if(rr.reduce((s,x)=>s+x*x,0)<cost){a=b;accepted=true;break}}if(!accepted)break;
  }
  pose(best,10);return {angles:best,error:tip().distanceTo(target),cost:bestCost};
 }
 function solve(target,seed=q,open=opening){
  const ya=-Math.atan2(target.z-plate.z,target.x-plate.x);
  const candidates=[seed,[ya,-.5,.9,-1.8],[ya,-1,1.3,-1.5],[ya,.4,-1,-1],[ya,-.8,-.9,1.6]].map(s=>solveOnce(target,s));
  let best=null;
  for(const r of candidates){
   pose(r.angles,open);if(physics.collision())continue;
   r.travel=r.angles.reduce((sum,v,i)=>sum+(v-seed[i])**2,0);
   if(r.error<.006&&(!best||r.travel<best.travel))best=r;
  }
  if(!best){pose(seed,open);throw Error('目标没有无碰撞的可达姿势，请调整目标或复位');}
  pose(best.angles,open);return best;
 }
 const cloud=new T.Group();cloud.name='云台折倒轴';scene.add(cloud);cloud.position.set(.114,.130,-.154);
 model.traverse(o=>{});const moving=[];model.traverse(o=>{if(o.isMesh&&(o.name.startsWith('camera_')||o.name.startsWith('gimbal_folded_side')))moving.push(o)});moving.forEach(o=>cloud.attach(o));cloud.rotation.x=Math.PI/2;
 // Reachable physical work areas remain clear of buttons and sensor sockets.
 const sources=[new T.Vector3(-.235,.109,.135),new T.Vector3(-.235,.109,.185),new T.Vector3(-.155,.109,.165)];
 const drops=[new T.Vector3(-.055,.109,.030),new T.Vector3(.020,.109,.030),new T.Vector3(.095,.109,.030)];
 const blocks=sources.map((p,i)=>{const sourceRotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-Math.atan2(p.z-plate.z,p.x-plate.x)+Math.PI/2);const rb=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setRotation(sourceRotation).setCanSleep(true).setCcdEnabled(true));const c=world.createCollider(RAPIER.ColliderDesc.cuboid(.011,.011,.011).setMass(.015).setFriction(1.5).setRestitution(.02),rb);const mesh=new T.Mesh(new T.BoxGeometry(.022,.022,.022),new T.MeshStandardMaterial({color:[0xd5a24a,0x79a9ac,0xc37c60][i],roughness:.55}));mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return {rb,c,mesh,sourceRotation,done:false}});
 for(const [name,p,w,d]of [['取料区',new T.Vector3(-.195,.0955,.160),.13,.10],['放置区',new T.Vector3(.020,.0955,.03),.200,.06]]){const mesh=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({color:0x4e6963,roughness:.85,transparent:true,opacity:.30,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.copy(p);scene.add(mesh)}
 let graspFailure=null;
 const gripper=createSoftGripper({world,scene,blocks,getFrame(){
  const a=tipNodes[0].localToWorld(centers[0].clone()),b=tipNodes[1].localToWorld(centers[1].clone());
  const mid=a.clone().add(b).multiplyScalar(.5),across=b.clone().sub(a).normalize();
  const along=mid.clone().sub(wrist()).normalize();along.addScaledVector(across,-along.dot(across)).normalize();
  return {mid,across,half:a.distanceTo(b)/2,rotation:new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(across,along,new T.Vector3().crossVectors(across,along)))};
 },onGrasp(block){events.push({type:'friction-grasp',time:simTime,index:blocks.indexOf(block)})},onSlip(){
  graspFailure='夹持接触丢失，方块已滑落；请复位后重试';events.push({type:'grip-slip',time:simTime});say(graspFailure);
 }});
 const pads=gripper.pads,release=()=>gripper.release(),latch=block=>gripper.latch(block);
 const clearanceAudit=[];let lastAudit=0;const armMeshes=[];root.traverse(o=>{if(o.isMesh&&!/cable|lead|grommet/.test(o.name))armMeshes.push(o)});let simTime=0,acc=0,last=performance.now(),token=0,busy=false,cloudUp=false;const events=[];const waiters=[];
 function delay(seconds,id){return new Promise((resolve,reject)=>waiters.push({end:simTime+seconds,id,resolve,reject}))}
 let motion=null;
 function checkedPose(values,open=opening){
  const from=[...q],fromOpen=opening;
  const steps=Math.max(1,Math.ceil(Math.max(...values.map((v,i)=>Math.abs(v-from[i])),Math.abs(open-fromOpen)*Math.PI/180)/.004));
  for(let s=1;s<=steps;s++){
   const safe=[...q],safeOpen=opening,next=from.map((v,i)=>v+(values[i]-v)*s/steps);
   if(next.some((v,i)=>v<limits[i][0]||v>limits[i][1]))throw Error('到达关节机械限位，动作已停止');
   pose(next,fromOpen+(open-fromOpen)*s/steps);
   const hit=physics.collision();
   if(hit){pose(safe,safeOpen);events.push({type:'collision-stop',...hit,time:simTime,q:[...q]});throw Error(physics.describe(hit));}
  }
 }
 function tween(to,seconds,id,open=opening){
  const distance=Math.max(...to.map((v,i)=>Math.abs(v-q[i])));
  const duration=Math.max(seconds,1.5*distance/PHYSICS.maxJointSpeed,Math.abs(open-opening)/18,PHYSICS.step);
  return new Promise((resolve,reject)=>{motion={to:[...to],open,from:[...q],fromOpen:opening,elapsed:0,duration,id,resolve,reject};});
 }
 async function move(target,seconds,id,open=opening){const from=[...q],fromOpen=opening;let result;try{result=solve(target,from,open)}finally{pose(from,fromOpen)}await tween(result.angles,seconds,id,open);return result}
 const homeResult={angles:[0,...[-54,-80.5,84].map(T.MathUtils.degToRad)],error:0};const home=homeResult.angles;home[0]=0;pose(home,10);
 scene.updateMatrixWorld(true);
 const physics=await createRobotPhysics({world,objects,root,cloud,blocks});
 let lessonActive=false,exploded=false,prepareScene=async()=>{};
 function enabled(){
  for(const id of ['arm-start','gimbal-start','explode-start'])document.querySelector('#'+id).disabled=busy;
  document.querySelector('#reset').disabled=lessonActive;
 }
 function beginLesson(){
  if(busy)return false;
  lessonActive=true;busy=true;graspFailure=null;++token;enabled();return true;
 }
 function endLesson(){
  if(!lessonActive)return;
  lessonActive=false;busy=false;enabled();
 }
 async function armAction(){if(busy)return;const block=blocks.find(b=>!b.done);if(!block){say('方块已全部搬运，请复位');return}busy=true;graspFailure=null;enabled();const id=++token;
  try{await prepareScene();say('机械臂：抬起并转向取料区');const lift=[...q];lift[1]=Math.min(lift[1]+.28,1.4);lift[3]-=.28;await tween(lift,.9,id,12);const p=new T.Vector3().copy(block.rb.translation());await move(p.clone().add(new T.Vector3(0,.04,0)),1.8,id,12);say('机械臂：接近方块');await move(p.clone().add(new T.Vector3(0,.002,0)),1.5,id,12);
   say('机械臂：合爪');await tween(q,1,id,0);await delay(.25,id);if(!latch(block))throw Error('夹爪未形成双侧接触，请复位后重试');await move(p.clone().add(new T.Vector3(0,.06,0)),1.8,id,0);
   const index=blocks.indexOf(block),drop=drops[index];say('机械臂：转向放置区');await move(drop.clone().add(new T.Vector3(0,.06,0)),2.5,id,0);say('机械臂：降低、松爪');await move(drop.clone().add(new T.Vector3(0,.014,0)),1.6,id,0);release();await tween(q,.8,id,12);await delay(.5,id);const actual=block.rb.translation();if(Math.hypot(actual.x-drop.x,actual.z-drop.z)>.022||Math.abs(actual.y-.106)>.01)throw Error('方块未落稳在放置区，请复位后重试');block.done=true;await move(drop.clone().add(new T.Vector3(0,.07,0)),1.5,id,12);await tween(home,2.5,id,12);events.push({type:'placed',index,time:simTime});say('搬运完成，可再次启动或复位');
  }catch(e){if(id===token){release();say(e.message);events.push({type:'error',message:e.message})}}finally{if(id===token){busy=false;enabled()}}
 }
 function checkedCloud(angle){
  const from=cloud.rotation.x,steps=Math.max(1,Math.ceil(Math.abs(angle-from)/.004));
  for(let i=1;i<=steps;i++){
   const safe=cloud.rotation.x;cloud.rotation.x=from+(angle-from)*i/steps;scene.updateMatrixWorld(true);
   const hit=physics.collision();if(hit){cloud.rotation.x=safe;scene.updateMatrixWorld(true);events.push({type:'collision-stop',...hit,time:simTime});throw Error(physics.describe(hit));}
  }
 }
 async function foldCloud(angle,seconds,id){const from=cloud.rotation.x,t=simTime;while(simTime-t<seconds){checkedCloud(from+(angle-from)*T.MathUtils.smoothstep((simTime-t)/seconds,0,1));await delay(PHYSICS.step,id)}checkedCloud(angle);cloudUp=angle===0;}
 async function gimbalAction(){if(busy)return;if(cloudUp){say('云台已升起');return}busy=true;enabled();const id=++token;try{await prepareScene();say('云台：升起');await foldCloud(0,2,id);say('云台已到工作位置')}catch(error){if(id===token)say(error.message)}finally{if(id===token){busy=false;enabled()}}}
 let resetting=false;
 async function reset(){
  if(resetting||lessonActive)return;
  resetting=true;const id=++token;busy=true;graspFailure=null;
  if(motion){const previous=motion;motion=null;previous.reject(Error('动作已取消'));}
  enabled();
  try{
   await prepareScene();say('复位：安全收回');
   release();await tween(q,.6,id,12);
   await tween(home,2.5,id,10);await foldCloud(Math.PI/2,2,id);
   for(let i=0;i<blocks.length;i++){const b=blocks[i];b.rb.setTranslation(sources[i],true);b.rb.setLinvel({x:0,y:0,z:0},true);b.rb.setAngvel({x:0,y:0,z:0},true);b.rb.setRotation(b.sourceRotation,true);b.done=false}
   say('已复位：机械臂放平，云台倒下');events.push({type:'reset',time:simTime});
  }catch(error){say(error.message)}finally{resetting=false;if(id===token){busy=false;enabled()}}
 }
 const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#202726';ctx.font='108px Microsoft YaHei';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('复位',256,64);const tx=new T.CanvasTexture(labelCanvas);tx.colorSpace=T.SRGBColorSpace;const resetLabel=new T.Mesh(new T.PlaneGeometry(.022,.006),new T.MeshStandardMaterial({map:tx,transparent:true,depthWrite:false,roughness:.48,metalness:0}));resetLabel.rotation.x=-Math.PI/2;resetLabel.position.set(.229,.0951,-.022);scene.add(resetLabel);find('work_panel').attach(resetLabel);const buttons=[find('button_cap_0'),find('button_cap_1'),find('button_cap_2')],actions=[armAction,gimbalAction,reset];const ray=new T.Raycaster(),mouse=new T.Vector2();let down;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(buttons)[0];if(hit)activate(buttons.indexOf(hit.object))});
 function activate(i){if(lessonActive||(busy&&i!==2))return;const b=buttons[i],p=b.position.clone();b.position.y-=.0012;setTimeout(()=>b.position.copy(p),180);actions[i]()}['arm-start','gimbal-start','reset'].forEach((id,i)=>document.querySelector('#'+id).onclick=()=>activate(i));
 function update(now){
  if(exploded){last=now;acc=0;return;}
  acc+=Math.min((now-last)/1000,.05);last=now;
  while(acc>=PHYSICS.step){
   if(motion){const m=motion;try{
    if(m.id!==token)throw Error('动作已取消');
    if(graspFailure)throw Error(graspFailure);
    m.elapsed+=PHYSICS.step;const t=Math.min(1,m.elapsed/m.duration),u=t*t*(3-2*t);
    checkedPose(m.from.map((v,i)=>v+(m.to[i]-v)*u),m.fromOpen+(m.open-m.fromOpen)*u);
    if(t===1){motion=null;m.resolve();}
   }catch(error){motion=null;m.reject(error);}}
   physics.sync();gripper.update(opening);world.step();simTime+=PHYSICS.step;acc-=PHYSICS.step;
   for(let i=waiters.length-1;i>=0;i--){const w=waiters[i];if(w.id!==token){waiters.splice(i,1);w.reject(Error('动作已取消'))}else if(simTime>=w.end){waiters.splice(i,1);w.resolve()}}
  }
  for(const b of blocks){b.mesh.position.copy(b.rb.translation());b.mesh.quaternion.copy(b.rb.rotation())}
 }
 say('就绪：点击箱内绿、黄、红按钮，或使用上方控制');
 return {setBeforeAction:callback=>prepareScene=callback,setExploded:value=>{exploded=value;for(const p of pads)p.mesh.visible=!value;},update,armAction,gimbalAction,reset,pose,checkedPose,movePose:(target,ms)=>tween(target.q,ms/1000,token,target.opening),solve,tip,blocks,world,events,beginLesson,endLesson,get home(){return [...home]},get state(){return {q:[...q],opening,busy,lessonActive,cloudUp,held:!!gripper.held,simTime,homeError:homeResult.error,tip:tip().toArray()}},cloud,pads,root,objects,clearanceAudit,physics};
}










