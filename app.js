/* =========================================================
   CIEL LIVE V4
   Main application
========================================================= */

(() => {

  "use strict";

  /* =======================================================
     STATE
  ======================================================== */

  const state = {

    location: {
      latitude: null,
      longitude: null,
      accuracy: null
    },

    orientation: {
      enabled: false,
      heading: 0,
      altitude: 45,
      alpha: null,
      beta: null,
      gamma: null
    },

    audio: false,

    nightMode: false,

    initialized: false,

    selectedObject: null,

    missions: {
      completed: []
    },

    stars: [],

    planets: [],

    lastFrame: 0

  };


  /* =======================================================
     DOM
  ======================================================== */

  const $ = id => document.getElementById(id);

  const canvas = $("skyCanvas");

  const ctx = canvas.getContext("2d");

  const skyView = $("skyView");


  /* =======================================================
     CONSTANTS
  ======================================================== */

  const DEG = Math.PI / 180;

  const RAD = 180 / Math.PI;

  const DEFAULT_LAT = 43.7102;

  const DEFAULT_LON = 7.2620;


  /* =======================================================
     STAR CATALOG
     RA / DEC J2000 approximate
  ======================================================== */

  state.stars = [

    {
      name: "Sirius",
      ra: 6.7525,
      dec: -16.7161,
      mag: -1.46,
      emoji: "⭐",
      description:
        "L'étoile la plus brillante du ciel nocturne."
    },

    {
      name: "Canopus",
      ra: 6.3992,
      dec: -52.6957,
      mag: -0.74,
      emoji: "⭐",
      description:
        "Une des étoiles les plus brillantes du ciel."
    },

    {
      name: "Arcturus",
      ra: 14.2610,
      dec: 19.1825,
      mag: -0.05,
      emoji: "⭐",
      description:
        "Une géante orange très brillante."
    },

    {
      name: "Vega",
      ra: 18.6156,
      dec: 38.7837,
      mag: 0.03,
      emoji: "⭐",
      description:
        "L'une des étoiles les plus brillantes de l'hémisphère nord."
    },

    {
      name: "Capella",
      ra: 5.2782,
      dec: 45.9980,
      mag: 0.08,
      emoji: "⭐",
      description:
        "Une brillante étoile de la constellation du Cocher."
    },

    {
      name: "Rigel",
      ra: 5.2423,
      dec: -8.2016,
      mag: 0.13,
      emoji: "⭐",
      description:
        "Une supergéante bleue dans Orion."
    },

    {
      name: "Procyon",
      ra: 7.6550,
      dec: 5.2250,
      mag: 0.34,
      emoji: "⭐",
      description:
        "L'une des étoiles principales du Petit Chien."
    },

    {
      name: "Betelgeuse",
      ra: 5.9195,
      dec: 7.4070,
      mag: 0.42,
      emoji: "⭐",
      description:
        "Une supergéante rouge célèbre d'Orion."
    },

    {
      name: "Altair",
      ra: 19.8464,
      dec: 8.8683,
      mag: 0.77,
      emoji: "⭐",
      description:
        "Une étoile brillante du Triangle d'été."
    },

    {
      name: "Aldebaran",
      ra: 4.5987,
      dec: 16.5093,
      mag: 0.85,
      emoji: "⭐",
      description:
        "L'œil orangé de la constellation du Taureau."
    },

    {
      name: "Spica",
      ra: 13.4199,
      dec: -11.1614,
      mag: 0.98,
      emoji: "⭐",
      description:
        "L'étoile principale de la Vierge."
    },

    {
      name: "Antares",
      ra: 16.4901,
      dec: -26.4319,
      mag: 1.06,
      emoji: "⭐",
      description:
        "Une supergéante rouge du Scorpion."
    },

    {
      name: "Pollux",
      ra: 7.7553,
      dec: 28.0262,
      mag: 1.14,
      emoji: "⭐",
      description:
        "L'une des deux étoiles principales des Gémeaux."
    },

    {
      name: "Deneb",
      ra: 20.6905,
      dec: 45.2803,
      mag: 1.25,
      emoji: "⭐",
      description:
        "Une étoile géante du Triangle d'été."
    },

    {
      name: "Regulus",
      ra: 10.1395,
      dec: 11.9672,
      mag: 1.35,
      emoji: "⭐",
      description:
        "L'étoile principale du Lion."
    },

    {
      name: "Fomalhaut",
      ra: 22.9608,
      dec: -29.6222,
      mag: 1.16,
      emoji: "⭐",
      description:
        "Une étoile brillante du Poisson austral."
    }

  ];


  /* =======================================================
     CONSTELLATION LINES
     Approximate RA/DEC
  ======================================================== */

  const constellationLines = [

    {
      name: "Orion",
      points: [
        [5.2423, -8.20],
        [5.9195, 7.40],
        [5.6793, -1.94],
        [5.5334, -0.30],
        [5.6036, -1.20],
        [5.6793, -1.94]
      ]
    },

    {
      name: "Grande Ourse",
      points: [
        [11.0621, 61.75],
        [11.8971, 53.69],
        [11.7674, 49.31],
        [11.0307, 56.38],
        [11.0621, 61.75]
      ]
    },

    {
      name: "Triangle d'été",
      points: [
        [18.6156, 38.78],
        [19.8464, 8.87],
        [20.6905, 45.28],
        [18.6156, 38.78]
      ]
    }

  ];


  /* =======================================================
     PLANETS
  ======================================================== */

  const planetDefinitions = [

    {
      name: "Mercure",
      body: "Mercury",
      emoji: "☿",
      color: "#b8a48a"
    },

    {
      name: "Vénus",
      body: "Venus",
      emoji: "♀",
      color: "#f6d28a"
    },

    {
      name: "Mars",
      body: "Mars",
      emoji: "♂",
      color: "#ef6a5b"
    },

    {
      name: "Jupiter",
      body: "Jupiter",
      emoji: "♃",
      color: "#e9c49a"
    },

    {
      name: "Saturne",
      body: "Saturn",
      emoji: "♄",
      color: "#e6d6a3"
    },

    {
      name: "Uranus",
      body: "Uranus",
      emoji: "♅",
      color: "#9de8e8"
    },

    {
      name: "Neptune",
      body: "Neptune",
      emoji: "♆",
      color: "#6da7ff"
    }

  ];


  /* =======================================================
     HELPERS
  ======================================================== */

  function clamp(value, min, max) {

    return Math.max(
      min,
      Math.min(max, value)
    );

  }


  function normalize360(value) {

    return ((value % 360) + 360) % 360;

  }


  function angleDifference(a, b) {

    return ((a - b + 540) % 360) - 180;

  }


  function formatDegree(value) {

    return `${Math.round(value)}°`;

  }


  function currentObserver() {

    const lat =
      state.location.latitude ??
      DEFAULT_LAT;

    const lon =
      state.location.longitude ??
      DEFAULT_LON;

    if (
      typeof Astronomy === "undefined"
    ) {
      return null;
    }

    return new Astronomy.Observer(
      lat,
      lon,
      0
    );

  }


  /* =======================================================
     TOAST
  ======================================================== */

  let toastTimer = null;

  function toast(
    message,
    icon = "ℹ️"
  ) {

    const el = $("toast");

    $("toastIcon").textContent = icon;

    $("toastMessage").textContent = message;

    el.classList.add("visible");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

      el.classList.remove("visible");

    }, 3200);

  }


  /* =======================================================
     LOCATION
  ======================================================== */

  function updateLocationStatus(
    active = false
  ) {

    const dot =
      $("locationStatusIcon");

    const text =
      $("locationStatus");

    if (active) {

      dot.classList.add("active");

      text.textContent =
        `${state.location.latitude.toFixed(2)}°, ${state.location.longitude.toFixed(2)}°`;

    } else {

      dot.classList.remove("active");

      text.textContent =
        "Position en attente";

    }

  }


  function requestLocation() {

    if (!navigator.geolocation) {

      toast(
        "La géolocalisation n'est pas disponible.",
        "⚠️"
      );

      return;

    }

    navigator.geolocation.getCurrentPosition(

      position => {

        state.location.latitude =
          position.coords.latitude;

        state.location.longitude =
          position.coords.longitude;

        state.location.accuracy =
          position.coords.accuracy;

        updateLocationStatus(true);

        toast(
          "Position GPS obtenue.",
          "📍"
        );

        render();

      },

      error => {

        console.warn(
          "GPS error:",
          error
        );

        toast(
          "Impossible d'obtenir le GPS. Position approximative utilisée.",
          "⚠️"
        );

        state.location.latitude =
          DEFAULT_LAT;

        state.location.longitude =
          DEFAULT_LON;

        updateLocationStatus(true);

      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }

    );

  }


  /* =======================================================
     ORIENTATION
  ======================================================== */

  async function enableOrientation() {

    try {

      if (
        typeof DeviceOrientationEvent ===
        "undefined"
      ) {

        toast(
          "Orientation non disponible sur cet appareil.",
          "⚠️"
        );

        return;

      }


      if (
        typeof DeviceOrientationEvent.requestPermission ===
        "function"
      ) {

        const permission =
          await DeviceOrientationEvent
            .requestPermission(true);

        if (
          permission !== "granted"
        ) {

          toast(
            "Accès à l'orientation refusé.",
            "⚠️"
          );

          return;

        }

      }


      window.addEventListener(
        "deviceorientation",
        handleOrientation,
        true
      );


      window.addEventListener(
        "deviceorientationabsolute",
        handleOrientation,
        true
      );


      state.orientation.enabled =
        true;


      $("orientationStatusIcon")
        .classList.add("active");

      $("orientationStatus")
        .textContent =
        "Orientation active";

      $("orientationHint")
        .classList.add("hidden");

      $("orientationSettingText")
        .textContent =
        "Orientation active";


      toast(
        "Orientation activée. Pointe ton téléphone vers le ciel.",
        "📱"
      );


    } catch (error) {

      console.error(error);

      toast(
        "Impossible d'activer l'orientation.",
        "⚠️"
      );

    }

  }


  function handleOrientation(event) {

    let heading = null;


    /*
      iOS Safari exposes webkitCompassHeading.
    */

    if (
      typeof event.webkitCompassHeading ===
      "number"
    ) {

      heading =
        event.webkitCompassHeading;

    }

    /*
      Android / absolute orientation.
    */

    else if (
      typeof event.alpha ===
      "number"
    ) {

      heading =
        normalize360(
          360 - event.alpha
        );

    }


    if (
      heading === null
    ) {
      return;
    }


    state.orientation.heading =
      normalize360(heading);

    state.orientation.alpha =
      event.alpha;

    state.orientation.beta =
      event.beta;

    state.orientation.gamma =
      event.gamma;


    /*
      Approximation de la hauteur
      du téléphone.

      Téléphone horizontal :
      beta ≈ 0

      Téléphone pointé vers le ciel :
      beta ≈ -90
    */

    if (
      typeof event.beta ===
      "number"
    ) {

      const altitude =
        clamp(
          90 - Math.abs(event.beta),
          0,
          90
        );

      state.orientation.altitude =
        altitude;

    }


    updateDirection();

  }


  function updateDirection() {

    const heading =
      state.orientation.heading;

    let letter = "N";

    if (
      heading >= 22.5 &&
      heading < 67.5
    ) {

      letter = "NE";

    } else if (
      heading >= 67.5 &&
      heading < 112.5
    ) {

      letter = "E";

    } else if (
      heading >= 112.5 &&
      heading < 157.5
    ) {

      letter = "SE";

    } else if (
      heading >= 157.5 &&
      heading < 202.5
    ) {

      letter = "S";

    } else if (
      heading >= 202.5 &&
      heading < 247.5
    ) {

      letter = "SO";

    } else if (
      heading >= 247.5 &&
      heading < 292.5
    ) {

      letter = "O";

    } else if (
      heading >= 292.5 &&
      heading < 337.5
    ) {

      letter = "NO";

    }


    $("directionLetter")
      .textContent = letter;

  }


  /* =======================================================
     ASTRONOMY
  ======================================================== */

  function getStarHorizontal(
    star,
    date,
    observer
  ) {

    const eq =
      Astronomy.Horizon(
        date,
        observer,
        star.ra,
        star.dec,
        "normal"
      );

    return {
      azimuth: normalize360(eq.azimuth),
      altitude: eq.altitude
    };

  }


  function getPlanetHorizontal(
    body,
    date,
    observer
  ) {

    try {

      const eq =
        Astronomy.Equator(
          body,
          date,
          observer,
          true,
          true
        );

      const horizon =
        Astronomy.Horizon(
          date,
          observer,
          eq.ra,
          eq.dec,
          "normal"
        );

      return {
        azimuth:
          normalize360(
            horizon.azimuth
          ),

        altitude:
          horizon.altitude
      };

    } catch (error) {

      console.warn(
        "Planet calculation error:",
        body,
        error
      );

      return null;

    }

  }


  function getSunMoon() {

    const observer =
      currentObserver();

    if (!observer) {
      return [];
    }

    const date =
      new Date();


    const bodies = [

      {
        name: "Soleil",
        body: "Sun",
        emoji: "☀️",
        description:
          "Notre étoile.",
        mag: -26
      },

      {
        name: "Lune",
        body: "Moon",
        emoji: "🌙",
        description:
          "Le satellite naturel de la Terre.",
        mag: -12
      }

    ];


    return bodies
      .map(item => {

        const pos =
          getPlanetHorizontal(
            item.body,
            date,
            observer
          );

        if (!pos) {
          return null;
        }

        return {
          ...item,
          ...pos
        };

      })
      .filter(Boolean);

  }


  function calculatePlanets() {

    const observer =
      currentObserver();

    if (!observer) {
      return [];
    }

    const date =
      new Date();


    return planetDefinitions
      .map(definition => {

        const pos =
          getPlanetHorizontal(
            definition.body,
            date,
            observer
          );

        if (!pos) {
          return null;
        }

        return {
          ...definition,
          ...pos
        };

      })
      .filter(Boolean);

  }


  /* =======================================================
     CANVAS
  ======================================================== */

  function resizeCanvas() {

    const ratio =
      window.devicePixelRatio || 1;

    const rect =
      skyView.getBoundingClientRect();

    canvas.width =
      rect.width * ratio;

    canvas.height =
      rect.height * ratio;

    canvas.style.width =
      `${rect.width}px`;

    canvas.style.height =
      `${rect.height}px`;

    ctx.setTransform(
      ratio,
      0,
      0,
      ratio,
      0,
      0
    );

  }


  function skyProjection(
    azimuth,
    altitude
  ) {

    const width =
      skyView.clientWidth;

    const height =
      skyView.clientHeight;


    /*
      Field of view.
    */

    const horizontalFov =
      100;

    const verticalFov =
      65;


    /*
      Centre view.

      If orientation is unavailable,
      use North and altitude 45°.
    */

    const centerAz =
      state.orientation.enabled
        ? state.orientation.heading
        : 0;

    const centerAlt =
      state.orientation.enabled
        ? state.orientation.altitude
        : 45;


    let dx =
      angleDifference(
        azimuth,
        centerAz
      );


    let dy =
      altitude - centerAlt;


    const x =
      width / 2 +
      (dx / horizontalFov) *
      width;


    const y =
      height / 2 -
      (dy / verticalFov) *
      height;


    return {
      x,
      y,
      visible:
        Math.abs(dx) <=
          horizontalFov / 2 &&
        Math.abs(dy) <=
          verticalFov / 2
    };

  }


  /* =======================================================
     SKY BACKGROUND
  ======================================================== */

  function drawBackground() {

    const width =
      skyView.clientWidth;

    const height =
      skyView.clientHeight;


    const gradient =
      ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );


    gradient.addColorStop(
      0,
      "rgba(15, 36, 86, 0.34)"
    );

    gradient.addColorStop(
      0.55,
      "rgba(4, 14, 37, 0.4)"
    );

    gradient.addColorStop(
      1,
      "rgba(1, 5, 18, 0.92)"
    );


    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

  }


  /* =======================================================
     RANDOM BACKGROUND STARS
  ======================================================== */

  let backgroundStars = [];

  function generateBackgroundStars() {

    backgroundStars = [];

    const width =
      skyView.clientWidth;

    const height =
      skyView.clientHeight;


    for (
      let i = 0;
      i < 220;
      i++
    ) {

      backgroundStars.push({

        x:
          Math.random() *
          width,

        y:
          Math.random() *
          height,

        r:
          Math.random() *
          1.2 +
          0.25,

        alpha:
          Math.random() *
          0.55 +
          0.15,

        phase:
          Math.random() *
          Math.PI *
          2

      });

    }

  }


  function drawBackgroundStars(
    time
  ) {

    backgroundStars.forEach(star => {

      const pulse =
        0.75 +
        Math.sin(
          time / 1200 +
          star.phase
        ) *
        0.25;

      ctx.beginPath();

      ctx.arc(
        star.x,
        star.y,
        star.r,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        `rgba(255,255,255,${
          star.alpha * pulse
        })`;

      ctx.fill();

    });

  }


  /* =======================================================
     CONSTELLATIONS
  ======================================================== */

  function drawConstellations(
    date,
    observer
  ) {

    ctx.lineWidth = 1;

    constellationLines.forEach(
      constellation => {

        ctx.beginPath();

        let started = false;


        constellation.points.forEach(
          point => {

            const star = {
              ra: point[0],
              dec: point[1]
            };


            const horizontal =
              getStarHorizontal(
                star,
                date,
                observer
              );


            if (
              horizontal.altitude <
              -5
            ) {
              return;
            }


            const projection =
              skyProjection(
                horizontal.azimuth,
                horizontal.altitude
              );


            if (
              !projection.visible
            ) {
              return;
            }


            if (!started) {

              ctx.moveTo(
                projection.x,
                projection.y
              );

              started = true;

            } else {

              ctx.lineTo(
                projection.x,
                projection.y
              );

            }

          }
        );


        ctx.strokeStyle =
          "rgba(125,211,252,0.17)";

        ctx.stroke();

      }
    );

  }


  /* =======================================================
     STAR DRAWING
  ======================================================== */

  function starRadius(
    magnitude
  ) {

    return clamp(
      5.5 -
        magnitude * 1.2,
      1.7,
      7
    );

  }


  function drawStar(
    star,
    horizontal
  ) {

    if (
      horizontal.altitude <=
      -5
    ) {
      return;
    }


    const p =
      skyProjection(
        horizontal.azimuth,
        horizontal.altitude
      );


    if (!p.visible) {
      return;
    }


    const radius =
      starRadius(star.mag);


    /*
      Glow
    */

    const glow =
      ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        radius * 4
      );


    glow.addColorStop(
      0,
      "rgba(255,255,255,0.5)"
    );

    glow.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );


    ctx.fillStyle =
      glow;

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      radius * 4,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /*
      Star
    */

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#ffffff";

    ctx.fill();


    /*
      Label only for bright stars.
    */

    if (
      star.mag <= 1.2
    ) {

      ctx.font =
        "600 9px -apple-system, sans-serif";

      ctx.fillStyle =
        "rgba(255,255,255,0.75)";

      ctx.textAlign =
        "center";

      ctx.fillText(
        star.name,
        p.x,
        p.y + radius + 12
      );

    }

  }


  /* =======================================================
     PLANET DRAWING
  ======================================================== */

  function drawPlanet(
    planet
  ) {

    if (
      planet.altitude <=
      -5
    ) {
      return;
    }


    const p =
      skyProjection(
        planet.azimuth,
        planet.altitude
      );


    if (!p.visible) {
      return;
    }


    const radius =
      planet.name === "Jupiter"
        ? 7
        : planet.name === "Venus"
          ? 7
          : 5;


    ctx.shadowBlur = 15;

    ctx.shadowColor =
      planet.color;


    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      planet.color;

    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.font =
      "800 9px -apple-system, sans-serif";

    ctx.textAlign =
      "center";

    ctx.fillStyle =
      "rgba(255,255,255,0.9)";

    ctx.fillText(
      planet.name,
      p.x,
      p.y + radius + 12
    );

  }


  /* =======================================================
     SUN / MOON
  ======================================================== */

  function drawSpecialBody(
    body
  ) {

    if (
      body.altitude <=
      -5
    ) {
      return;
    }


    const p =
      skyProjection(
        body.azimuth,
        body.altitude
      );


    if (!p.visible) {
      return;
    }


    const radius =
      body.body === "Sun"
        ? 13
        : 9;


    ctx.shadowBlur =
      body.body === "Sun"
        ? 25
        : 15;

    ctx.shadowColor =
      body.body === "Sun"
        ? "#facc15"
        : "#e2e8f0";


    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      body.body === "Sun"
        ? "#facc15"
        : "#e5e7eb";

    ctx.fill();

    ctx.shadowBlur = 0;


    ctx.font =
      "800 10px -apple-system, sans-serif";

    ctx.textAlign =
      "center";

    ctx.fillStyle =
      "#ffffff";

    ctx.fillText(
      body.name,
      p.x,
      p.y + radius + 14
    );

  }


  /* =======================================================
     RENDER
  ======================================================== */

  function render() {

    if (
      !state.initialized
    ) {
      return;
    }


    const observer =
      currentObserver();

    if (!observer) {
      return;
    }


    const date =
      new Date();


    drawBackground();

    drawBackgroundStars(
      performance.now()
    );


    drawConstellations(
      date,
      observer
    );


    /*
      Stars
    */

    state.stars.forEach(star => {

      const horizontal =
        getStarHorizontal(
          star,
          date,
          observer
        );

      drawStar(
        star,
        horizontal
      );

    });


    /*
      Planets
    */

    state.planets =
      calculatePlanets();

    state.planets.forEach(
      drawPlanet
    );


    /*
      Sun / Moon
    */

    getSunMoon()
      .forEach(
        drawSpecialBody
      );


    /*
      Satellites
      drawn by satellites.js
    */

    if (
      window.CielSatellites &&
      typeof window.CielSatellites.draw ===
      "function"
    ) {

      window.CielSatellites.draw(
        ctx,
        skyProjection
      );

    }

  }


  /* =======================================================
     ANIMATION LOOP
  ======================================================== */

  function animationLoop(
    timestamp
  ) {

    if (
      timestamp -
      state.lastFrame >
      120
    ) {

      render();

      updateClock();

      state.lastFrame =
        timestamp;

    }


    requestAnimationFrame(
      animationLoop
    );

  }


  /* =======================================================
     CLOCK
  ======================================================== */

  function updateClock() {

    const now =
      new Date();

    $("timeStatus")
      .textContent =
      now.toLocaleTimeString(
        "fr-FR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

  }


  /* =======================================================
     OBJECT SELECTION
  ======================================================== */

  function selectObject(
    object
  ) {

    state.selectedObject =
      object;


    $("objectEmoji")
      .textContent =
      object.emoji ||
      "⭐";


    $("objectType")
      .textContent =
      object.type ||
      "OBJET CÉLESTE";


    $("objectName")
      .textContent =
      object.name;


    $("objectDescription")
      .textContent =
      object.description ||
      "Objet céleste remarquable.";


    $("objectAzimuth")
      .textContent =
      formatDegree(
        object.azimuth ||
        0
      );


    $("objectAltitude")
      .textContent =
      formatDegree(
        object.altitude ||
        0
      );


    $("objectCard")
      .classList.remove(
        "hidden"
      );


    if (
      state.audio
    ) {

      speak(
        `${object.name}. ${object.description || ""}`
      );

    }

  }


  /* =======================================================
     CANVAS TOUCH
  ======================================================== */

  canvas.addEventListener(
    "click",
    event => {

      const rect =
        canvas.getBoundingClientRect();

      const x =
        event.clientX -
        rect.left;

      const y =
        event.clientY -
        rect.top;


      const observer =
        currentObserver();

      if (!observer) {
        return;
      }


      const date =
        new Date();


      let closest = null;

      let closestDistance =
        Infinity;


      /*
        Stars
      */

      state.stars.forEach(star => {

        const h =
          getStarHorizontal(
            star,
            date,
            observer
          );


        if (
          h.altitude <=
          -5
        ) {
          return;
        }


        const p =
          skyProjection(
            h.azimuth,
            h.altitude
          );


        const distance =
          Math.hypot(
            p.x - x,
            p.y - y
          );


        if (
          distance < 30 &&
          distance <
            closestDistance
        ) {

          closestDistance =
            distance;

          closest = {
            ...star,
            ...h,
            type: "ÉTOILE"
          };

        }

      });


      /*
        Planets
      */

      state.planets.forEach(
        planet => {

          if (
            planet.altitude <=
            -5
          ) {
            return;
          }


          const p =
            skyProjection(
              planet.azimuth,
              planet.altitude
            );


          const distance =
            Math.hypot(
              p.x - x,
              p.y - y
            );


          if (
            distance < 35 &&
            distance <
              closestDistance
          ) {

            closestDistance =
              distance;

            closest = {
              ...planet,
              type: "PLANÈTE",
              description:
                `Planète ${planet.name}.`
            };

          }

        }
      );


      if (closest) {

        selectObject(
          closest
        );

      }

    }
  );


  /* =======================================================
     TONIGHT PANEL
  ======================================================== */

  function openTonight() {

    const observer =
      currentObserver();

    if (!observer) {
      return;
    }


    const now =
      new Date();


    const items = [];


    /*
      Moon
    */

    const moon =
      getSunMoon()
        .find(
          x =>
            x.body === "Moon"
        );


    if (
      moon &&
      moon.altitude > 0
    ) {

      items.push({

        emoji: "🌙",

        name: "Lune",

        text:
          `Hauteur ${Math.round(moon.altitude)}° · Azimut ${Math.round(moon.azimuth)}°`,

        status:
          "VISIBLE"

      });

    }


    /*
      Planets
    */

    state.planets =
      calculatePlanets();


    state.planets
      .filter(
        planet =>
          planet.altitude >
          5
      )
      .forEach(
        planet => {

          items.push({

            emoji:
              planet.emoji,

            name:
              planet.name,

            text:
              `Hauteur ${Math.round(planet.altitude)}° · Azimut ${Math.round(planet.azimuth)}°`,

            status:
              "VISIBLE"

          });

        }
      );


    /*
      Stars
    */

    state.stars
      .filter(star => {

        const h =
          getStarHorizontal(
            star,
            now,
            observer
          );

        return h.altitude > 15;

      })
      .slice(0, 5)
      .forEach(star => {

        items.push({

          emoji: "⭐",

          name: star.name,

          text:
            star.description,

          status:
            "VISIBLE"

        });

      });


    if (
      items.length ===
      0
    ) {

      items.push({

        emoji: "🌌",

        name:
          "Ciel nocturne",

        text:
          "Peu d'objets remarquables sont actuellement au-dessus de l'horizon.",

        status:
          "À OBSERVER"

      });

    }


    $("tonightContent")
      .innerHTML =
      items.map(
        item => `

          <div class="discovery-card">

            <div class="discovery-icon">
              ${item.emoji}
            </div>

            <div class="discovery-info">

              <strong>
                ${item.name}
              </strong>

              <small>
                ${item.text}
              </small>

            </div>

            <span class="discovery-status">
              ${item.status}
            </span>

          </div>

        `
      ).join("");


    $("tonightPanel")
      .classList.remove(
        "hidden"
      );

  }


  /* =======================================================
     PLANET PANEL
  ======================================================== */

  function openPlanets() {

    state.planets =
      calculatePlanets();


    $("planetList")
      .innerHTML =
      state.planets
        .map(
          planet => `

            <button
              class="planet-card"
              data-planet="${planet.name}"
            >

              <div class="planet-symbol">
                ${planet.emoji}
              </div>

              <strong>
                ${planet.name}
              </strong>

              <small>
                ${
                  planet.altitude > 0
                    ? `Visible · ${Math.round(planet.altitude)}°`
                    : "Sous l'horizon"
                }
              </small>

            </button>

          `
        )
        .join("");


    document
      .querySelectorAll(
        "[data-planet]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const planet =
              state.planets.find(
                p =>
                  p.name ===
                  button.dataset.planet
              );

            if (planet) {

              selectObject({

                ...planet,

                type:
                  "PLANÈTE",

                description:
                  `Planète ${planet.name}.`

              });

              closePanels();

            }

          }
        );

      });


    $("planetPanel")
      .classList.remove(
        "hidden"
      );

  }


  /* =======================================================
     MISSIONS
  ======================================================== */

  const missions = [

    {
      id: "sirius",

      title:
        "Trouve Sirius",

      description:
        "Repère l'étoile la plus brillante du ciel nocturne.",

      target:
        "Sirius"

    },

    {
      id: "vega",

      title:
        "Trouve Véga",

      description:
        "Cherche Véga dans le Triangle d'été.",

      target:
        "Vega"

    },

    {
      id: "jupiter",

      title:
        "Trouve Jupiter",

      description:
        "Repère la plus grosse planète du système solaire.",

      target:
        "Jupiter"

    },

    {
      id: "saturn",

      title:
        "Trouve Saturne",

      description:
        "Cherche la planète aux magnifiques anneaux.",

      target:
        "Saturne"

    }

  ];


  function renderMissions() {

    const completed =
      state.missions.completed;


    $("missionList")
      .innerHTML =
      missions.map(
        (mission, index) => {

          const done =
            completed.includes(
              mission.id
            );


          return `

            <button
              class="mission-card-row"
              data-mission="${mission.id}"
            >

              <div class="mission-number">
                ${index + 1}
              </div>

              <div class="mission-text">

                <strong>
                  ${mission.title}
                </strong>

                <small>
                  ${mission.description}
                </small>

              </div>

              ${
                done
                  ? `<div class="mission-complete">✓</div>`
                  : ""
              }

            </button>

          `;

        }
      )
      .join("");


    document
      .querySelectorAll(
        "[data-mission]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            startMission(
              button.dataset.mission
            );

          }
        );

      });


    const count =
      completed.length;

    $("missionProgressText")
      .textContent =
      `${count} / ${missions.length}`;

    $("missionProgressBar")
      .style.width =
      `${count / missions.length * 100}%`;

  }


  function startMission(
    missionId
  ) {

    const mission =
      missions.find(
        m =>
          m.id ===
          missionId
      );


    if (!mission) {
      return;
    }


    closePanels();


    toast(
      `Mission : ${mission.title}`,
      "🎯"
    );


    /*
      Try to point user toward target.
    */

    const targetStar =
      state.stars.find(
        star =>
          star.name ===
          mission.target
      );


    if (targetStar) {

      const observer =
        currentObserver();

      const horizontal =
        getStarHorizontal(
          targetStar,
          new Date(),
          observer
        );


      if (
        horizontal.altitude >
        0
      ) {

        toast(
          `Cherche vers ${Math.round(horizontal.azimuth)}°`,
          "🧭"
        );

      } else {

        toast(
          "Cette cible est actuellement sous l'horizon.",
          "🌍"
        );

      }

      return;

    }


    /*
      Planet mission.
    */

    const planet =
      state.planets.find(
        p =>
          p.name ===
          mission.target
      );


    if (
      planet &&
      planet.altitude > 0
    ) {

      toast(
        `Cherche vers ${Math.round(planet.azimuth)}°`,
        "🧭"
      );

    }

  }


  /* =======================================================
     AUDIO
  ======================================================== */

  function speak(text) {

    if (
      !("speechSynthesis" in window)
    ) {
      return;
    }


    window.speechSynthesis.cancel();


    const utterance =
      new SpeechSynthesisUtterance(
        text
      );


    utterance.lang =
      "fr-FR";

    utterance.rate =
      0.9;


    window.speechSynthesis.speak(
      utterance
    );

  }


  /* =======================================================
     NIGHT MODE
  ======================================================== */

  function toggleNightMode() {

    state.nightMode =
      !state.nightMode;


    document.body
      .classList.toggle(
        "night-mode",
        state.nightMode
      );


    $("toggleNightMode")
      .textContent =
      state.nightMode
        ? "Désactiver"
        : "Activer";


    $("nightModeButton")
      .textContent =
      state.nightMode
        ? "🔴"
        : "🌙";

  }


  /* =======================================================
     PANELS
  ======================================================== */

  function closePanels() {

    [
      "tonightPanel",
      "satellitePanel",
      "planetPanel",
      "missionPanel",
      "settingsPanel"
    ]
    .forEach(id => {

      $(id)
        .classList.add(
          "hidden"
        );

    });

  }


  function openSettings() {

    closePanels();

    $("settingsPanel")
      .classList.remove(
        "hidden"
      );

  }


  /* =======================================================
     EVENT LISTENERS
  ======================================================== */

  $("startButton")
    .addEventListener(
      "click",
      async () => {

        $("startOverlay")
          .classList.add(
            "hidden"
          );


        state.initialized =
          true;


        requestLocation();


        await enableOrientation();


        if (
          window.CielSatellites
        ) {

          window.CielSatellites.init();

        }


        render();


      }
    );


  $("enableOrientation")
    .addEventListener(
      "click",
      enableOrientation
    );


  $("refreshLocation")
    .addEventListener(
      "click",
      requestLocation
    );


  $("nightModeButton")
    .addEventListener(
      "click",
      toggleNightMode
    );


  $("toggleNightMode")
    .addEventListener(
      "click",
      toggleNightMode
    );


  $("settingsButton")
    .addEventListener(
      "click",
      openSettings
    );


  $("closeSettings")
    .addEventListener(
      "click",
      closePanels
    );


  $("tonightButton")
    .addEventListener(
      "click",
      openTonight
    );


  $("closeTonight")
    .addEventListener(
      "click",
      closePanels
    );


  $("starsButton")
    .addEventListener(
      "click",
      () => {

        toast(
          "Les étoiles brillantes sont maintenant affichées sur la carte.",
          "⭐"
        );

      }
    );


  $("planetsButton")
    .addEventListener(
      "click",
      openPlanets
    );


  $("closePlanets")
    .addEventListener(
      "click",
      closePanels
    );


  $("satellitesButton")
    .addEventListener(
      "click",
      () => {

        closePanels();

        $("satellitePanel")
          .classList.remove(
            "hidden"
          );

        if (
          window.CielSatellites
        ) {

          window.CielSatellites
            .openPanel();

        }

      }
    );


  $("closeSatellites")
    .addEventListener(
      "click",
      closePanels
    );


  $("missionsButton")
    .addEventListener(
      "click",
      () => {

        closePanels();

        renderMissions();

        $("missionPanel")
          .classList.remove(
            "hidden"
          );

      }
    );


  $("closeMissions")
    .addEventListener(
      "click",
      closePanels
    );


  $("closeObjectCard")
    .addEventListener(
      "click",
      () => {

        $("objectCard")
          .classList.add(
            "hidden"
          );

      }
    );


  $("toggleAudio")
    .addEventListener(
      "click",
      () => {

        state.audio =
          !state.audio;


        $("toggleAudio")
          .textContent =
          state.audio
            ? "Activé"
            : "Désactivé";


        toast(
          state.audio
            ? "Audio activé."
            : "Audio désactivé.",
          "🔊"
        );

      }
    );


  /* =======================================================
     RESIZE
  ======================================================== */

  window.addEventListener(
    "resize",
    () => {

      resizeCanvas();

      generateBackgroundStars();

      render();

    }
  );


  /* =======================================================
     INITIALIZATION
  ======================================================== */

  function initialize() {

    resizeCanvas();

    generateBackgroundStars();

    renderMissions();

    updateClock();

    /*
      Hide loading after
      initial preparation.
    */

    setTimeout(
      () => {

        $("skyLoading")
          .classList.add(
            "hidden"
          );

      },
      800
    );


    requestAnimationFrame(
      animationLoop
    );

  }


  initialize();

})();
