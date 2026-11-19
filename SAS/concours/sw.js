/* Un service worker minuscule : il met la page et ses deux fichiers en
   cache pour que l'icone posee sur l'ecran d'accueil ouvre quelque chose
   meme quand le reseau du gymnase tousse. Les appels a Firestore, eux, ne
   sont jamais mis en cache : un classement perime serait pire que pas de
   classement du tout. */
var CACHE = "sas-concours-1";
var FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icone-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FICHIERS); })
    .then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(noms){
    return Promise.all(noms.map(function(n){
      return n === CACHE ? null : caches.delete(n);
    }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var u = new URL(e.request.url);
  if(e.request.method !== "GET") return;
  if(u.origin !== location.origin) return;           /* Firestore : jamais en cache */
  /* Le reseau d'abord, le cache en secours : on veut la derniere version
     de la page des qu'elle est joignable. */
  e.respondWith(
    fetch(e.request).then(function(r){
      var copie = r.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copie); });
      return r;
    }).catch(function(){
      return caches.match(e.request).then(function(r){
        return r || caches.match("./index.html");
      });
    })
  );
});
