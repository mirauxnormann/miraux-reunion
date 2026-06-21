'use strict';

/* ═══════════════════════════════════════════════════════════════
   CARTE LEAFLET — La Réunion
   ═══════════════════════════════════════════════════════════════ */
(function initMap() {
  const mapEl = document.getElementById('reunionMap');
  if (!mapEl || typeof L === 'undefined') return;

  // Centre de La Réunion
  const REUNION_CENTER = [-21.1151, 55.5364];
  const COMPANY_LAT    = -20.8789;
  const COMPANY_LNG    =  55.4481; // Saint-Denis

  const map = L.map('reunionMap', {
    center: REUNION_CENTER,
    zoom: 10,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  // Icône personnalisée orange
  const companyIcon = L.divIcon({
    html: `<div class="leaflet-custom-marker">
             <div class="marker-pin"></div>
             <div class="marker-label">MIRAUX Toiture</div>
           </div>`,
    className: '',
    iconSize: [120, 50],
    iconAnchor: [60, 44],
  });

  L.marker([COMPANY_LAT, COMPANY_LNG], { icon: companyIcon })
    .addTo(map)
    .bindPopup(`
      <div class="map-popup">
        <strong>🏠 MIRAUX Toiture</strong><br/>
        Couvreur à La Réunion 974<br/>
        <a href="tel:+262692000000">0692 00 00 00</a><br/>
        <a href="#contact">Demander un devis →</a>
      </div>
    `, { maxWidth: 200 })
    .openPopup();

  // Cercle zone intervention (rayon ≈ île entière)
  L.circle([COMPANY_LAT, COMPANY_LNG], {
    radius: 55000,
    color: '#F27059',
    fillColor: '#F27059',
    fillOpacity: 0.07,
    weight: 1.5,
    dashArray: '6,4',
  }).addTo(map).bindTooltip('Zone d\'intervention : toute l\'île 974', { sticky: true });
})();


/* ═══════════════════════════════════════════════════════════════
   MÉTÉO — Open-Meteo + Géolocalisation
   ═══════════════════════════════════════════════════════════════ */

// Codes WMO → icône + description
function wmoInfo(code) {
  if (code === 0)               return { ico: '☀️',  desc: 'Ciel dégagé' };
  if (code <= 2)                return { ico: '🌤',  desc: 'Peu nuageux' };
  if (code === 3)               return { ico: '☁️',  desc: 'Couvert' };
  if (code <= 48)               return { ico: '🌫',  desc: 'Brouillard' };
  if (code <= 55)               return { ico: '🌦',  desc: 'Bruine' };
  if (code <= 67)               return { ico: '🌧',  desc: 'Pluie' };
  if (code <= 77)               return { ico: '❄️',  desc: 'Neige' };
  if (code <= 82)               return { ico: '🌧',  desc: 'Averses' };
  if (code <= 86)               return { ico: '🌨',  desc: 'Averses de neige' };
  if (code === 95)              return { ico: '⛈',  desc: 'Orage' };
  if (code >= 96)               return { ico: '⛈',  desc: 'Orage violent' };
  return                               { ico: '🌡',  desc: 'Variable' };
}

// Niveau d'alerte selon vent / code météo
function getAlertLevel(windKmh, gustsKmh, wmoCode) {
  if (gustsKmh >= 150 || windKmh >= 120) {
    return {
      level: 'violet',
      ico: '🌀',
      title: 'ALERTE CYCLONE EXTRÊME',
      text: 'Rafales > 150 km/h. Restez à l\'abri, ne sortez pas !',
      banner: true,
    };
  }
  if (gustsKmh >= 100 || windKmh >= 80) {
    return {
      level: 'rouge',
      ico: '🔴',
      title: 'ALERTE VENT VIOLENT',
      text: 'Rafales > 100 km/h. Risque de dégâts sur les toitures.',
      banner: true,
    };
  }
  if (gustsKmh >= 70 || windKmh >= 55) {
    return {
      level: 'orange',
      ico: '⚠️',
      title: 'VENT FORT',
      text: 'Rafales > 70 km/h. Vérifiez vos fixations de toiture.',
      banner: true,
    };
  }
  if (gustsKmh >= 50 || windKmh >= 40) {
    return {
      level: 'jaune',
      ico: '💨',
      title: 'Vent soutenu',
      text: 'Rafales modérées. Soyez vigilant si des travaux sont prévus.',
      banner: false,
    };
  }
  if (wmoCode >= 95) {
    return {
      level: 'orange',
      ico: '⛈',
      title: 'ORAGE EN COURS',
      text: 'Activité orageuse détectée dans votre zone.',
      banner: true,
    };
  }
  return null;
}

// Fermer la bannière
function closeWeatherAlert() {
  const banner = document.getElementById('weatherAlertBanner');
  const navbar  = document.getElementById('navbar');
  if (banner) banner.style.display = 'none';
  if (navbar)  navbar.style.top = '';
}

async function loadMeteo() {
  const loading = document.getElementById('meteoLoading');
  const content = document.getElementById('meteoContent');
  const errEl   = document.getElementById('meteoError');

  if (loading) loading.style.display = 'flex';
  if (content) content.style.display = 'none';
  if (errEl)   errEl.style.display   = 'none';

  // Coordonnées par défaut = Saint-Denis Réunion
  const DEFAULT_LAT = -20.8789;
  const DEFAULT_LNG =  55.4481;

  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('no_geo')); return; }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000, maximumAge: 60000,
      });
    });
    await fetchAndDisplayMeteo(pos.coords.latitude, pos.coords.longitude);
  } catch {
    // Géoloc refusée ou indisponible → on utilise Saint-Denis par défaut
    await fetchAndDisplayMeteo(DEFAULT_LAT, DEFAULT_LNG, true);
  }
}

