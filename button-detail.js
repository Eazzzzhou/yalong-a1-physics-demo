import * as T from 'three';
import {lightweight} from './render-mode.js';

// Photo 04 guides the silhouette; heights are visual estimates, not measurements.
// Coordinates stay in the original CAD millimetres, with the original mesh identity.
export function refineButtons(meshes){
 const profiles={
  body:[[0,88],[9.8,88],[9.8,95.3],[10.8,96],[10.8,100.6],[10.4,101.2],[9.2,101.2],[0,101.2]],
  bezel:[[10,95],[12,95],[12.5,95.4],[12.5,96],[12.1,96.5],[10,96.5],[10,95]],
  cap:[[0,100.8],[8.8,100.8],[9.35,101.1],[9.6,101.7],[9.6,102.7],[9.4,103.5],[8.8,104.1],[6.5,104.5],[0,104.7]]
 };
 for(const mesh of meshes){
  const match=/^button_(body|bezel|cap)_([0-2])$/.exec(mesh.name);
  if(!match)continue;
  const geometry=new T.LatheGeometry(profiles[match[1]].map(p=>new T.Vector2(...p)),lightweight?32:64);
  geometry.rotateX(Math.PI/2);geometry.translate(169+Number(match[2])*30,0,0);
  geometry.computeBoundingBox();mesh.geometry=geometry;
 }
}
