// Calibrated against user photos 02 / 04 / 07, under workshop + studio lighting.
// Descriptions are observed appearance; coating/anodizing processes are unverified.
// Roughness is a multiplier when a texture is used, not the final surface value.
export const finishes={
 blackMetal:{surface:'黑色半哑光支架；按涂覆表层校准，阳极氧化或喷涂工艺未确认',parameters:{color:'#111613',metalness:.08,roughness:1.05,specularIntensity:.65,clearcoat:.12,clearcoatRoughness:.34,anisotropy:0},maps:{map:null,normalMap:'grain',roughnessMap:'rough'},normal:.045},
 jaw:{surface:'黑色低光泽夹爪板，工艺未确认',parameters:{color:'#131714',metalness:.08,roughness:1.25,specularIntensity:.6,clearcoat:0,anisotropy:0},maps:{map:null,normalMap:'grain',roughnessMap:'rough'},normal:.065},
 blackPlastic:{surface:'黑色模制外壳，细哑光',parameters:{color:'#aeb3af',metalness:0,roughness:1.15,specularIntensity:.65,clearcoat:0},maps:{map:'plasticColor',normalMap:'grain',roughnessMap:'rough'},normal:.09},
 servo:{surface:'舵机壳体：黑色半光泽表面与独立标签',parameters:{color:'#111713',metalness:.08,roughness:.9,specularIntensity:.7,clearcoat:.18,clearcoatRoughness:.26},maps:{map:null,normalMap:'grain',roughnessMap:'rough'},normal:.04},
 bezel:{surface:'屏幕黑色光洁边框，照片可见较完整反射',parameters:{color:'#0b0e0c',metalness:0,roughness:.8,specularIntensity:.6,clearcoat:.28,clearcoatRoughness:.2},maps:{map:null,normalMap:'grain',roughnessMap:'rough'},normal:.016},
 panel:{surface:'白色有光泽印刷面板，覆膜或喷涂工艺未确认',parameters:{color:'#f0f1ed',metalness:0,roughness:.65,specularIntensity:.85,clearcoat:.55,clearcoatRoughness:.13},maps:{map:null,normalMap:'panelNormal',roughnessMap:'panelRough'},normal:.022},
 caseAluminum:{surface:'银色箱壳，低光泽细纹表面',parameters:{color:'#b8bcba',metalness:.75,roughness:.95,clearcoat:0,anisotropy:.25},maps:{map:null,normalMap:'brushed',roughnessMap:'metalRough'},normal:.025},
 aluminum:{surface:'银色拉丝铝件，保留方向性反射',parameters:{color:'#c7ccce',metalness:1,roughness:.55,clearcoat:0,anisotropy:.35},maps:{map:null,normalMap:'brushed',roughnessMap:'metalRough'},normal:.025},
 trim:{surface:'亮银色包边及外露紧固件，具体镀层未确认',parameters:{color:'#d0d5d3',metalness:1,roughness:.19,clearcoat:0,anisotropy:.1},maps:{map:null,normalMap:'brushed',roughnessMap:null},normal:.01},
 steel:{surface:'银色缎面钢件',parameters:{color:'#aeb6b6',metalness:1,roughness:.8,clearcoat:0},maps:{map:null,normalMap:'brushed',roughnessMap:'metalRough'},normal:.025},
 darkFastener:{surface:'机械臂深色紧固件，表面处理未确认',parameters:{color:'#252b27',metalness:.7,roughness:.85,clearcoat:0},maps:{map:null,normalMap:'brushed',roughnessMap:'metalRough'},normal:.02},
 grip:{surface:'黑色橡胶把手和脚垫，低反光',parameters:{color:'#111412',metalness:0,roughness:1.6,specularIntensity:.35,clearcoat:0},maps:{map:null,normalMap:'grain',roughnessMap:'rough'},normal:.13},
 button:{surface:'彩色有光泽按钮帽，透光塑料外观',parameters:{metalness:0,roughness:.2,specularIntensity:.8,clearcoat:.6,clearcoatRoughness:.1},maps:{normalMap:null,roughnessMap:null}},
 screenGlass:{surface:'黑底显示屏表面，保留反光并优先保证代码可读',parameters:{color:'#020504',metalness:0,roughness:.085,ior:1.5,specularIntensity:.4,envMapIntensity:.22}}
};

export function applyFinish(material,key,maps){
 const finish=finishes[key];
 material.metalnessMap=null;material.bumpMap=null;
 for(const [property,value] of Object.entries(finish.parameters)){
  if(property==='color')material.color.set(value);else material[property]=value;
 }
 for(const [property,map] of Object.entries(finish.maps||{}))material[property]=map===null?null:maps[map];
 if(finish.normal!==undefined)material.normalScale.set(finish.normal,finish.normal);
 material.userData.surfaceFinish=finish.surface;material.needsUpdate=true;
}
