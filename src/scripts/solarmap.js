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
// Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', function() { 
//get all the layer IDs 
let mapLayers = map.getStyle().layers;
// Filter out the layers where visibility is "none"
const visibleLayers = mapLayers.filter(layer => {
  return !(layer.layout && layer.layout.visibility === 'none' || layer.id === 'NUTS' || layer.id === 'NUTS Nomes');
});
console.log(visibleLayers);
//popup functionality
visibleLayers
  .forEach(l => {
    map.on('click', l.id, (e) => {
      const f = e.features[0];
      if (!f) return;
    //  var zoneName = e.features[0].properties.name;
      const props = f.properties;
      const layerTitle = f.layer?.id; // you can replace this with a custom title map if needed

const html = `
  <div class="popupLayerTitle"><strong>${layerTitle}</strong></div>
  ${Object.entries(props)
    .map(([k, v]) => `
      <div class="popupProperty">
        <span class="${k} popupPropertyTitle">${k}:</span>
        <span class="${v} popupPropertyValue">${v}</span>
      </div>
    `)
    .join('')}
`;

    //  const html = Object.entries(props).map(([k, v]) => `<div><span class="${k} popupPropertyTitle">${k}: </span><span class="${v} popupPropertyValue" ${v}</div>`).join('');
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
    });

    map.on('mouseenter', l.id, () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', l.id, () => map.getCanvas().style.cursor = '');
  });


     });

});