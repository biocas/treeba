document.addEventListener('DOMContentLoaded', () => {
mapboxgl.accessToken = 'pk.eyJ1IjoibWFyZ2FyaWRhc2FsdmFkbyIsImEiOiJja2pndWUzMm80ZmowMnFwZDVxYmt5NWZjIn0.wh2-Kf9dve6BZJGX2hEjEw';
 const map = new mapboxgl.Map({
    container: 'treeba-map',
    style: 'mapbox://styles/margaridasalvado/cmhnwbnfb00cy01sh25fp9wvw', //hosted style id
    center: [-2.652385, 40.075565], // starting position
    zoom: 3.8
});
});