import * as T from 'three';
import {texture,color,mix} from 'three/tsl';
import {lightweight} from './render-mode.js';

// CC0 photographic finish; source and licence are alongside the local maps.
export async function laboratoryWood(renderer){
 const loader=new T.TextureLoader();
 const [map,normalMap,roughnessMap]=await Promise.all(['diff','nor_gl','rough'].map(channel=>loader.loadAsync(`./assets/${lightweight?'lite-materials':'polyhaven'}/wood_table_001/${channel}.jpg`)));
 for(const texture of [map,normalMap,roughnessMap]){
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.anisotropy=Math.min(16,renderer.getMaxAnisotropy());
 }
 map.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshPhysicalNodeMaterial({map,normalMap,normalScale:new T.Vector2(.018,.018),metalness:0,clearcoat:.025,clearcoatRoughness:.45});
 // Retain the photographed grain at physical scale, with a quiet matte finish.
 material.colorNode=mix(texture(map).rgb,color('#8e8070'),.65);
 material.roughnessNode=texture(roughnessMap).g.mul(.22).add(.6);
 return material;
}
