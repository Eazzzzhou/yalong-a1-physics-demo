// The demo opens directly on the equipment, before the 3D modules load.
const query=new URLSearchParams(location.search);
if(!query.has('view'))query.set('view','teaching');
if(!query.has('env'))query.set('env','foundry');
history.replaceState(null,'','?'+query+'#materials');

// The page import map pins the entire app to one explicit release revision.
import('./demo-app.js').catch(error=>{
 const loading=document.getElementById('loading');
 loading.textContent='实验箱加载失败，请重新加载页面。';
 loading.classList.remove('hidden');
 loading.setAttribute('role','alert');
 const retry=document.createElement('button');
 retry.type='button';retry.className='render-recovery';retry.textContent='重新加载';
 retry.addEventListener('click',()=>location.reload());loading.append(retry);
 document.querySelectorAll('.motion-actions button,#camera-view,#reset-view').forEach(button=>button.disabled=true);
 console.error(error);
});
