import * as T from 'three';
import {lightweight} from './render-mode.js';

export async function addPanelArt(meshes,renderer){
 const panel=meshes.find(m=>m.name==='work_panel');if(!panel)return;
 const loader=new T.TextureLoader();
 const [map,titleMap]=await Promise.all([
  loader.loadAsync(`./assets/labels/panel-silkscreen${lightweight?'-lite':''}.svg`),
  loader.loadAsync('./assets/labels/bezel-nameplate.svg')
 ]);
 const material=texture=>{
  texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(16,renderer.getMaxAnisotropy());
  return new T.MeshPhysicalMaterial({map:texture,transparent:true,depthWrite:false,roughness:.48,specularIntensity:.2,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 };
 const print=new T.Mesh(new T.PlaneGeometry(610,432),material(map));
 print.name='panel_vector_silkscreen';print.position.z=95.07;print.receiveShadow=true;print.renderOrder=2;panel.add(print);
 // The old single ink mesh also contains elevated PCB markings. Keep those
 // triangles, replacing only the panel-level graphics with the editable SVG.
 for(const mesh of meshes.filter(m=>m.material.name==='panel_print')){
  const geometry=mesh.geometry.clone(),position=geometry.getAttribute('position'),index=geometry.index;
  const kept=[];
  for(let i=0;i<(index?.count??position.count);i+=3){
   const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;
   if(Math.min(position.getY(a),position.getY(b),position.getY(c))>.099)kept.push(a,b,c);
  }
  geometry.setIndex(kept);mesh.geometry=geometry;
 }
 const bezel=meshes.find(m=>m.name==='screen_bezel'),old=meshes.find(m=>m.material.name==='bezel_print');
 if(bezel&&old){
  bezel.updateWorldMatrix(true,false);old.updateWorldMatrix(true,false);
  old.geometry.computeBoundingBox();const center=old.geometry.boundingBox.getCenter(new T.Vector3());
  old.localToWorld(center);bezel.worldToLocal(center);
  const label=new T.Mesh(new T.PlaneGeometry(350,28),material(titleMap));label.name='bezel_vector_nameplate';
  label.rotation.x=T.MathUtils.degToRad(80);label.position.copy(center).add(new T.Vector3(0,0,.12).applyEuler(label.rotation));
  label.receiveShadow=true;label.renderOrder=2;bezel.add(label);old.visible=false;
 }
}
