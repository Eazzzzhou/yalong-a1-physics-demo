import * as T from 'three';
import {pass,mrt,output,diffuseColor,normalView,packNormalToRGB,unpackRGBToNormal,velocity,metalness,roughness,vec2,vec4,sample} from 'three/tsl';
import {ssgi} from 'three/addons/tsl/display/SSGINode.js';
import {ssr} from 'three/addons/tsl/display/SSRNode.js';
import {traa} from 'three/addons/tsl/display/TRAANode.js';

// Render in scene-linear light; RenderPipeline applies AgX and sRGB once at output.
export function createStudioPost(renderer,scene,camera){
 const pipeline=new T.RenderPipeline(renderer);
 const beauty=pass(scene,camera);
 beauty.setMRT(mrt({output,diffuseColor,normal:packNormalToRGB(normalView),velocity,metalrough:vec2(metalness,roughness)}));
 for(const name of ['diffuseColor','normal','metalrough'])beauty.getTexture(name).type=T.UnsignedByteType;
 beauty.getTexture('velocity').format=T.RGFormat;
 beauty.getTexture('metalrough').format=T.RGFormat;
 const color=beauty.getTextureNode('output'),depth=beauty.getTextureNode('depth');
 const diffuse=beauty.getTextureNode('diffuseColor'),packedNormal=beauty.getTextureNode('normal');
 const normal=sample(uv=>unpackRGBToNormal(packedNormal.sample(uv)));
 const material=beauty.getTextureNode('metalrough');
 const indirect=ssgi(color,depth,normal,camera);
 indirect.useScreenSpaceSampling.value=false;
 indirect.radius.value=.09;
 indirect.thickness.value=.012;
 indirect.sliceCount.value=4;
 indirect.stepCount.value=12;
 indirect.aoIntensity.value=1.05;
 indirect.giIntensity.value=1.6;
 const reflection=ssr(color,depth,normal,{metalnessNode:material.r,roughnessNode:material.g,diffuseNode:diffuse,reflectNonMetals:true,binaryRefine:true,camera});
 reflection.resolutionScale=1;
 reflection.maxDistance.value=.65;
 reflection.thickness.value=.006;
 reflection.quality.value=.8;
 reflection.intensity.value=.5;
 const combined=vec4(color.rgb.mul(indirect.getAONode()).add(diffuse.rgb.mul(indirect.getGINode().rgb)).add(reflection.rgb),color.a);
 const temporal=traa(combined,depth,beauty.getTextureNode('velocity'),camera);
 pipeline.outputNode=temporal;
 return {pipeline,beauty,indirect,reflection,temporal,render(){pipeline.render();}};
}
