document.addEventListener('DOMContentLoaded', () => {
    // Dropdown Cards 
     const imageSpaces = document.querySelectorAll(".image-space");

  imageSpaces.forEach(function (imageSpace) {
    imageSpace.addEventListener("click", function () {
      const card = imageSpace.parentElement;

      if (card.classList.contains("expanded")) {
        card.classList.remove("expanded");
      } else {
        document.querySelectorAll(".new-card").forEach(function (c) {
          c.classList.remove("expanded");
        });
        card.classList.add("expanded");
      }
    });
  });
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
//create safe css classes from map property names
function safeClassName(key) {
  return 'prop-' + key.toString()
    .trim()
    .toLowerCase()
    // turn "Jurisdição" -> "jurisdicao"
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // replace spaces/illegal chars with a single dash
    .replace(/[^a-z0-9_-]+/g, '-')
    // collapse multiple dashes
    .replace(/-+/g, '-')
    // avoid leading/trailing dashes
    .replace(/^-|-$/g, '');
}
map.addSource('Centrais Solares propostas', {
                    'type': 'geojson',
                    'data': {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "propostasid": "CSPropostas1",
        "propostasclass": "pinProposed",
        "Nome": "Central Solar Fotovoltaica (CSF) de Sophia e as Linhas de Muito Alta Tensão (LMAT) associadas",
        "Consulta Pública": "2025-10-10 a 2025-11-20",
        "Tipologia": "Licenciamento Único de Ambiente",
        "Entidade promotora do projeto": "Coloursflow – Unipessoal, LDA"
      },
      "geometry": {
        "coordinates": [
          -7.25548757386062,
          40.0750654533158
        ],
        "type": "Point"
      },
      "id": 0
    }
  ]
}

});
map.addLayer({
                    'id': 'Centrais Solares propostas',
                    'type': 'circle',
                    'source': 'Centrais Solares propostas',
                    'paint': {
            'circle-radius': 10,
            'circle-color': '#FE0606',
                    }
                });
//get all the layer IDs 
let mapLayers = map.getStyle().layers;
// Filter out the layers where visibility is "none"
const visibleLayers = mapLayers.filter(layer => {
  return !(layer.layout && layer.layout.visibility === 'none' || layer.id === 'place-label' || layer.id === 'NUTS' || layer.id === 'NUTS Nomes');
});
//popup functionality
visibleLayers
  .forEach(l => {
    // Create a map of property key → display label
const propertyLabels = {
  nome: "Nome",
  nome_ap: "Nome",
  Name: "Nome",
  site_name: "Nome",
  Denominação: "Nome",
  Designacao: "Nome",
  area_ha: "Área (ha)",
  area__ha_: "Área (ha)",
  tipo: "Tipo", 
  "Sub-tipo_Instalação": "Tipo", 
  "Potência__KW_": "Potência (Kw)",
  "Data_Licença_Produção": "Data da Licença de Produção",
  classifica: "Classificação",
  Description: "Descrição",
  NUTS_NAME: "Região NUTS",
  LEVL_CODE: "Nível",
};

    map.on('click', l.id, (e) => {
      const f = e.features[0];
      if (!f) return;
      const props = f.properties;
      console.log(props);
      const layerTitle = f.layer?.id; // you can replace this with a custom title map if needed

const html = `
  <div class="popupLayerTitle"><strong>${layerTitle}</strong></div>
  ${Object.entries(props)
    .map(([k, v]) => {
        //if K is date, transform to cool date
      const label = propertyLabels[k] || k; //uses sanitising property labels
      const safeKey = safeClassName(k); //safe css classes
      return `
        <div class="popupProperty ${safeKey}">
          <span class="popupPropertyTitle">${label}:</span>
          <span class="popupPropertyValue">${v}</span>
        </div>
      `;
    })
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