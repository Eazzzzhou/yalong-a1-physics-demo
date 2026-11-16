(() => {
 const boot=window.demoBootstrap;
 if(boot.failed)return;
 boot.cancel();
 const query=new URLSearchParams(location.search);
 if(!query.has('view'))query.set('view','teaching');
 if(!query.has('env'))query.set('env','foundry');
 history.replaceState(null,'','?'+query+'#materials');

 // An inactivity deadline is an explicit failure, not a quality switch.
 const stageLimit=180000;
 const state={status:'loading',stage:'页面模块',resource:null,stages:[]};
 let failure=null,timer,rejectStage=null,lastBytes=0;
 const status=document.getElementById('loading-status');
 function fail(error,stage=state.stage){
  if(failure)return;
  const wasReady=state.status==='ready';
  failure=error instanceof Error?error:Error('资源读取或初始化失败。');
  state.status='failed';state.stage=stage;state.error=failure.message;
  clearTimeout(timer);
  boot.fail(`实时三维${wasReady?'已中断':'未能启动'}：${stage}。可先播放下方演示视频。`);
  document.getElementById('loading-details').hidden=false;
  document.getElementById('loading-error').textContent=failure.message+(state.resource?'\n请求：'+state.resource:'');
  document.querySelectorAll('.motion-actions button,#lesson-panel button,#camera-view,#reset-view,#snapshot,#environment,#environment-rotation').forEach(control=>control.disabled=true);
  window.demoLoading.stop();
  if(rejectStage)rejectStage(failure);
  console.error('[YL-A1 loading]',{...state},failure);
 }
 function armTimer(){
  clearTimeout(timer);
  timer=setTimeout(()=>fail(Error('连续 180 秒未收到加载进展。请重新加载；仍失败时保存错误详情供排查。')),stageLimit);
 }
 window.demoLoading={
  state,fail,stop(){},
  resourceError(url){if(state.status==='loading')state.resource=url;},
  progress(event){
   if(state.status!=='loading'||event.loaded<=lastBytes)return;
   lastBytes=event.loaded;armTimer();
   status.textContent=`正在加载：${state.stage}… 已接收 ${(event.loaded/1000000).toFixed(1)} MB`;
  },
  async run(name,operation,resource=null){
   if(failure)throw failure;
   state.stage=name;state.resource=resource;lastBytes=0;
   const entry={name,started:Math.round(performance.now())};state.stages.push(entry);
   status.textContent=`正在加载：${name}…`;
   console.info('[YL-A1 loading]',name,'start');
   const interrupted=new Promise((_,reject)=>{rejectStage=reject;});armTimer();
   try{
    const result=await Promise.race([Promise.resolve().then(operation),interrupted]);
    if(failure)throw failure;
    entry.elapsed=Math.round(performance.now())-entry.started;
    console.info('[YL-A1 loading]',name,entry.elapsed+' ms');
    return result;
   }catch(error){fail(error);throw failure;}
   finally{clearTimeout(timer);rejectStage=null;}
  },
  done(){
   if(failure)throw failure;
   clearTimeout(timer);state.status='ready';state.resource=null;
   document.getElementById('loading-preview').pause();
   document.getElementById('loading').classList.add('hidden');
  },
  cancel(){clearTimeout(timer);state.status='redirecting';}
 };
 armTimer();
 import('./demo-app.js').catch(error=>fail(error));
})();
