/* Graphique façon TradingView (fond noir, bougies blanches / grises, bande de Keltner ardoise, position)
   et scène de fond de l'accueil en attendant la photo. Dessin en tracés, jamais en image. */
(function(){
  var CYAN='#ececf0', MAGENTA='#6c6b75', VERT='#3ed598', ROUGE='#ff5d6c';

  function graine(s){return function(){s=(s*16807)%2147483647;return (s-1)/2147483646}}

  // Séance NQ en 1 minute : range, balayage de la zone, puis tendance haussière.
  function serie(n, s){
    var r=graine(s||11), out=[], p=30812, i, o, c, h, l, cible;
    for(i=0;i<n;i++){
      if(i<n*.25) cible=30812+Math.sin(i/3)*4;
      else if(i<n*.46) cible=30812-(i-n*.25)/(n*.21)*24;
      else if(i<n*.5) cible=30788+(i-n*.46)*1.5;
      else cible=30793+(i-n*.5)/(n*.5)*38+Math.sin(i/2.6)*3.5;
      o=p; c=o+(cible-o)*.45+(r()-.5)*7.5;
      h=Math.max(o,c)+r()*4.2; l=Math.min(o,c)-r()*4.2;
      c=Math.round(c*4)/4; o=Math.round(o*4)/4; h=Math.round(h*4)/4; l=Math.round(l*4)/4;
      out.push({o:o,h:h,l:l,c:c,v:.35+r()*.65+(i>n*.44&&i<n*.52?.8:0)}); p=c;
    }
    return out;
  }
  function ema(d,k){var a=2/(k+1),e=d[0].c;return d.map(function(b){e=b.c*a+e*(1-a);return e})}
  function atr(d,k){var a=1/k,v=d[0].h-d[0].l;return d.map(function(b,i){var tr=Math.max(b.h-b.l,i?Math.abs(b.h-d[i-1].c):0,i?Math.abs(b.l-d[i-1].c):0);v=v*(1-a)+tr*a;return v})}
  function prixFr(v){return v.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(/ | /g,' ')}

  function Graphe(canvas, opts){
    this.cv=canvas; this.o=opts||{}; this.n=this.o.n||80;
    this.d=serie(this.n,this.o.graine);
    this.mid=ema(this.d,20); var a=atr(this.d,14);
    this.haut=this.mid.map(function(m,i){return m+a[i]*1.6});
    this.bas=this.mid.map(function(m,i){return m-a[i]*1.6});
    this.entree=Math.round(this.n*.5); this.prixEntree=this.d[this.entree].o;
    this.zone=Math.round(this.n*.28);
    this.p=0; this.taille(); var t=this;
    window.addEventListener('resize',function(){t.taille();t.dessine(t.p)});
  }
  Graphe.prototype.taille=function(){
    var r=this.cv.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1);
    this.W=Math.max(10,r.width); this.H=Math.max(10,r.height);
    this.cv.width=Math.round(this.W*dpr); this.cv.height=Math.round(this.H*dpr);
    this.ctx=this.cv.getContext('2d'); this.ctx.setTransform(dpr,0,0,dpr,0,0);
    var mn=Infinity,mx=-Infinity; this.d.forEach(function(b){mn=Math.min(mn,b.l);mx=Math.max(mx,b.h)});
    this.mn=mn-8; this.mx=mx+10;
  };
  Graphe.prototype.dessine=function(p){
    this.p=p; var o=this.o, x=this.ctx, W=this.W, H=this.H, d=this.d, n=this.n, mini=o.mini, petit=W<520;
    var ax=mini?0:(petit?58:68), bx=mini?0:22, haut=mini?6:(petit?40:46);
    var cw=W-ax, ch=H-bx, volH=mini?0:ch*.14, ph=ch-volH-haut-6;
    var self=this;
    function Y(v){return haut+(self.mx-v)/(self.mx-self.mn)*ph}
    var pas=cw/(n+(mini?1:4)); function X(i){return pas*(i+.5)}
    x.fillStyle='#000'; x.fillRect(0,0,W,H);

    var vis=Math.max(0,Math.min(n,p*n)), entier=Math.floor(vis), frac=vis-entier;
    var bars=d.slice(0,entier);
    if(entier<n&&frac>0){var b=d[entier],c=b.o+(b.c-b.o)*frac;bars.push({o:b.o,c:c,h:Math.max(b.o,c,b.o+(b.h-b.o)*frac),l:Math.min(b.o,c,b.o-(b.o-b.l)*frac),v:b.v*frac})}
    var der=bars[bars.length-1];

    if(!mini){
      // Grille et filigrane
      x.strokeStyle='rgba(255,255,255,.055)'; x.lineWidth=1; x.font='500 '+(petit?10:11)+'px Geist,-apple-system,BlinkMacSystemFont,Inter,Segoe UI,Roboto,sans-serif';
      x.textBaseline='middle'; x.textAlign='left';
      for(var v=Math.ceil(this.mn/10)*10; v<this.mx; v+=10){var y=Math.round(Y(v))+.5; if(y<haut-4)continue; x.beginPath();x.moveTo(0,y);x.lineTo(cw,y);x.stroke(); x.fillStyle='#8a8794'; x.fillText(petit?prixFr(v).slice(0,-3):prixFr(v),cw+(petit?6:8),y)}
      for(var i=Math.round(n/12);i<n;i+=Math.round(n/6)){var gx=Math.round(X(i))+.5;x.beginPath();x.moveTo(gx,haut-6);x.lineTo(gx,ch);x.stroke(); x.fillStyle='#6f6c78'; x.textAlign='center'; var mnt=(9*60+30+i)%60, hr=Math.floor((9*60+30+i)/60)+6; x.fillText(hr+':'+(mnt<10?'0':'')+mnt,gx,ch+11); x.textAlign='left'}
      x.fillStyle='rgba(255,255,255,.035)'; x.font='600 '+(petit?44:76)+'px Geist,-apple-system,BlinkMacSystemFont,Inter,Segoe UI,sans-serif'; x.textAlign='center';
      x.fillText('NQ1!, 1',cw/2,haut+ph*.55); x.textAlign='left';
      x.strokeStyle='rgba(255,255,255,.08)'; x.beginPath(); x.moveTo(cw+.5,0); x.lineTo(cw+.5,H); x.moveTo(0,ch+.5); x.lineTo(W,ch+.5); x.stroke();

      // Zone de demande
      if(vis>this.zone){
        var za=Math.min(1,(vis-this.zone)/4), zh=this.prixEntree+3, zb=this.prixEntree-9;
        x.fillStyle='rgba(255,255,255,'+(.06*za)+')'; x.fillRect(X(this.zone),Y(zh),cw-X(this.zone),Y(zb)-Y(zh));
        x.strokeStyle='rgba(255,255,255,'+(.35*za)+')'; x.setLineDash([]); x.strokeRect(X(this.zone)+.5,Math.round(Y(zh))+.5,cw-X(this.zone)-1,Math.round(Y(zb)-Y(zh)));
        x.fillStyle='rgba(230,232,240,'+(.85*za)+')'; x.font='600 '+(petit?10:11)+'px Geist,-apple-system,BlinkMacSystemFont,Inter,sans-serif'; x.fillText('Zone',X(this.zone)+8,Y(zb)-10);
      }
    }

    // Bande de Keltner et moyenne
    var k=bars.length;
    if(k>1){
      x.beginPath(); for(var j=0;j<k;j++){x[j?'lineTo':'moveTo'](X(j),Y(this.haut[j]))} for(j=k-1;j>=0;j--){x.lineTo(X(j),Y(this.bas[j]))} x.closePath();
      x.fillStyle='rgba(255,255,255,.05)'; x.fill();
      [['haut','rgba(200,200,206,.35)'],['bas','rgba(200,200,206,.35)'],['mid','rgba(200,200,206,.75)']].forEach(function(s){
        x.beginPath(); for(var j=0;j<k;j++){x[j?'lineTo':'moveTo'](X(j),Y(self[s[0]][j]))} x.strokeStyle=s[1]; x.lineWidth=s[0]==='mid'?1.3:1; x.stroke();
      });
    }

    // Volume puis bougies
    var bw=Math.max(1,pas*.68);
    bars.forEach(function(b,i){
      var hausse=b.c>=b.o, col=hausse?CYAN:MAGENTA, cx=X(i);
      if(!mini){x.globalAlpha=.32;x.fillStyle=col;var vh=b.v/1.8*volH;x.fillRect(cx-bw/2,ch-vh,bw,vh);x.globalAlpha=1}
      x.strokeStyle=col; x.lineWidth=1; x.beginPath(); x.moveTo(Math.round(cx)+.5,Y(b.h)); x.lineTo(Math.round(cx)+.5,Y(b.l)); x.stroke();
      var yt=Y(Math.max(b.o,b.c)), yb=Y(Math.min(b.o,b.c)); x.fillStyle=col; x.fillRect(cx-bw/2,yt,bw,Math.max(1,yb-yt));
    });

    if(mini||!der) return;

    // Position longue : entrée, stop, objectif, gain latent
    if(vis>this.entree){
      var pa=Math.min(1,(vis-this.entree)/3), pe=this.prixEntree, sl=pe-10, tp=pe+40;
      x.globalAlpha=pa; x.lineWidth=1;
      [[tp,VERT,'TP'],[sl,ROUGE,'SL'],[pe,'#d9d7df','']].forEach(function(l){
        var y=Math.round(Y(l[0]))+.5; x.strokeStyle=l[1]; x.setLineDash(l[2]?[4,4]:[]); x.beginPath(); x.moveTo(X(self.entree),y); x.lineTo(cw,y); x.stroke(); x.setLineDash([]);
        if(l[2]){x.fillStyle=l[1]; x.font='600 10px Geist,-apple-system,BlinkMacSystemFont,Inter,sans-serif'; x.fillText(l[2],cw-24,y-8)}
      });
      var gain=(der.c-pe)*3*20, txt=(gain>=0?'+':'−')+prixFr(Math.abs(gain))+' USD', yE=Math.round(Y(pe))+.5;
      x.font='600 '+(petit?10:12)+'px Geist,-apple-system,BlinkMacSystemFont,Inter,sans-serif';
      var lx=X(this.entree)+(petit?6:14), w1=petit?18:22, w2=x.measureText(txt).width+(petit?12:16), hh=petit?18:22;
      x.fillStyle=gain>=0?'#1f9e6e':'#c9364a'; x.fillRect(lx,yE-hh/2,w1,hh); x.fillStyle='#fff'; x.textAlign='center'; x.fillText('3',lx+w1/2,yE);
      x.fillStyle='#0b0b0d'; x.fillRect(lx+w1,yE-hh/2,w2,hh); x.strokeStyle=gain>=0?'#1f9e6e':'#c9364a'; x.strokeRect(lx+w1+.5,yE-hh/2+.5,w2-1,hh-1);
      x.fillStyle=gain>=0?VERT:ROUGE; x.fillText(txt,lx+w1+w2/2,yE); x.textAlign='left';
      x.globalAlpha=1;
      if(this.o.surGain) this.o.surGain(gain);
    }

    // Dernier prix
    var colD=der.c>=der.o?CYAN:MAGENTA, yD=Math.round(Y(der.c))+.5;
    x.strokeStyle=colD; x.setLineDash([2,3]); x.beginPath(); x.moveTo(0,yD); x.lineTo(cw,yD); x.stroke(); x.setLineDash([]);
    x.fillStyle=colD; x.fillRect(cw,yD-10,ax,20); x.fillStyle='#000'; x.font='600 '+(petit?9:11)+'px Geist,-apple-system,BlinkMacSystemFont,Inter,sans-serif'; x.fillText(prixFr(der.c),cw+(petit?4:8),yD);

    // Légende OHLC
    var b0=bars[0], varAbs=der.c-b0.o;
    x.font='500 '+(petit?10:12)+'px Geist,-apple-system,BlinkMacSystemFont,Inter,Segoe UI,sans-serif'; x.textBaseline='middle';
    var tx=12, ty=petit?14:18;
    function seg(t,c){x.fillStyle=c;x.fillText(t,tx,ty);tx+=x.measureText(t).width+(petit?5:7)}
    seg('E-mini Nasdaq-100 · 1 · CME','#d9d7df');
    if(!petit){seg('O','#8a8794');seg(prixFr(der.o),colD);seg('H','#8a8794');seg(prixFr(der.h),colD);seg('L','#8a8794');seg(prixFr(der.l),colD);seg('C','#8a8794');seg(prixFr(der.c),colD)}
    seg((varAbs>=0?'+':'−')+prixFr(Math.abs(varAbs)),varAbs>=0?CYAN:MAGENTA);
    ty+=petit?16:20; tx=12; x.font='500 '+(petit?9:11)+'px Geist,-apple-system,BlinkMacSystemFont,Inter,sans-serif';
    seg('KC 20 1.6','#8a8794'); seg(prixFr(this.mid[Math.max(0,k-1)]),'#c8c8ce');
  };
  window.Graphe=Graphe;

  /* Fond de l'accueil en attendant la photo : Dubaï dans la brume au crépuscule. */
  window.sceneBrume=function(canvas){
    var ctx=canvas.getContext('2d'), W, H, dpr, t0=performance.now(), actif=true, fenetres=[];
    function taille(){var r=canvas.getBoundingClientRect();dpr=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
      var g=graine(5);fenetres=[];for(var i=0;i<46;i++)fenetres.push([g(),g(),g()])}
    function tour(cx,base,hauteur,large){
      // Silhouette effilée par paliers, puis flèche, symétrique.
      var paliers=[[0,1],[.18,.86],[.32,.7],[.45,.56],[.56,.43],[.66,.32],[.74,.22],[.8,.14],[.86,.08]], g=[];
      paliers.forEach(function(p,i){var w=large*p[1]/2, y0=base-p[0]*hauteur, y1=paliers[i+1]?base-paliers[i+1][0]*hauteur:base-.92*hauteur; g.push([-w,y0],[-w,y1])});
      g.push([-1.2,base-.92*hauteur],[0,base-hauteur]);
      var d=g.concat(g.slice(0,-1).reverse().map(function(q){return [-q[0],q[1]]}));
      ctx.beginPath(); d.forEach(function(q,i){ctx[i?'lineTo':'moveTo'](cx+q[0],q[1])}); ctx.closePath();
    }
    function dessine(now){
      if(!actif) return; var t=(now-t0)/1000, tel=W<700;
      var ciel=ctx.createLinearGradient(0,0,0,H); ciel.addColorStop(0,'#14121a'); ciel.addColorStop(.45,'#2a2531'); ciel.addColorStop(.7,'#4a4250'); ciel.addColorStop(1,'#0d0c11');
      ctx.fillStyle=ciel; ctx.fillRect(0,0,W,H);
      var lueur=ctx.createRadialGradient(W*.12,H*.66,0,W*.12,H*.66,W*.55); lueur.addColorStop(0,'rgba(214,150,120,.32)'); lueur.addColorStop(1,'rgba(214,150,120,0)');
      ctx.fillStyle=lueur; ctx.fillRect(0,0,W,H);
      var cx=tel?W*.5:W*.73, base=H*.86, haut=tel?H*.62:H*.76, large=tel?W*.2:W*.075;
      // Tours lointaines
      ctx.fillStyle='rgba(28,25,33,.75)';
      [[-.22,.28,.04],[-.14,.36,.03],[.13,.32,.035],[.2,.24,.05],[.27,.3,.03],[-.3,.2,.05]].forEach(function(b){var bx=cx+b[0]*(tel?W*1.2:W*.6);ctx.fillRect(bx,base-b[1]*H,b[2]*(tel?W*1.4:W*.6),b[1]*H)});
      var gt=ctx.createLinearGradient(0,base-haut,0,base); gt.addColorStop(0,'#3a3440'); gt.addColorStop(.5,'#1d1a22'); gt.addColorStop(1,'#121016');
      tour(cx,base,haut,large); ctx.fillStyle=gt; ctx.fill();
      fenetres.forEach(function(f){var y=base-f[1]*haut*.7, w=large*(1-f[1]*.8)*.4; var a=.25+.5*Math.max(0,Math.sin(t*.6+f[2]*9)); ctx.fillStyle='rgba(255,196,140,'+(a*.6)+')'; ctx.fillRect(cx+(f[0]-.5)*w*2,y,1.4,1.4)});
      ctx.fillStyle='rgba(255,90,90,'+(.4+.6*Math.max(0,Math.sin(t*2.4)))+')'; ctx.beginPath(); ctx.arc(cx,base-haut+2,1.6,0,7); ctx.fill();
      // Nappes de brume qui dérivent
      for(var i=0;i<5;i++){var y=H*(.55+i*.09), dx=((t*(6+i*3))%(W*1.6))-W*.3, g=ctx.createRadialGradient(dx,y,0,dx,y,W*.55); g.addColorStop(0,'rgba(190,182,200,'+(.13-i*.012)+')'); g.addColorStop(1,'rgba(190,182,200,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H)}
      var sol=ctx.createLinearGradient(0,H*.72,0,H); sol.addColorStop(0,'rgba(120,112,128,0)'); sol.addColorStop(.45,'rgba(120,112,128,.28)'); sol.addColorStop(1,'rgba(10,9,13,.9)'); ctx.fillStyle=sol; ctx.fillRect(0,H*.72,W,H*.28);
      // Avion
      var av=(t*.018)%1.2-.1, axp=W*(1.05-av*1.1), ayp=H*(.16+av*.05); ctx.fillStyle='rgba(255,255,255,'+(.5+.5*Math.max(0,Math.sin(t*5)))+')'; ctx.beginPath(); ctx.arc(axp,ayp,1.3,0,7); ctx.fill();
      requestAnimationFrame(dessine);
    }
    taille(); window.addEventListener('resize',taille); requestAnimationFrame(dessine);
    return {stop:function(){actif=false}, reprise:function(){if(!actif){actif=true;requestAnimationFrame(dessine)}}};
  };
})();
