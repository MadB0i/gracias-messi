/* i18n.js — EN / ES / HI language layer.
   No library. Translates prose only (headlines, section titles,
   milestone captions); stat numbers and proper nouns stay as-is.
   Elements opt in with data-i18n="key". Original EN text is captured
   at init as the fallback. Choice persists in sessionStorage.
   Exposes window.__GM_I18N { t, get, set } and fires "gm:lang". */
(function () {
  'use strict';

  var STORE = 'gm-lang';

  var DATA = {
    es: {
      'hero.sub': '193 partidos. 125 goles. Una nota a mano sobre papel cuadriculado, y el final de la carrera internacional más decorada de la historia del fútbol.',
      'stats.label': 'Los números que definen una era',
      'stat.goals': 'Goles',
      'stat.assists': 'Asistencias',
      'stat.trophies': 'Títulos',
      'stat.bdo': 'Balones de Oro',
      'stat.arg': 'Goles con Argentina',
      'stat.star': 'Estrellas en GitHub',
      'chart.title': 'Goles por temporada',
      'chart.sub': 'Cada temporada, cada club. Pasa el cursor para ver detalles.',
      'heat.title': 'El ritmo, temporada a temporada',
      'heat.sub': 'Veintidós temporadas en un calendario estilo contribuciones — la densidad de una carrera, de un vistazo.',
      'cards.title': 'Comparte un número',
      'cards.sub': 'Haz clic en cualquier tarjeta para descargar una imagen',
      'recap.cta': 'Genera mi resumen',
      'recap.sub': 'Un video vertical de ~15 segundos, dibujado en un canvas y grabado en tu navegador. Nada se sube.',
      'recap.recording': 'Grabando… mantén esta pestaña abierta',
      'recap.unsupported': 'Tu navegador no puede grabar video (falta MediaRecorder). Prueba Chrome, Edge o Firefox de escritorio.',
      'recap.saved': 'Listo — tu video se descargó. Compártelo.',
      'gallery.title': 'Momentos que definieron una era',
      'gallery.sub': 'Pasa el cursor para explorar',
      'timeline.title': 'Una vida en el juego',
      'tl.2004': 'Estreno senior con el Barcelona a los 17 años. Un chico de Rosario pisa el Camp Nou.',
      'tl.2005': 'Primer gol con la selección de Argentina. La albiceleste gana a un jugador que la redefinirá.',
      'tl.2009': 'Gana su primer Balón de Oro. El primero de ocho — más que ningún jugador en la historia.',
      'tl.2014': 'Lleva a Argentina a la final del Mundial en Brasil. Caen ante Alemania en la prórroga.',
      'tl.2016': 'Anuncia su retiro internacional tras perder la final de la Copa América. Meses después, revierte su decisión — tenía cuentas pendientes.',
      'tl.2021': 'Gana la Copa América y termina una sequía de 28 años. Ese mismo verano deja el Barcelona después de 21 años.',
      'tl.2022': 'Campeón del Mundial en Catar. La imagen definitoria: Messi levantando el trofeo dorado con el bisht.',
      'tl.2023': 'Llega al Inter Miami. Gana la Leagues Cup semanas después de llegar a Estados Unidos.',
      'tl.2024': 'Copa América consecutiva. La dinastía de Argentina es innegable.',
      'tl.2026': 'Subcampeón del Mundial — derrota ante España en la final. El 31 de agosto publica una nota a mano. Se cierra el capítulo internacional.',
      'bio.title': 'La historia completa',
      'bio.ch2': 'El diagnóstico',
      'bio.ch3': 'La servilleta',
      'bio.ch4': 'El prodigio',
      'bio.ch5': 'El capitán',
      'trophies.title': '47 títulos, cuatro clubes',
      'note.context': 'Parafraseado de su nota manuscrita en Instagram, 31 de agosto de 2026',
      'ownnote.title': 'Escribe tu propia nota',
      'ownnote.sub': 'La página donde él escribió su última nota. Añade la tuya — se queda en tu dispositivo.',
      'wall.title': 'El muro de los gracias',
      'wall.sub': 'Una libreta de invitados sin servidor: cada nota es un issue de GitHub en este repo. Firmada, con avatar y todo.',
      'wall.fine': 'Se publica como issue con etiqueta en github.com/MadB0i/gracias-messi',
      'wall.cta': 'Inicia sesión con GitHub para poner tu nota en el muro',
      'wall.loading': 'Cargando el muro…',
      'wall.empty': 'El muro espera su primera nota. La tuya podría ser.',
      'wall.error': 'GitHub está limitando peticiones ahora mismo. El muro volverá a cargar en tu próxima visita — las notas viven en los issues del repo.',
      'wall.done': 'Tu nota va en camino — publica el issue y aparecerá aquí (y para todos) en la siguiente carga.',
      'wy.label': 'Naciste en…',
      'wy.go': 'Ver mi línea del tiempo',
      'wy.was': 'Tenías {n} años',
      'wy.nothere': 'Aún no habías nacido',
      'crowd.label': 'Gente'
    },
    hi: {
      'hero.sub': '193 मुकाबले। 125 गोल। क्वाड्रिड कागज़ पर हाथ से लिखा एक नोट, और फुटबॉल इतिहास की सबसे सजावटदार अंतरराष्ट्रीय करियर का अंत।',
      'stats.label': 'एरा की परिभाषा करने वाले अंक',
      'stat.goals': 'गोल',
      'stat.assists': 'एसिस्ट',
      'stat.trophies': 'ट्रॉफी',
      'stat.bdo': 'बॉलन डोर',
      'stat.arg': 'अर्जेंटीना के लिए गोल',
      'stat.star': 'GitHub पर स्टार',
      'chart.title': 'सीज़न-दर-सीज़न गोल',
      'chart.sub': 'हर सीज़न, हर क्लब। विवरण के लिए होवर करें।',
      'heat.title': 'लय, सीज़न दर सीज़न',
      'heat.sub': 'बाईस सीज़न, एक कैलेंडर पर — एक करियर की घनत्व, एक नज़र में।',
      'cards.title': 'एक आँकड़ा साझा करें',
      'cards.sub': 'किसी भी कार्ड पर क्लिक करके इमेज डाउनलोड करें',
      'recap.cta': 'मेरा रीकैप बनाओ',
      'recap.sub': '~15 सेकंड का वर्टिकल वीडियो, canvas पर बनाया और आपके ब्राउज़र में रिकॉर्ड किया। कुछ भी अपलोड नहीं होता।',
      'recap.recording': 'रिकॉर्डिंग… यह टैब खुला रखें',
      'recap.unsupported': 'आपका ब्राउज़र वीडियो रिकॉर्ड नहीं कर सकता (MediaRecorder नहीं है)। डेस्कटॉप Chrome, Edge या Firefox आज़माएँ।',
      'recap.saved': 'हो गया — आपका वीडियो डाउनलोड हो गया। शेयर कीजिए।',
      'gallery.title': 'एरा को परिभाषित करने वाले पल',
      'gallery.sub': 'खोजने के लिए होवर करें',
      'timeline.title': 'खेल में एक ज़िंदगी',
      'tl.2004': '17 साल की उम्र में बार्सिलोना के लिए सीनियर डेब्यू। रोजारियो के एक लड़के ने कैंप नो का मैदान छुआ।',
      'tl.2005': 'अर्जेंटीना के लिए पहला गोल। टीम को मिला जो उसे नई परिभाषा देगा।',
      'tl.2009': 'पहला बॉलन डोर जीता। आठ में से पहला — इतिहास में किसी खिलाड़ी से ज़्यादा।',
      'tl.2014': 'ब्राज़ील में विश्व कप फ़ाइनल तक अर्जेंटीना ले गए। अतिरिक्त समय में जर्मनी के हाथों हारे।',
      'tl.2016': 'कोपा अमेरिका फ़ाइनल हार के बाद अंतरराष्ट्रीय रिटायरमेंट की घोषणा। कुछ महीनों बाद फैसला वापस लिया — अधूरी बातें थीं।',
      'tl.2021': 'कोपा अमेरिका जीती, 28 साल की ख़ुश्की ख़त्म। उसी गर्मियों में 21 साल बाद बार्सिलोना छोड़ा।',
      'tl.2022': 'कतर में विश्व कप चैंपियन। आइकॉनिक तस्वीर: बश्त पहने मесси, सुनहरी ट्रॉफी उठाते हुए।',
      'tl.2023': 'इंटर मियामी जॉइन किया। अमेरिका आकर हफ़्तों में Leagues Cup जीत ली।',
      'tl.2024': 'बाक़ा-बाक़ा कोपा अमेरिका चैंपियन। अर्जेंटीना का राज शक से परे।',
      'tl.2026': 'विश्व कप रनर-अप — फ़ाइनल में स्पेन के हाथों हार। 31 अगस्त को हाथ-लिखा नोट पोस्ट किया। अंतरराष्ट्रीय अध्याय बंद।',
      'bio.title': 'पूरी कहानी',
      'bio.ch2': 'दाने का पता चलना',
      'bio.ch3': 'नैपकिन',
      'bio.ch4': 'अद्भुत',
      'bio.ch5': 'कप्तान',
      'trophies.title': '47 ट्रॉफी, चार क्लब',
      'note.context': 'उनके 31 अगस्त 2026 के इंस्टाग्राम नोट से उदाहरित',
      'ownnote.title': 'अपना नोट लिखो',
      'ownnote.sub': 'वही पन्ना जिस पर उन्होंने अपना आखिरी नोट लिखा। अपना जोड़ो — यह आपके डिवाइस पर रहता है।',
      'wall.title': 'ग्रासियास की दीवार',
      'wall.sub': 'बिना सर्वर की मेहमान-नामा: हर नोट इसी repo का GitHub issue है। सिग्नेट, एवाटर — सब कुछ।',
      'wall.fine': 'github.com/MadB0i/gracias-messi पर लेबल वाला issue बनकर पोस्ट होता है',
      'wall.cta': 'दीवार पर अपनी नोट जोड़ने के लिए GitHub से साइन इन करें',
      'wall.loading': 'दीवार लोड हो रही है…',
      'wall.empty': 'दीवार अपनी पहली नोट का इंतज़ार कर रही है। शायद आपकी।',
      'wall.error': 'GitHub अभी रेट-लिमिट कर रहा है। दीवार अगली विज़िट पर लोड होगी — नोट्स repo के issues में जीते हैं।',
      'wall.done': 'आपकी नोट राह पर है — issue पब्लिश करते ही वह यहाँ (और सबके लिए) अगली लोड पर दिखेगी।',
      'wy.label': 'आप जन्मे…',
      'wy.go': 'मेरी टाइमलाइन देखो',
      'wy.was': 'आप {n} साल के थे',
      'wy.nothere': 'आप अभी जन्मे नहीं थे',
      'crowd.label': 'जमकर'
    }
  };

  var lang = 'en';
  var els = [];

  function readStore() {
    try {
      var v = sessionStorage.getItem(STORE);
      return (v === 'es' || v === 'hi' || v === 'en') ? v : 'en';
    } catch (err) { return 'en'; }
  }

  function t(key, vars) {
    var pack = DATA[lang];
    var str = pack && pack[key];
    if (str === undefined) str = null; // fallback: original EN text (handled by caller)
    if (str && vars) {
      Object.keys(vars).forEach(function (k) {
        str = str.replace('{' + k + '}', vars[k]);
      });
    }
    return str;
  }

  function apply(next) {
    lang = (next === 'es' || next === 'hi') ? next : 'en';
    try { sessionStorage.setItem(STORE, lang); } catch (err) { /* private mode */ }
    els.forEach(function (rec) {
      var key = rec.key;
      var translated = (DATA[lang] && DATA[lang][key]) || null;
      rec.el.textContent = translated !== null ? translated : rec.en;
    });
    var sw = document.getElementById('langSwitch');
    if (sw) {
      Array.prototype.forEach.call(sw.querySelectorAll('[data-lang]'), function (b) {
        var on = b.getAttribute('data-lang') === lang;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : lang);
    document.dispatchEvent(new CustomEvent('gm:lang', { detail: { lang: lang } }));
  }

  function init() {
    lang = readStore();
    els = [];
    var nodes = document.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute('data-i18n');
      els.push({ key: key, el: el, en: el.textContent });
    });
    var sw = document.getElementById('langSwitch');
    if (sw) {
      Array.prototype.forEach.call(sw.querySelectorAll('[data-lang]'), function (b) {
        b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
      });
    }
    apply(lang);
  }

  window.__GM_I18N = {
    t: t,
    get: function () { return lang; },
    set: apply
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
