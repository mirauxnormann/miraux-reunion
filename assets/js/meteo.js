'use strict';

/* ═══════════════════════════════════════════════════
   MÉTÉO — Open-Meteo + Géolocalisation navigateur
   ═══════════════════════════════════════════════════ */

var DEFAULT_LAT  = -20.8789;
var DEFAULT_LNG  =  55.4481;
var DEFAULT_CITY = 'Saint-Denis (Réunion)';

function wmoInfo(code) {
  if (code === 0)  return { ico: '', desc: 'Ciel dégagé' };
  if (code <= 2)   return { ico: '', desc: 'Peu nuageux' };
  if (code === 3)  return { ico: '', desc: 'Couvert' };
  if (code <= 48)  return { ico: '', desc: 'Brouillard' };
  if (code <= 55)  return { ico: '', desc: 'Bruine' };
  if (code <= 67)  return { ico: '', desc: 'Pluie' };
  if (code <= 82)  return { ico: '', desc: 'Averses' };
  if (code === 95) return { ico: '', desc: 'Orage' };
  if (code >= 96)  return { ico: '', desc: 'Orage violent' };
  return                  { ico: '', desc: 'Variable' };
}

function getAlert(wind, gusts, code) {
  if (gusts >= 150 || wind >= 120) return { level:'violet', ico:'!', title:'CYCLONE EXTRÊME',    text:'Rafales > 150 km/h. Ne sortez pas !', banner:true };
  if (gusts >= 100 || wind >= 80)  return { level:'rouge',  ico:'!', title:'VENT VIOLENT',       text:'Rafales > 100 km/h. Dégâts toiture possibles.', banner:true };
  if (gusts >= 70  || wind >= 55)  return { level:'orange', ico:'!', title:'VENT FORT',          text:'Rafales > 70 km/h. Vérifiez vos fixations.', banner:true };
  if (gusts >= 50  || wind >= 40)  return { level:'jaune',  ico:'~', title:'Vent soutenu',       text:'Rafales modérées — vigilance.', banner:false };
  if (code >= 95)                   return { level:'orange', ico:'!', title:'ORAGE EN COURS',    text:'Activité orageuse dans votre zone.', banner:true };
  return null;
}

function el(id) { return document.getElementById(id); }
function txt(id, val) { var e = el(id); if (e) e.textContent = val; }

function show(id)  { var e = el(id); if (e) e.style.display = 'flex'; }
function hide(id)  { var e = el(id); if (e) e.style.display = 'none'; }
function block(id) { var e = el(id); if (e) e.style.display = 'block'; }

function closeWeatherAlert() {
  hide('weatherAlertBanner');
  var nav = el('navbar');
  if (nav) nav.style.top = '';
}
window.closeWeatherAlert = closeWeatherAlert;

function showBanner(alert) {
  var banner = el('weatherAlertBanner');
  var nav    = el('navbar');
  if (!banner) return;
  banner.className     = 'weather-alert-banner alert-banner-' + alert.level;
  txt('alertBannerIco',   alert.ico);
  txt('alertBannerTitle', alert.title);
  txt('alertBannerMsg',   alert.text);
  banner.style.display = 'flex';
  if (nav) {
    nav.style.top        = banner.offsetHeight + 'px';
    nav.style.transition = 'top .3s';
  }
}

function displayMeteo(data, city) {
  var cur   = data.current;
  var temp  = Math.round(cur.temperature_2m);
  var wind  = Math.round(cur.wind_speed_10m);
  var gusts = Math.round(cur.wind_gusts_10m);
  var hum   = cur.relative_humidity_2m;
  var rain  = cur.precipitation;
  var code  = cur.weather_code;
  var info  = wmoInfo(code);
  var now   = new Date();

  txt('meteoCity',     city);
  txt('meteoIcon',     info.ico);
  txt('meteoTemp',     temp + '°C');
  txt('meteoDesc',     info.desc);
  txt('meteoWind',     wind);
  txt('meteoHumidity', hum + '%');
  txt('meteoRain',     rain.toFixed(1));
  txt('meteoGusts',    gusts);
  txt('meteoDate',     now.toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' }));
  txt('meteoTime',     now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }));

  var alert = getAlert(wind, gusts, code);
  var box   = el('meteoAlertBox');
  if (alert && box) {
    txt('meteoAlertIco',   alert.ico);
    txt('meteoAlertTitle', alert.title);
    txt('meteoAlertText',  alert.text);
    box.className    = 'meteo-alert-box alert-' + alert.level;
    box.style.display = 'flex';
    if (alert.banner) showBanner(alert);
  } else if (box) {
    box.style.display = 'none';
  }

  hide('meteoLoading');
  hide('meteoError');
  block('meteoContent');
}

function fetchMeteo(lat, lng, city) {
  var url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude='  + lat
    + '&longitude=' + lng
    + '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code,precipitation'
    + '&timezone=Indian%2FReunion'
    + '&wind_speed_unit=kmh';

  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) { displayMeteo(data, city); })
    .catch(function() {
      hide('meteoLoading');
      show('meteoError');
    });
}

function reverseGeocode(lat, lng, cb) {
  var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&accept-language=fr';
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var city = d.address && (d.address.city || d.address.town || d.address.village || d.address.county);
      cb(city || DEFAULT_CITY);
    })
    .catch(function() { cb(DEFAULT_CITY); });
}

function loadMeteo() {
  show('meteoLoading');
  hide('meteoContent');
  hide('meteoError');

  if (!navigator.geolocation) {
    fetchMeteo(DEFAULT_LAT, DEFAULT_LNG, DEFAULT_CITY);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      reverseGeocode(lat, lng, function(city) {
        fetchMeteo(lat, lng, city);
      });
    },
    function(err) {
      hide('meteoLoading');
      // Code 1 = permission refusée → afficher conseil iOS
      if (err && err.code === 1) {
        var hint = el('meteoErrorHint');
        if (hint) hint.style.display = 'block';
      }
      show('meteoError');
    },
    { timeout: 10000, maximumAge: 60000 }
  );
}

window.loadMeteo = loadMeteo;

// Démarrer
loadMeteo();
