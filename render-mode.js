// Full quality uses WebGPU; unsupported demo devices enter the WebGL 2 page.
export const lightweight = document.documentElement.dataset.renderMode === 'lite';
export const modelURL = lightweight ? './assets/experimental-box-lite.glb' : './assets/experimental-box.glb';
export const shadowSize = lightweight ? 1024 : 4096;
export const pixelRatio = lightweight ? Math.min(devicePixelRatio, 1.25) : Math.min(devicePixelRatio * 1.5, 2);

export function openLightweight(){
 const destination=new URL('lite.html',location.href);
 destination.search=location.search;destination.hash=location.hash;
 location.replace(destination.href);
}
