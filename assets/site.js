/* Animations au défilement : titres par mots, texte qui s'allume, scène du graphique, compteurs. */
(function(){
  // Chaque page s'ouvre en haut, même après un clic depuis le bas d'une autre page
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  if(!location.hash) scrollTo(0,0);
  addEventListener('pageshow',function(){if(!location.hash)scrollTo(0,0)});
  var calme=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function borne(v,a,b){return Math.max(a,Math.min(b,v))}

  // Menu téléphone
  var burger=document.querySelector('.burger'), feuille=document.querySelector('.feuille');
  function bascule(o){document.body.classList.toggle('ouvert',o);burger.setAttribute('aria-expanded',o);document.documentElement.style.overflow=o?'hidden':''}
  if(burger){burger.addEventListener('click',function(){bascule(!document.body.classList.contains('ouvert'))});
    feuille.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){bascule(false)})})}

  // Titres : chaque mot dans un masque, décalé dans le temps
  document.querySelectorAll('.mots').forEach(function(el){
    var k=0, base=parseFloat(el.dataset.delai||0);
    (function coupe(n){
      Array.prototype.slice.call(n.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var f=document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function(w){
            if(!w)return; if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(' '));return}
            var m=document.createElement('span'),i=document.createElement('span');m.className='m';i.textContent=w;i.style.transitionDelay=(base+k++*.07)+'s';m.appendChild(i);f.appendChild(m);
          });
          n.replaceChild(f,c);
        } else if(c.nodeType===1&&c.tagName!=='BR') coupe(c);
      });
    })(el);
  });

  // Titres visibles dès le chargement : on relance l'animation après la découpe
  document.querySelectorAll('.mots.vu').forEach(function(el){el.classList.remove('vu');requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('vu')})})});

  // Texte qui s'allume mot à mot
  var lectures=[].slice.call(document.querySelectorAll('.lecture')).map(function(el){
    (function coupe(n){
      Array.prototype.slice.call(n.childNodes).forEach(function(c){
        if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(' '));return}var s=document.createElement('span');s.className='w';s.textContent=w;f.appendChild(s)});n.replaceChild(f,c)}
        else if(c.nodeType===1) coupe(c);
      });
    })(el);
    return {el:el,w:el.querySelectorAll('.w')};
  });

  // Compteurs
  function compte(el){
    var fin=+el.dataset.fin,t0=null,dec=+(el.dataset.dec||0);
    function pas(t){if(!t0)t0=t;var p=borne((t-t0)/2000,0,1);p=1-Math.pow(1-p,4);el.textContent=(fin*p).toLocaleString('fr-FR',{minimumFractionDigits:dec,maximumFractionDigits:dec}).replace(/ | /g,' ');if(p<1)requestAnimationFrame(pas)}
    if(calme) el.textContent=fin.toLocaleString('fr-FR').replace(/ | /g,' '); else requestAnimationFrame(pas);
  }

  // Petits graphiques des résultats : se dessinent à l'apparition
  function anime(g){var t0=null;function pas(t){if(!t0)t0=t;var p=borne((t-t0)/1800,0,1);g.dessine(1-Math.pow(1-p,3));if(p<1)requestAnimationFrame(pas)}if(calme)g.dessine(1);else requestAnimationFrame(pas)}
  var minis=new Map();
  document.querySelectorAll('canvas.mini').forEach(function(c,i){var g=new Graphe(c,{mini:true,n:+(c.dataset.n||46),graine:+(c.dataset.graine||3+i)});g.dessine(1);minis.set(c,g)});

  // Apparitions
  var obs=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return; var t=e.target; t.classList.add('vu');
    t.querySelectorAll('.compteur').forEach(compte); if(t.classList.contains('compteur'))compte(t);
    t.querySelectorAll('canvas.mini').forEach(function(c){anime(minis.get(c))});
    obs.unobserve(t);
  })},{rootMargin:'0px 0px -10% 0px',threshold:.15});
  document.querySelectorAll('.revele,.mots,.etapes,.trait').forEach(function(el){obs.observe(el)});
  // Le décalage d'apparition des cases du calendrier
  document.querySelectorAll('.calendrier').forEach(function(c){c.querySelectorAll('i.g,i.r').forEach(function(i,k){i.style.transitionDelay=(.2+k*.05)+'s'})});

  // Héros de l'accueil
  var hero=document.querySelector('.hero'), scene=hero&&hero.querySelector('.scene'), contenu=hero&&hero.querySelector('.contenu'), brume=null;
  if(hero){
    var img=scene.querySelector('img'), cv=scene.querySelector('canvas');
    function photo(){img.classList.add('charge');if(brume){brume.stop();cv.remove();brume=null}}
    if(img.complete){if(img.naturalWidth)photo();else{img.remove();brume=sceneBrume(cv)}}
    else{img.addEventListener('load',photo);img.addEventListener('error',function(){img.remove()});brume=sceneBrume(cv)}
  }

  // Scène collante du graphique
  var sg=document.querySelector('.scene-graphe'), graphe=null, etapes, points, ecran, gainEl;
  if(sg){
    ecran=sg.querySelector('.ecran'); etapes=sg.querySelectorAll('.etape-g'); points=sg.querySelectorAll('.points i'); gainEl=sg.querySelector('.gain-direct');
    graphe=new Graphe(sg.querySelector('canvas'),{n:80,graine:11});
    graphe.dessine(.12);
  }

  var halo=document.querySelector('.cloture');
  function surDefilement(){
    var vh=innerHeight;
    if(hero){
      var s=borne(scrollY/vh,0,1);
      scene.style.transform='translateY('+(s*vh*.25)+'px) scale('+(1+s*.08)+')';
      contenu.style.opacity=1-s*1.6; contenu.style.transform='translateY('+(-s*80)+'px)';
      if(brume){ if(s>=1)brume.stop(); else brume.reprise(); }
    }
    lectures.forEach(function(l){
      var r=l.el.getBoundingClientRect(), p=borne((vh*.85-r.top)/(r.height+vh*.4),0,1), n=Math.round(p*l.w.length);
      for(var i=0;i<l.w.length;i++) l.w[i].classList.toggle('on',i<n);
    });
    if(sg){
      var r=sg.getBoundingClientRect(), p=borne(-r.top/(r.height-vh),0,1);
      ecran.style.setProperty('--inclin',(1-borne(p*5,0,1)).toFixed(3));
      graphe.dessine(borne(.12+(p-.04)/.84*.88,.12,1));
      var e=p<.36?0:p<.66?1:2;
      etapes.forEach(function(el,i){el.classList.toggle('on',i===e);el.classList.toggle('passee',i<e)});
      points.forEach(function(el,i){el.classList.toggle('on',i===e)});
    }
    if(halo){var r2=halo.getBoundingClientRect(),q=borne(1-(r2.top)/vh,0,1);halo.style.setProperty('--halo',(.6+q*.5).toFixed(3));halo.style.setProperty('--halo-o',(.25+q*.75).toFixed(3))}
  }
  var attente=false;
  addEventListener('scroll',function(){if(!attente){attente=true;requestAnimationFrame(function(){attente=false;surDefilement()})}},{passive:true});
  addEventListener('resize',surDefilement);
  surDefilement();

  // Une seule question ouverte à la fois
  document.querySelectorAll('.faq').forEach(function(f){f.addEventListener('toggle',function(e){if(e.target.open)f.querySelectorAll('details[open]').forEach(function(d){if(d!==e.target)d.open=false})},true)});
})();
