'use strict';

/* ═══════════════════════════════════════════════════════════════
   CARTE LEAFLET — La Réunion
   ═══════════════════════════════════════════════════════════════ */
function initMap() {
  const mapEl = document.getElementById('reunionMap');
  if (!mapEl) return;
  if (typeof L === 'undefined') {
    console.error('Leaflet non chargé');
    return;
  }

  const REUNION_CENTER = [-21.1151, 55.5364];
  const COMPANY_LAT   = -20.8789;
  const COMPANY_LNG   =  55.4481;

  const map = L.map('reunionMap', {
    center: REUNION_CENTER,
    zoom: 10,
    scrollWheelZoom: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  // Icône personnalisée
  const icon = L.divIcon({
    html: '<div class="lf-marker-pin"></div><div class="lf-marker-label">MIRAUX Toiture</div>',
    className: 'lf-marker-wrap',
    iconSize: [130, 52],
    iconAnchor: [65, 44],
    popupAnchor: [0, -44],
  });

  L.marker([COMPANY_LAT, COMPANY_LNG], { icon })
    .addTo(map)
    .bindPopup(
      '<div class="map-popup"><strong>🏠 MIRAUX Toiture</strong><br/>Couvreur à La Réunion 974<br/>' +
      '<a href="tel:+262692000000">0692 00 00 00</a> &nbsp;|&nbsp; <a href="#contact">Devis gratuit →</a></div>',
      { maxWidth: 220 }
    )
    .openPopup();

  // Zone intervention
  L.circle([COMPANY_LAT, COMPANY_LNG], {
    radius: 55000,
    color: '#F27059',
    fillColor: '#F27059',
    fillOpacity: 0.07,
    weight: 2,
    dashArray: '6 4',
  }).addTo(map).bindTooltip("Zone d'intervention : toute l'île 974", { sticky: true });
}

/* ═══════════════════════════════════════════════════════════════
   MÉTÉO
   ═══════════════════════════════════════════════════════════════ */
const DEFAULT_LAT = -20.8789;
const DEFAULT_LNG =  55.4481;
const DEFAULT_CITY = 'Saint-Denis';

function wmoInfo(code) {
  if (code === 0)      return { ico: '☀️', desc: 'Ciel dégagé' };
  if (code <= 2)       return { ico: '🌤', desc: 'Peu nuageux' };
  if (code === 3)      return { ico: '☁️', desc: 'Couvert' };
  if (code <= 48)      return { ico: '🌫', desc: 'Brouillard' };
  if (code <= 55)      return { ico: '🌦', desc: 'Bruine' };
  if (code <= 67)      return { ico: '🌧', desc: 'Pluie' };
  if (code <= 77)      return { ico: '❄️', desc: 'Neige' };
  if (code <= 82)      return { ico: '🌧', desc: 'Averses' };
  if (code <= 86)      return { ico: '🌨', desc: 'Averses neigeuses' };
  if (code === 95)     return { ico: '⛈',  desc: 'Orage' };
  if (code >= 96)      return { ico: '⛈',  desc: 'Orage violent' };
  return                      { ico: '🌡',  desc: 'Variable' };
}

function getAlertLevel(wind, gusts, code) {
  if (gusts >= 150 || wind >= 120) return { level:'violet', ico:'🌀', title:'CYCLONE EXTRÊME', text:'Rafales >150 km/h. Restez chez vous !', banner:true };
  if (gusts >= 100 || wind >= 80)  return { level:'rouge',  ico:'🔴', title:'ALERTE VENT VIOLENT', text:'Rafales >100 km/h. Risque de dégâts toiture.', banner:true };
  if (gusts >= 70  || wind >= 55)  return { level:'orange', ico:'⚠️', title:'VENT FORT', text:'Rafales >70 km/h. Vérifiez vos fixations.', banner:true };
  if (gusts >= 50  || wind >= 40)  return { level:'jaune',  ico:'💨', title:'Vent soutenu', text:'Rafales modérées. Vigilance recommandée.', banner:false };
  if (code >= 95)                   return { level:'orange', ico:'⛈',  title:'ORAGE EN COURS', text:'Activité orageuse détectée dans votre zone.', banner:true };
  return null;
}

function closeWeatherAlert() {
  const b = document.getElementById('weatherAlertBanner');
  const n = document.getElementById('navbar');
  if (b) b.style.display = 'none';
  if (n) n.style.top = '';
}
window.closeWeatherAlert = closeWeatherAlert;

async function fetchAndDisplay(lat, lng, cityFallback) {
  const loading = document.getElementById('meteoLoading');
  const content = document.getElementById('meteoContent');
  const errEl   = document.getElementById('meteoError');

  try {
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code,precipitation` +
      `&timezone=Indian%2FReunion&wind_speed_unit=kmh`;

    const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`;

    const [mRes, gRes] = await Promise.all([
      fetch(meteoUrl),
      fetch(geoUrl, { headers: { 'User-Agent': 'miraux-toiture-site/1.0' } }),
    ]);

    if (!mRes.ok) throw new Error('meteo api error');

    const m = await mRes.json();
    const g = gRes.ok ? await gRes.json() : null;

    const cur   = m.current;
    const temp  = Math.round(cur.temperature_2m);
    const wind  = Math.round(cur.wind_speed_10m);
    const gusts = Math.round(cur.wind_gusts_10m);
    const hum   = cur.relative_humidity_2m;
    const rain  = cur.precipitation;
    const code  = cur.weather_code;
    const info  = wmoInfo(code);

    const city = g?.address?.city || g?.address?.town || g?.address?.village ||
                 g?.address?.county || cityFallback || DEFAULT_CITY;

    setText('meteoCity',     city);
    setText('meteoIcon',     info.ico);
    setText('meteoTemp',     temp + '°C');
    setText('meteoDesc',     info.desc);
    setText('meteoWind',     wind);
    setText('meteoHumidity', hum + '%');
    setText('meteoRain',     rain.toFixed(1));
    setText('meteoGusts',    gusts);
    setText('meteoDate',     new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' }));
    setText('meteoTime',     new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' }));

    // Alerte
    const alert = getAlertLevel(wind, gusts, code);
    const box   = document.getElementById('meteoAlertBox');
    if (alert && box) {
      setText('meteoAlertIco',   alert.ico);
      setText('meteoAlertTitle', alert.title);
      setText('meteoAlertText',  alert.text);
      box.className      = 'meteo-alert-box alert-' + alert.level;
      box.style.display  = 'flex';
      if (alert.banner) showBanner(alert);
    } else if (box) {
      box.style.display = 'none';
    }

    if (loading) loading.style.display = 'none';
    if (content) content.style.display = 'block';
    if (errEl)   errEl.style.display   = 'none';

  } catch (err) {
    console.error('Météo erreur:', err);
    if (loading) loading.style.display = 'none';
    if (errEl)   errEl.style.display   = 'flex';
  }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showBanner(alert) {
  const banner = document.getElementById('weatherAlertBanner');
  const navbar = document.getElementById('navbar');
  if (!banner) return;
  banner.className = 'weather-alert-banner alert-banner-' + alert.level;
  setText('alertBannerIco',   alert.ico);
  setText('alertBannerTitle', alert.title);
  setText('alertBannerMsg',   alert.text);
  banner.style.display = 'flex';
  if (navbar) {
    navbar.style.top        = banner.offsetHeight + 'px';
    navbar.style.transition = 'top .3s';
  }
}

async function loadMeteo() {
  const loading = document.getElementById('meteoLoading');
  const content = document.getElementById('meteoContent');
  const errEl   = document.getElementById('meteoError');

  if (loading) { loading.style.display = 'flex'; }
  if (content) { content.style.display = 'none'; }
  if (errEl)   { errEl.style.display   = 'none'; }

  if (!navigator.geolocation) {
    await fetchAndDisplay(DEFAULT_LAT, DEFAULT_LNG, DEFAULT_CITY + ' (défaut)');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await fetchAndDisplay(pos.coords.latitude, pos.coords.longitude, null);
    },
    async () => {
      // Géoloc refusée → fallback IP via ipapi.co
      try {
        const r = await fetch('https://ipapi.co/json/');
        if (r.ok) {
          const d = await r.json();
          const lat  = d.latitude  || DEFAULT_LAT;
          const lng  = d.longitude || DEFAULT_LNG;
          const city = d.city      || DEFAULT_CITY;
          await fetchAndDisplay(lat, lng, city + ' (approx.)');
        } else throw new Error();
      } catch {
        await fetchAndDisplay(DEFAULT_LAT, DEFAULT_LNG, DEFAULT_CITY + ' (défaut)');
      }
    },
    { timeout: 8000, maximumAge: 120000 }
  );
}

window.loadMeteo = loadMeteo;

/* ═══════════════════════════════════════════════════════════════
   INIT au chargement
   ═══════════════════════════════════════════════════════════════ */
// Lancer dès que le DOM est prêt (le script est en bas de body)
initMap();
loadMeteo();
