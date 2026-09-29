// ECD Smart-Learn Zim: offline support.
// The app files are saved on the phone the first time it is opened online,
// so lessons, games and quizzes keep working with no internet afterwards.
// To release an update, change VERSION below (for example to 'v2').
var VERSION = 'v3';
var CACHE = 'ecdzim-' + VERSION;
var APP_FILES = ['./', './index.html', './manifest.webmanifest',
                 './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(APP_FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                             .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  var sameOrigin = url.origin === self.location.origin;
  if(!sameOrigin && !isFont) return;

  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        if(res && (res.ok || res.type === 'opaque')){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){
        if(e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
