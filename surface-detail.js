import * as T from 'three';
import {addServoLabels} from './servo-labels.js';
import {lightweight} from './render-mode.js';
import {addPanelArt} from './panel-art.js';
import {applyFinish} from './finish-calibration.js';
import {refineButtons} from './button-detail.js';

// A separate UV set preserves the panel printing and the user's replacement UVs.
// Capture rest-pose coordinates once: the finish then travels with each rig part.
export async function restoreSurfaceDetail(meshes,renderer,worldScale=1){
 refineButtons(meshes);
 if(!lightweight)await (await import('./self-occlusion.js')).applySelfOcclusion(meshes);
 const loader=new T.TextureLoader(),cache=new Map();
 async function detail(asset,channel,resolution='1K'){
  const key=asset+channel;
  if(!cache.has(key))cache.set(key,loader.loadAsync(`./assets/${lightweight?'lite-materials':'materials'}/${asset}/${asset}_${lightweight?'1K':resolution}-JPG_${channel}.jpg`).then(t=>{
   t.colorSpace=T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.channel=2;
   t.anisotropy=Math.min(8,renderer.getMaxAnisotropy());return t;
  }));
  return cache.get(key);
 }
 const [grain,rough,plasticColor,panelNormal,panelRough,brushed,metalRough]=await Promise.all([
  detail('Plastic012A','NormalGL'),detail('Plastic012A','Roughness'),detail('Plastic012A','Color'),
  detail('Plastic013A','NormalGL'),detail('Plastic013A','Roughness'),
  detail('Metal009','NormalGL','2K'),detail('Metal009','Roughness','2K')
 ]);
 plasticColor.colorSpace=T.SRGBColorSpace;
 const maps={grain,rough,plasticColor,panelNormal,panelRough,brushed,metalRough};
 for(const mesh of meshes){
  const m=mesh.material,name=m.name;
  let finish;
  if(name==='black.001')finish=mesh.name.startsWith('jaw_')&&!mesh.name.includes('gear')?'jaw':'blackMetal';
  else if(name==='green.001')finish='servo';
  else if(name==='plastic'||name.startsWith('Photo_Gimbal'))finish='blackPlastic';
  else if(name==='M_black_powder')finish=mesh.name==='screen_bezel'?'bezel':/^gimbal_(base|turntable)$/.test(mesh.name)?'blackMetal':'blackPlastic';
  else finish={M_case_paint_silver:'caseAluminum',M_panel_paint:'panel',M_alu_brushed:'aluminum',M_chrome:'trim',M_steel_satin:'steel',steel:'darkFastener',M_rubber_grip:'grip','rubber.001':'grip'}[name];
  if(name.startsWith('M_button_'))finish='button';
  if(name==='panel_print'){
   mesh.position.y+=.00065*worldScale;mesh.castShadow=false;
   m.color.set('#111512');m.roughness=.48;m.metalness=0;
  }
  if(!finish)continue;
  const caseAluminum=finish==='caseAluminum',metal=['aluminum','steel','trim','darkFastener'].includes(finish),panel=finish==='panel';
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry.clone(),p=g.getAttribute('position'),n=g.getAttribute('normal');
  const uv=new Float32Array(p.count*2),v=new T.Vector3(),normal=new T.Vector3();
  const nm=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),tile=(caseAluminum?.30:metal?.14:panel?.28:.12)*worldScale;
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).divideScalar(tile);
   normal.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();
   const ax=Math.abs(normal.x),ay=Math.abs(normal.y),az=Math.abs(normal.z);
   if(ax>=ay&&ax>=az){uv[2*i]=v.z;uv[2*i+1]=v.y;}
   else if(ay>=az){uv[2*i]=v.x;uv[2*i+1]=v.z;}
   else {uv[2*i]=v.x;uv[2*i+1]=v.y;}
  }
  g.setAttribute('uv2',new T.BufferAttribute(uv,2));g.deleteAttribute('tangent');mesh.geometry=g;
  applyFinish(m,finish,maps);
 }
 await addServoLabels(meshes,renderer);
 await addPanelArt(meshes,renderer);
}