async function fetchAndDisplayMeteo(lat, lng, isDefault = false) {
  const loading = document.getElementById('meteoLoading');
  const content = document.getElementById('meteoContent');
  const errEl   = document.getElementById('meteoError');

  try {
    // Récupérer météo + nom de ville en parallèle
    const [meteoRes, geoRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code,precipitation&timezone=Indian%2FReunion&wind_speed_unit=kmh`),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`, {
        headers: { 'Accept-Language': 'fr' },
      }),
    ]);

    const meteo = await meteoRes.json();
    const geo   = await geoRes.json();

    const cur   = meteo.current;
    const temp  = Math.round(cur.temperature_2m);
    const wind  = Math.round(cur.wind_speed_10m);
    const gusts = Math.round(cur.wind_gusts_10m);
    const hum   = cur.relative_humidity_2m;
    const rain  = cur.precipitation;
    const code  = cur.weather_code;
    const info  = wmoInfo(code);

    // Nom de la ville
    const city = geo.address?.city || geo.address?.town || geo.address?.village || geo.address?.county || 'La Réunion';
    const cityLabel = isDefault ? `${city} (défaut)` : city;

    // Remplir le widget
    document.getElementById('meteoCity').textContent     = cityLabel;
    document.getElementById('meteoIcon').textContent     = info.ico;
    document.getElementById('meteoTemp').textContent     = `${temp}°C`;
    document.getElementById('meteoDesc').textContent     = info.desc;
    document.getElementById('meteoWind').textContent     = wind;
    document.getElementById('meteoHumidity').textContent = hum + '%';
    document.getElementById('meteoRain').textContent     = rain.toFixed(1);
    document.getElementById('meteoGusts').textContent    = gusts;
    document.getElementById('meteoDate').textContent     = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long',
    });
    document.getElementById('meteoTime').textContent     = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit',
    });

    // Alerte locale dans le widget
    const alert = getAlertLevel(wind, gusts, code);
    const alertBox   = document.getElementById('meteoAlertBox');
    if (alert) {
      document.getElementById('meteoAlertIco').textContent   = alert.ico;
      document.getElementById('meteoAlertTitle').textContent = alert.title;
      document.getElementById('meteoAlertText').textContent  = alert.text;
      alertBox.className = `meteo-alert-box alert-${alert.level}`;
      alertBox.style.display = 'flex';

      // Bannière en haut de page si niveau suffisant
      if (alert.banner) showWeatherAlertBanner(alert);
    } else {
      if (alertBox) alertBox.style.display = 'none';
    }

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';

  } catch {
    if (loading) loading.style.display = 'none';
    if (errEl)   errEl.style.display   = 'flex';
  }
}

function showWeatherAlertBanner(alert) {
  const banner  = document.getElementById('weatherAlertBanner');
  const navbar  = document.getElementById('navbar');
  if (!banner) return;

  banner.className = `weather-alert-banner alert-banner-${alert.level}`;
  document.getElementById('alertBannerIco').textContent   = alert.ico;
  document.getElementById('alertBannerTitle').textContent = alert.title;
  document.getElementById('alertBannerMsg').textContent   = alert.text;
  banner.style.display = 'flex';

  // Décaler la nav vers le bas
  if (navbar) {
    const bh = banner.offsetHeight;
    navbar.style.top = bh + 'px';
    navbar.style.transition = 'top .3s';
  }
}

// Lancer au chargement
document.addEventListener('DOMContentLoaded', loadMeteo);
