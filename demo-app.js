import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {lightweight,modelURL,pixelRatio,openLightweight} from './render-mode.js';
import {createStudio} from './studio-stage.js';
import {restoreSurfaceDetail} from './surface-detail.js';
import {selectionIndicator} from './selection-indicator.js';
import {partLabel} from './part-labels.js';
import {createExploder} from './explode-preview.js';
import {createLessonScreen} from './lesson-screen.js';
import {createLessonRunner} from './lesson-runner.js';
import {initLessonPanel} from './lesson-panel.js';

const $=selector=>document.querySelector(selector);
const views={teaching:[[.18,.42,1.05],[0,.26,-.055],1],wide:[[1.25,1.19,1.73],[0,.255,-.025],1],medium:[[.72,.82,.60],[0,.15,-.015],1.1],close:[[.42,.46,.36],[.04,.16,-.05],1.25],detail:[[.5,.37,.61],[0,.19,-.05],1.3],all:[[1.25,1.19,1.73],[0,.255,-.025],1],arm:[[.30,.40,.65],[-.10,.16,0],1],gimbal:[[.33,.29,.15],[.114,.17,-.145],1],top:[[0,1.3,.001],[0,.1,0],1]};
const environments={foundry:'实拍铸造车间',workshop:'实拍车间 · 大窗日光',metalStudio:'实拍摄影棚',light:'中性柔光棚',dark:'深灰摄影棚',warm:'暖色摄影棚'};

async function start(){
 const query=new URLSearchParams(location.search),view=query.get('view')||'teaching',environment=query.get('env')||'foundry';
 if(!Object.hasOwn(views,view)||!Object.hasOwn(environments,environment))throw Error('链接中的场景或视角不存在，请打开首页');
 if(!lightweight&&(!navigator.gpu||!await navigator.gpu.requestAdapter()))return openLightweight();
 const renderer=new T.WebGPURenderer({antialias:lightweight,forceWebGL:lightweight});
 await renderer.init();
 if(!lightweight&&!renderer.backend.isWebGPUBackend){renderer.dispose();return openLightweight();}
 renderer.setPixelRatio(pixelRatio);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 const host=$('#viewport');host.prepend(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.01,100);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.18;controls.maxDistance=4;
 const key=new T.DirectionalLight('#fff7eb',2.4);key.castShadow=true;scene.add(key);
 const fill=new T.DirectionalLight('#e7efff',.8);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#d4d8cb',roughness:.85}));
 floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 const stage=await createStudio(scene,renderer,floor,key,fill);stage.setScale(.315);
 $('#loading').textContent='正在加载实验箱…';
 const model=(await new GLTFLoader().loadAsync(modelURL)).scene;
 const meshes=[];model.traverse(o=>{if(o.isMesh&&o.visible){o.material=o.material.clone();o.castShadow=o.receiveShadow=true;meshes.push(o);}});
 scene.add(model);model.updateMatrixWorld(true);
 await restoreSurfaceDetail(meshes,renderer,1);
 const bounds=new T.Box3();for(const m of meshes){m.geometry.computeBoundingBox();bounds.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));}
 floor.position.y=bounds.min.y-.0004;
 $('#loading').textContent='正在准备机械臂与碰撞模型…';
 const {initTeachingDemo}=await import('./teaching-bundle.js');
 const teaching=await initTeachingDemo({scene,model,renderer,camera,controls});window.teaching=teaching;
 const exploder=createExploder({teaching,onStatus:message=>$('#action-status').textContent=message});
 const screen=createLessonScreen({teaching,renderer});
 const runner=createLessonRunner({teaching,exploder,screen});initLessonPanel({runner});
 let selected=[];
 const indicator=selectionIndicator(scene,()=>selected,()=>camera);
 const post=lightweight?{render:()=>renderer.render(scene,camera)}:(await import('./studio-post.js')).createStudioPost(renderer,scene,camera,stage);
 function resize(){
  const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;
  camera.zoom=$('#camera-view').value==='teaching'?Math.min(1,camera.aspect/1.15):views[$('#camera-view').value][2];camera.updateProjectionMatrix();
 }
 function setView(id){const v=views[id];$('#camera-view').value=id;camera.position.set(...v[0]);controls.target.set(...v[1]);resize();controls.update();}
 async function setEnvironment(id){await stage.apply(id);$('#environment').value=id;$('.viewport-label').textContent=environments[id];}
 await setEnvironment(environment);setView(view);new ResizeObserver(resize).observe(host);
 $('#camera-view').onchange=e=>setView(e.target.value);$('#reset-view').onclick=()=>setView('teaching');
 $('#environment').onchange=async e=>{try{await setEnvironment(e.target.value)}catch(error){$('#action-status').textContent='场景加载失败：'+error.message;}};
 $('#environment-rotation').oninput=e=>{stage.rotate(+e.target.value);$('#environment-angle').value=e.target.value+'°';};
 $('#explode-start').onclick=()=>{setView('wide');exploder.toggle();};
 $('#fullscreen').onclick=()=>document.documentElement.requestFullscreen();
 $('#snapshot').onclick=()=>{post.render();renderer.domElement.toBlob(blob=>{
  if(!blob){$('#action-status').textContent='画面保存失败，请重试';return;}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='亚龙实验箱.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 });};
 const ray=new T.Raycaster();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointercancel',()=>down=null);
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!down)return;const moved=Math.hypot(e.clientX-down[0],e.clientY-down[1]);down=null;if(moved>5)return;
  const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
  const hit=ray.intersectObjects(meshes,false)[0];selected=hit?[hit.object]:[];
  const target=$('#target');target.replaceChildren(new Option(hit?'零件 · '+partLabel(hit.object.name):'',hit?'mesh:'+hit.object.uuid:''));
 });
 renderer.setAnimationLoop(now=>{teaching.update(now);exploder.update(now);scene.updateMatrixWorld(true);controls.update();camera.updateMatrixWorld(true);indicator.update();stage.update();post.render();});
 $('#loading').classList.add('hidden');
 document.querySelectorAll('.motion-actions button,#camera-view,#reset-view,#snapshot').forEach(button=>button.disabled=false);
 window.renderLab={scene,renderer,camera,post,teaching,exploder,stage,meshes,runner,get state(){return {environment:$('#environment').value,exploded:exploder.exploded,target:$('#target').value};}};
}
await start();
