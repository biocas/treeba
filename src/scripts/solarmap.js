document.addEventListener('DOMContentLoaded', () => {
mapboxgl.accessToken = 'pk.eyJ1IjoibWFyZ2FyaWRhc2FsdmFkbyIsImEiOiJja2pndWUzMm80ZmowMnFwZDVxYmt5NWZjIn0.wh2-Kf9dve6BZJGX2hEjEw';
 const map = new mapboxgl.Map({
    container: 'solar-map',
    style: 'mapbox://styles/margaridasalvado/cmhrl2ube009i01quhtjdcvm6', //hosted style id
    center: [-8.804163, 39.094384], // starting position
    zoom: 6.25
});

let popup = new mapboxgl.Popup({
        closeOnClick: true,
        closeOnMove: true,
        className: 'map-popup'
        });
    let hoveredFeatureId = null;

});