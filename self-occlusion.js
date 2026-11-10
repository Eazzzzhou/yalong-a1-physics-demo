import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

let bakedParts;
export async function applySelfOcclusion(meshes){
 if(!bakedParts)bakedParts=new GLTFLoader().loadAsync('./assets/equipment-self-ao.glb').then(gltf=>{
  const parts=new Map();gltf.scene.traverse(mesh=>{if(mesh.isMesh)parts.set(mesh.name,mesh);});return parts;
 });
 const parts=await bakedParts;
 for(const mesh of meshes){
  const baked=parts.get(mesh.name);if(!baked)continue;
  mesh.geometry=baked.geometry.clone();
  const ao=baked.material.map;
  ao.colorSpace=T.NoColorSpace;
  mesh.material.aoMap=ao;
  mesh.material.aoMapIntensity=.55;
 }
}
