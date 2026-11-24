(()=>{
 const active=new Map(),render=window.updateCard;let timer=null;
 function draw(c,canvas){const visual=c.querySelector('.visual'),frame=visual.querySelector('.frame'),width=frame.offsetWidth,height=frame.offsetHeight;
  canvas.style.left=(visual.offsetLeft+frame.offsetLeft)+'px';canvas.style.top=(visual.offsetTop+frame.offsetTop)+'px';
  canvas.width=width;canvas.height=height;canvas.style.width=width+'px';canvas.style.height=height+'px';const ctx=canvas.getContext('2d'),data=ctx.createImageData(width,height);
  for(let i=0;i<data.data.length;i+=4){const value=Math.random()<.5?20:220;data.data[i]=data.data[i+1]=data.data[i+2]=value;data.data[i+3]=255;}
  ctx.putImageData(data,0,0);
 }
 function tick(){timer=null;for(const [c,canvas] of active)if(!document.getElementById('stage').hidden)draw(c,canvas);if(active.size)timer=setTimeout(tick,80);}
 window.updateCard=function(p){render(p);const c=cards.get(p.id),lost=p.role==='079'&&!p.dead&&p.alive!==false&&p.signalLost===true;c.classList.toggle('signal-lost',lost);let canvas=c.querySelector('.signal-static');
  if(!lost){if(canvas)canvas.remove();active.delete(c);if(!active.size&&timer){clearTimeout(timer);timer=null;}return;}
  if(!canvas){canvas=document.createElement('canvas');canvas.className='signal-static';canvas.setAttribute('aria-label','SCP-079 信号丢失');c.append(canvas);}active.set(c,canvas);draw(c,canvas);if(!timer)timer=setTimeout(tick,80);
 };
})();
