/* CV: nền sáng/tối (nhớ theo trình duyệt, dùng chung khóa với laquoc.com), nút lưu PDF, khung ảnh 3D nghiêng, hiện dần khi cuộn. */
(function(){
  const $=s=>document.querySelector(s),root=document.documentElement;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{const t=localStorage.getItem('bsc-theme');if(t)root.setAttribute('data-theme',JSON.parse(t))}catch(e){}
  const toi=()=>{const t=root.getAttribute('data-theme');return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches};
  $('#doiNen').addEventListener('click',()=>{const t=toi()?'light':'dark';root.setAttribute('data-theme',t);try{localStorage.setItem('bsc-theme',JSON.stringify(t))}catch(e){}});
  $('#inPdf').addEventListener('click',()=>window.print());

  /* khung ảnh 3D */
  const the=$('#the3d');
  function nghieng(x,y){/* x,y trong khoảng -1..1 */
    the.style.setProperty('--ry',(x*12).toFixed(2)+'deg');the.style.setProperty('--rx',(-y*10).toFixed(2)+'deg');
    the.style.setProperty('--gx',(50+x*40).toFixed(1)+'%');the.style.setProperty('--gy',(30+y*40).toFixed(1)+'%')}
  if(!reduce){
    addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=the.getBoundingClientRect();
      const x=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/(innerWidth/2))),y=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/(innerHeight/2)));nghieng(x,y)});
    document.addEventListener('mouseleave',()=>nghieng(0,0));
    addEventListener('deviceorientation',e=>{if(e.gamma==null)return;nghieng(Math.max(-1,Math.min(1,e.gamma/30)),Math.max(-1,Math.min(1,(e.beta-45)/30)))});
    /* chưa có chuột / cảm biến thì tự lắc nhẹ cho thấy khối 3D; người xem tương tác là dừng */
    let t=0,tuDong=true;(function lac(){if(!tuDong)return;t+=.012;nghieng(Math.sin(t)*.35,Math.cos(t*.8)*.25);requestAnimationFrame(lac)})();
    addEventListener('pointermove',e=>{if(e.pointerType==='mouse')tuDong=false});
    addEventListener('deviceorientation',e=>{if(e.gamma!=null)tuDong=false});
  }

  /* hiện dần khi cuộn */
  const ds=document.querySelectorAll('.hien');
  if(reduce||!('IntersectionObserver' in window))ds.forEach(d=>d.classList.add('on'));
  else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}}),{threshold:.12});ds.forEach(d=>io.observe(d))}
  addEventListener('beforeprint',()=>{ds.forEach(d=>d.classList.add('on'));nghieng(0,0)});
})();
