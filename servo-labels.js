import * as T from 'three';

// These are the same construction frames as arm4-mid/full/build.py, in CAD mm.
// Labels are children of the actual housing, so joint motion and explosion carry them.
export async function addServoLabels(meshes,renderer){
 const theta=Math.atan2(.227,.196),rx=a=>new T.Matrix4().makeRotationX(a);
 const mid=rx(theta).setPosition(0,39.2,118.4),base=rx(Math.PI).setPosition(0,-20.8,19.6),jaw=rx(Math.atan2(.8,.6));
 const specs={
  base_servo_metal_housing:{frame:base,center:[-8,12,18.12],u:[1,0,0],v:[0,1,0],size:[48,40],opposite:36.24},
  mid__lower_servo_metal_housing:{frame:mid,center:[-8,-16.12,17],u:[1,0,0],v:[0,0,1],size:[48,44],opposite:32.24},
  mid__upper_servo_metal_housing:{frame:mid,center:[-8,12,138.078326],u:[1,0,0],v:[0,1,0],size:[48,40],opposite:36.24},
  gripper_servo_metal_housing:{frame:jaw,center:[-4,189.88,162],u:[1,0,0],v:[0,0,1],size:[48,40],opposite:38.24}
 };
 const targets=meshes.filter(m=>specs[m.name]);if(!targets.length)return;
 const map=await new T.TextureLoader().loadAsync('./assets/labels/servo-25kg.svg');
 map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.getMaxAnisotropy());
 const material=new T.MeshPhysicalMaterial({map,roughness:.32,metalness:0,clearcoat:.42,clearcoatRoughness:.22,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 for(const housing of targets){
  const spec=specs[housing.name],u=new T.Vector3(...spec.u),v=new T.Vector3(...spec.v),normal=new T.Vector3().crossVectors(u,v),center=new T.Vector3(...spec.center);
  for(const side of [1,-1]){
   const label=new T.Mesh(new T.PlaneGeometry(...spec.size),material);
   label.name=`finish_label_${housing.name}_${side}`;
   const position=center.clone();if(side<0)position.addScaledVector(normal,-spec.opposite);
   const basis=new T.Matrix4().makeBasis(u.clone().multiplyScalar(side),v,normal.clone().multiplyScalar(side));
   label.matrix.copy(spec.frame).multiply(basis.setPosition(position));label.matrix.decompose(label.position,label.quaternion,label.scale);
   label.receiveShadow=true;label.renderOrder=1;housing.add(label);
  }
 }
}
