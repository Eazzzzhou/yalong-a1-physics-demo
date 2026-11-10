import * as T from 'three';
import {laboratoryWood} from './wood-texture.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export async function createLaboratory(renderer){
 const root=new T.Group();root.name='自然光实验室';
 const paint=new T.MeshStandardMaterial({color:'#d7d8ce',roughness:.9});
 const steel=new T.MeshStandardMaterial({color:'#38474a',roughness:.45,metalness:.65});
 const oak=await laboratoryWood(renderer);
 function box(name,size,pos,material=paint){
  const mesh=new T.Mesh(new T.BoxGeometry(...size),material);mesh.name=name;mesh.position.set(...pos);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;
 }
 const top=box('实验台木桌面',[1.8,.045,1.12],[0,-.0225,0],oak);
 top.geometry.dispose();top.geometry=new RoundedBoxGeometry(1.8,.045,1.12,3,.003);
 const p=top.geometry.attributes.position,n=top.geometry.attributes.normal,uv=top.geometry.attributes.uv;
 for(let i=0;i<p.count;i++){
  if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)/1.5,p.getZ(i)/1.5);
  else if(Math.abs(n.getZ(i))>.5)uv.setXY(i,p.getX(i)/1.5,p.getY(i)/1.5);
  else uv.setXY(i,p.getZ(i)/1.5,p.getY(i)/1.5);
 }
 for(const x of [-.78,.78])for(const z of [-.44,.44])box('实验台钢架腿',[.035,.72,.035],[x,-.40,z],steel);
 box('桌后钢架横梁',[1.6,.07,.035],[0,-.18,-.44],steel);
 return {root,setScale(s){root.scale.setScalar(s);},setHeight(y){root.position.y=y;}};
}
