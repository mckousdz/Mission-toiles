/* =========================================================
   CIEL LIVE V4
   REAL SATELLITE TRACKING
========================================================= */

(() => {

  "use strict";


  /* =======================================================
     STATE
  ======================================================== */

  const state = {

    satellites: [],

    loaded: false,

    loading: false,

    lastUpdate: 0,

    updateInterval:
      60 * 1000,

    selected: null

  };


  /* =======================================================
     CONSTANTS
  ======================================================== */

  const DEG =
    180 / Math.PI;

  const RAD =
    Math.PI / 180;


  /*
    CelesTrak current GP JSON.

    Stations contains ISS and
    other crewed spacecraft.

    We additionally load Starlink
    separately when requested.
  */

  const STATIONS_URL =
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json";


  const STARLINK_URL =
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json";


  /* =======================================================
     HELPERS
  ======================================================== */

  function normalize360(
    value
  ) {

    return (
      (value % 360) +
      360
    ) % 360;

  }


  function formatName(
    name
  ) {

    return String(name || "")
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  }


  function isSatelliteLibraryReady() {

    return (
      typeof satellite !==
      "undefined"
    );

  }


  function getLocation() {

  if (
    window.CielSkyState &&
    typeof window.CielSkyState.getLocation ===
      "function"
  ) {

    return window.CielSkyState.getLocation();

  }

  return {

    latitude: 43.7102,

    longitude: 7.2620

  };

}

    /*
      Read application state
      from the main app when available.
    */

    if (
      window.state &&
      window.state.location
    ) {

      return window.state.location;

    }


    /*
      Fallback:
      read from DOM impossible,
      so use approximate Nice location.
    */

    return {

      latitude:
        43.7102,

      longitude:
        7.2620

    };

  }


  /* =======================================================
     FETCH
  ======================================================== */

  async function fetchGroup(
    url
  ) {

    const response =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        `CelesTrak HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !Array.isArray(data)
    ) {

      throw new Error(
        "Format CelesTrak inattendu."
      );

    }


    return data;

  }


  /* =======================================================
     NORMALIZE GP JSON
  ======================================================== */

  function normalizeSatellite(
    item
  ) {

    /*
      CelesTrak JSON OMM generally
      provides OBJECT_NAME,
      NORAD_CAT_ID,
      TLE_LINE1,
      TLE_LINE2.

      We accept common aliases
      for robustness.
    */

    const name =
      formatName(
        item.OBJECT_NAME ||
        item.OBJECT_ID ||
        item.NAME
      );


    const tle1 =
      item.TLE_LINE1 ||
      item.TLE1 ||
      item.LINE1;

    const tle2 =
      item.TLE_LINE2 ||
      item.TLE2 ||
      item.LINE2;


    if (
      !name ||
      !tle1 ||
      !tle2
    ) {

      return null;

    }


    return {

      name,

      norad:
        item.NORAD_CAT_ID ||
        item.CATALOG_NUMBER ||
        null,

      tle1,

      tle2

    };

  }


  /* =======================================================
     LOAD
  ======================================================== */

  async function loadSatellites(
    includeStarlink = false
  ) {

    if (
      state.loading
    ) {
      return;
    }


    if (
      !isSatelliteLibraryReady()
    ) {

      setStatus(
        "Le moteur satellite n'est pas chargé.",
        true
      );

      return;

    }


    state.loading =
      true;


    setStatus(
      "Chargement des données orbitales…"
    );


    try {

      const stationData =
        await fetchGroup(
          STATIONS_URL
        );


      let normalized =
        stationData
          .map(
            normalizeSatellite
          )
          .filter(Boolean);


      /*
        Ensure ISS is present.

        NORAD 25544.
      */

      const iss =
        normalized.find(
          sat =>
            String(sat.norad) ===
            "25544" ||
            /ISS/i.test(
              sat.name
            )
        );


      /*
        Limit initial list
        to keep mobile rendering
        fast.
      */

      normalized =
        normalized
          .filter(
            sat =>
              /ISS|ZARYA|TIANGONG|CSS/i.test(
                sat.name
              ) ||
              String(sat.norad) ===
                "25544"
          );


      if (
        includeStarlink
      ) {

        try {

          const starlinkData =
            await fetchGroup(
              STARLINK_URL
            );


          const starlinks =
            starlinkData
              .map(
                normalizeSatellite
              )
              .filter(Boolean)
              .slice(0, 150);


          normalized.push(
            ...starlinks
          );

        } catch (error) {

          console.warn(
            "Starlink load failed:",
            error
          );

        }

      }


      /*
        Deduplicate.
      */

      const unique =
        new Map();


      normalized.forEach(
        sat => {

          const key =
            sat.norad ||
            sat.name;

          if (
            !unique.has(key)
          ) {

            unique.set(
              key,
              sat
            );

          }

        }
      );


      state.satellites =
        Array.from(
          unique.values()
        );


      state.loaded =
        true;

      state.lastUpdate =
        Date.now();


      setStatus(
        `${state.satellites.length} satellites chargés.`
      );


      updateSatellitePanel();


    } catch (error) {

      console.error(
        "Satellite error:",
        error
      );


      setStatus(
        "Impossible de récupérer les données CelesTrak.",
        true
      );


    } finally {

      state.loading =
        false;

    }

  }


  /* =======================================================
     SATELLITE POSITION
  ======================================================== */

  function calculateSatellite(
    sat,
    date
  ) {

    if (
      !isSatelliteLibraryReady()
    ) {

      return null;

    }


    const location =
      getLocation();


    if (
      !location ||
      typeof location.latitude !==
        "number" ||
      typeof location.longitude !==
        "number"
    ) {

      return null;

    }


    try {

      const satrec =
        satellite.twoline2satrec(
          sat.tle1,
          sat.tle2
        );


      const pv =
        satellite.propagate(
          satrec,
          date
        );


      if (
        !pv ||
        !pv.position
      ) {

        return null;

      }


      if (
        satrec.error
      ) {

        return null;

      }


      const gmst =
        satellite.gstime(
          date
        );


      /*
        ECI → ECF
      */

      const positionEcf =
        satellite.eciToEcf(
          pv.position,
          gmst
        );


      /*
        Observer geodetic
      */

      const observerGd = {

        longitude:
          location.longitude *
          RAD,

        latitude:
          location.latitude *
          RAD,

        height:
          0

      };


      /*
        Look angles.
      */

      const look =
        satellite.ecfToLookAngles(
          observerGd,
          positionEcf
        );


      const azimuth =
        normalize360(
          look.azimuth *
          DEG
        );


      const elevation =
        look.elevation *
        DEG;


      const range =
        look.rangeSat;


      return {

        ...sat,

        azimuth,

        altitude:
          elevation,

        range,

        visible:
          elevation > 0

      };


    } catch (error) {

      console.warn(
        "Satellite propagation error:",
        sat.name,
        error
      );

      return null;

    }

  }


  /* =======================================================
     VISIBLE SATELLITES
  ======================================================== */

  function getVisibleSatellites() {

    const now =
      new Date();


    return state.satellites

      .map(
        sat =>
          calculateSatellite(
            sat,
            now
          )
      )

      .filter(Boolean)

      .filter(
        sat =>
          sat.altitude >
          0
      )

      .sort(
        (a, b) =>
          b.altitude -
          a.altitude
      );

  }


  /* =======================================================
     DRAW
  ======================================================== */

  function draw(
    ctx,
    projection
  ) {

    if (
      !state.loaded
    ) {
      return;
    }


    const visible =
      getVisibleSatellites();


    visible.forEach(
      sat => {

        const p =
          projection(
            sat.azimuth,
            sat.altitude
          );


        if (
          !p.visible
        ) {
          return;
        }


        /*
          Glow
        */

        ctx.shadowBlur =
          18;

        ctx.shadowColor =
          "#a78bfa";


        ctx.beginPath();

        ctx.arc(
          p.x,
          p.y,
          5,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "#c4b5fd";

        ctx.fill();


        ctx.shadowBlur =
          0;


        /*
          Label
        */

        ctx.font =
          "800 8px -apple-system, sans-serif";

        ctx.textAlign =
          "center";

        ctx.fillStyle =
          "#ddd6fe";

        const shortName =
          sat.name.length >
          16
            ? sat.name.slice(
                0,
                16
              ) + "…"
            : sat.name;


        ctx.fillText(
          shortName,
          p.x,
          p.y + 15
        );

      }
    );

  }


  /* =======================================================
     PANEL
  ======================================================== */

  function setStatus(
    message,
    error = false
  ) {

    const element =
      document.getElementById(
        "satelliteStatus"
      );


    if (!element) {
      return;
    }


    element.textContent =
      message;


    element.style.color =
      error
        ? "#fb7185"
        : "";

  }


  function updateSatellitePanel() {

    const list =
      document.getElementById(
        "satelliteList"
      );


    if (!list) {
      return;
    }


    const visible =
      getVisibleSatellites();


    if (
      visible.length ===
      0
    ) {

      list.innerHTML = `

        <div class="panel-status">
          Aucun satellite au-dessus de l'horizon
          actuellement dans les données chargées.
        </div>

      `;

      return;

    }


    list.innerHTML =
      visible
        .slice(0, 12)
        .map(
          sat => `

            <button
              class="satellite-card"
              data-satellite="${encodeURIComponent(
                sat.name
              )}"
            >

              <div class="satellite-icon">
                🛰️
              </div>

              <div class="satellite-info">

                <strong>
                  ${escapeHtml(
                    sat.name
                  )}
                </strong>

                <small>
                  Azimut ${Math.round(
                    sat.azimuth
                  )}°
                  ·
                  ${Math.round(
                    sat.range
                  )} km
                </small>

              </div>

              <div class="satellite-altitude">

                <strong>
                  ${Math.round(
                    sat.altitude
                  )}°
                </strong>

                <small>
                  HAUTEUR
                </small>

              </div>

            </button>

          `
        )
        .join("");


    list
      .querySelectorAll(
        "[data-satellite]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const name =
                decodeURIComponent(
                  button.dataset.satellite
                );


              const sat =
                visible.find(
                  s =>
                    s.name ===
                    name
                );


              if (!sat) {
                return;
              }


              state.selected =
                sat;


              showSatelliteToast(
                sat
              );

            }
          );

        }
      );

  }


  /* =======================================================
     SATELLITE TOAST
  ======================================================== */

  function showSatelliteToast(
    sat
  ) {

    const toast =
      document.getElementById(
        "toast"
      );


    if (!toast) {
      return;
    }


    const icon =
      document.getElementById(
        "toastIcon"
      );

    const message =
      document.getElementById(
        "toastMessage"
      );


    icon.textContent =
      "🛰️";


    message.textContent =
      `${sat.name} · ${Math.round(sat.altitude)}° · azimut ${Math.round(sat.azimuth)}°`;


    toast.classList.add(
      "visible"
    );


    setTimeout(
      () => {

        toast.classList.remove(
          "visible"
        );

      },
      4500
    );

  }


  /* =======================================================
     ESCAPE HTML
  ======================================================== */

  function escapeHtml(
    value
  ) {

    return String(value)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* =======================================================
     PUBLIC API
  ======================================================== */

  window.CielSatellites = {

    init() {

      loadSatellites(
        false
      );

    },


    async openPanel() {

      /*
        Refresh every minute.
      */

      if (
        !state.loaded ||
        Date.now() -
          state.lastUpdate >
          state.updateInterval
      ) {

        await loadSatellites(
          true
        );

      }


      updateSatellitePanel();

    },


    draw,

    getVisible() {

      return getVisibleSatellites();

    }

  };


})();
