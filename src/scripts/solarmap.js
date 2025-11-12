document.addEventListener('DOMContentLoaded', () => {
    // Key button functionality 
const btn    = document.getElementById('legenda-btn') || document.querySelector('.legenda-toggle');
const pop    = document.getElementById('legenda-popover');
const closeB = document.getElementById('legenda-close');

function openPopover(){
  pop.hidden = false;

  // Temporarily show to measure
  pop.style.visibility = 'hidden';
  pop.style.top = '0px';
  pop.style.left = '0px';

  const b = btn.getBoundingClientRect();
  const pw = pop.offsetWidth;
  const ph = pop.offsetHeight;
  const gap = 8;

  // Default: place below the button
  let top = b.bottom + gap;
  let left = Math.min(Math.max(b.left, 8), window.innerWidth - pw - 8);
  let arrowClass = 'arrow-top';

  // Flip above if not enough space below
  if (top + ph > window.innerHeight - 8){
    top = Math.max(8, b.top - ph - gap);
    arrowClass = 'arrow-bottom';
  }

  pop.classList.remove('arrow-top','arrow-bottom');
  pop.classList.add(arrowClass);
  pop.style.left = `${left}px`;
  pop.style.top  = `${top}px`;
  pop.style.visibility = '';
}

function closePopover(){ pop.hidden = true; }

btn.addEventListener('click', (e) => {
  if (pop.hidden) openPopover(); else closePopover();
});
closeB.addEventListener('click', closePopover);

// Click outside closes (but page remains interactive)
document.addEventListener('click', (e) => {
  if (!pop.hidden && !pop.contains(e.target) && e.target !== btn) closePopover();
});

// Esc to close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !pop.hidden) closePopover();
});

// Reposition on resize/scroll (keeps it under the button)
['resize','scroll'].forEach(ev => window.addEventListener(ev, () => {
  if (!pop.hidden) openPopover();
}));

    // Dropdown Cards 
const cards = document.querySelectorAll('.infoCard');
  document.querySelectorAll('.infoCard .infoHeadWrapper').forEach((header) => {
    header.addEventListener('click', () => {
      const card = header.closest('.infoCard');
      cards.forEach(c => c !== card && c.classList.remove('active'));
      card.classList.toggle('active');
    });
  });
//filter functionality
const filterGroup = document.getElementById('filter-group');
  //map
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