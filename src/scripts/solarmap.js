document.addEventListener('DOMContentLoaded', () => {
    // Get bounds from any GeoJSON feature 
    function featureBounds(f) {
        const b = new mapboxgl.LngLatBounds();
        const add = (lng, lat) => b.extend([lng, lat]);
        const walk = (coords) => {
            if (!coords) return;
            if (typeof coords[0] === 'number') { add(coords[0], coords[1]); return; }
            for (const c of coords) walk(c);
        };
        const g = f.geometry || {};
        if (!g.type) return null;
        walk(g.coordinates);
        return b.isEmpty() ? null : b;
    }
    /**
     * Grouped feature-name lister for one or more layers.
     * - mode: 'rendered' (visible features) or 'source' (fetch full GeoJSON)
     * - labels: map layerId -> heading label
     * - onGroups: callback({ [layerId]: string[] })
     */

    function createLayeredNameLister(map, {
        layerIds,                      // string | string[] (required)
        mode = 'rendered',             // 'rendered' | 'source'
        container = '',
        labels = {},                   // { layerId: 'Heading' }
        nameProps = [],
        sort = true,
        dedupe = true,                 // per-layer dedupe
        emptyText = 'Não foram encontrados elementos.',
        // For source mode (optional; can be inferred for GeoJSON sources):
        sourceIds = null,              // string | string[] | { [layerId]: sourceId }
        geojsonUrls = null,            // string | string[] | { [layerId]: urlOrInlineGeoJSON }
        onGroups = null,               // (groups) => void
        debounceMs = 120,
    } = {}) {
        if (!map || !layerIds) throw new Error('map and layerIds are required');
        const layers = Array.isArray(layerIds) ? layerIds : [layerIds];
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (!el) throw new Error('Container element not found');
        // accent/case-insensitive name lookup
        const norm = (s) => String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const pickName = (props) => {
            // fast path: exact keys
            for (const k of nameProps) if (props && props[k]) return String(props[k]);
            // robust path: normalize keys
            const keyMap = {};
            for (const k in props) keyMap[norm(k)] = k;
            for (const want of nameProps) {
                const k2 = keyMap[norm(want)];
                if (k2 && props[k2] != null && props[k2] !== '') return String(props[k2]);
            }
            return null;
        };

        // keeps bounds per (layer,name)
        const index = {}; // { [layerId]: { [name]: LngLatBounds } }
        let lastGroups = {};

        const render = () => {
            const layerOrder = layers.filter(lid => lastGroups[lid]?.length);
            if (!layerOrder.length) { el.innerHTML = `<em>${emptyText}</em>`; return; }

            const sections = layerOrder.map(lid => {
                const items = (sort ? lastGroups[lid].slice().sort((a, b) => a.localeCompare(b)) : lastGroups[lid])
                    .map(name => `<li data-layer="${lid}" data-name="${encodeURIComponent(name)}">${name}</li>`)
                    .join('');
                const title = `${labels[lid] || lid} <span >(${lastGroups[lid].length})</span>`;
                return `
          <h4>${title}</h4>
          <ul style="cursor:pointer;">${items}</ul>`;
            }).join('');

            el.innerHTML = sections;
        };

        // event delegation: click a name → zoom
        el.addEventListener('click', (ev) => {
            const li = ev.target.closest('li[data-layer][data-name]');
            if (!li) return;
            const lid = li.getAttribute('data-layer');
            const name = decodeURIComponent(li.getAttribute('data-name'));
            const b = index[lid]?.[name];
            if (b && !b.isEmpty()) {
                map.fitBounds(b, { padding: 80, maxZoom: 10, duration: 1000 });
            }
        });

        // normalize per-layer inputs (optional)
        const toMap = (val) => {
            if (!val) return {};
            if (typeof val === 'string' || Array.isArray(val)) {
                const arr = Array.isArray(val) ? val : [val];
                const out = {};
                layers.forEach((lid, i) => out[lid] = arr[i] ?? arr[arr.length - 1]);
                return out;
            }
            return val;
        };
        const srcMap = toMap(sourceIds);
        const urlMap = toMap(geojsonUrls);

        const buildFromRendered = () => {
            const groups = {};
            for (const lid of layers) {
                const feats = map.queryRenderedFeatures({ layers: [lid] });
                const names = [];
                index[lid] = {};
                for (const f of feats) {
                    const nm = pickName(f.properties || {});
                    if (!nm) continue;
                    // accumulate bounds for same name
                    const fb = featureBounds(f);
                    if (fb) {
                        if (!index[lid][nm]) index[lid][nm] = fb;
                        else index[lid][nm].extend(fb.getSouthWest()).extend(fb.getNorthEast());
                    }
                    names.push(nm);
                }
                groups[lid] = dedupe ? [...new Set(names)] : names;
            }
            return groups;
        };

        const buildFromSource = async () => {
            const style = map.getStyle();
            const groups = {};
            for (const lid of layers) {
                // infer source
                let sid = srcMap[lid];
                if (!sid) {
                    const lyr = style.layers.find(l => l.id === lid);
                    sid = lyr && lyr.source;
                }
                const def = sid ? style.sources[sid] : null;
                let dataRef = urlMap[lid] ?? (def && def.data);
                let gj = null;
                try {
                    if (typeof dataRef === 'string') { const res = await fetch(dataRef); gj = await res.json(); }
                    else if (typeof dataRef === 'object') { gj = dataRef; }
                } catch (e) { /* ignore; fall back */ }

                index[lid] = {};
                const feats = Array.isArray(gj?.features) ? gj.features : map.queryRenderedFeatures({ layers: [lid] });
                const names = [];
                for (const f of feats) {
                    const nm = pickName(f.properties || {});
                    if (!nm) continue;
                    const fb = featureBounds(f);
                    if (fb) {
                        if (!index[lid][nm]) index[lid][nm] = fb;
                        else index[lid][nm].extend(fb.getSouthWest()).extend(fb.getNorthEast());
                    }
                    names.push(nm);
                }
                groups[lid] = dedupe ? [...new Set(names)] : names;
            }
            return groups;
        };

        let t = null, destroyed = false;
        const schedule = () => {
            if (destroyed) return;
            clearTimeout(t);
            t = setTimeout(async () => {
                lastGroups = (mode === 'source') ? await buildFromSource() : buildFromRendered();
                render();
            }, debounceMs);
        };

        const onLoad = () => schedule();
        const onIdle = () => schedule();
        const onMoveEnd = () => schedule();
        const onZoomEnd = () => schedule();
        const onStyleData = () => schedule();

        map.on('load', onLoad);
        map.on('idle', onIdle);
        map.on('moveend', onMoveEnd);
        map.on('zoomend', onZoomEnd);
        map.on('styledataloading', onStyleData);
        if (map.loaded()) schedule();

        return {
            update: () => schedule(),
            getGroups: () => JSON.parse(JSON.stringify(lastGroups)),
            zoomTo: (layerId, name, opts = { padding: 60, maxZoom: 14, duration: 600 }) => {
                const b = index[layerId]?.[name];
                if (b && !b.isEmpty()) map.fitBounds(b, opts);
            },
            destroy: () => {
                destroyed = true;
                clearTimeout(t);
                map.off('load', onLoad);
                map.off('idle', onIdle);
                map.off('moveend', onMoveEnd);
                map.off('zoomend', onZoomEnd);
                map.off('styledataloading', onStyleData);
                el.replaceChildren(); // optional: clear UI
            }
        };
    }

    // Key button functionality 
    const btn = document.getElementById('legenda-btn') || document.querySelector('.legenda-toggle');
    const pop = document.getElementById('legenda-popover');
    const closeB = document.getElementById('legenda-close');

    function openPopover() {
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
        if (top + ph > window.innerHeight - 8) {
            top = Math.max(8, b.top - ph - gap);
            arrowClass = 'arrow-bottom';
        }

        pop.classList.remove('arrow-top', 'arrow-bottom');
        pop.classList.add(arrowClass);
        pop.style.left = `${left}px`;
        pop.style.top = `${top}px`;
        pop.style.visibility = '';
    }

    function closePopover() { pop.hidden = true; }

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
    ['resize', 'scroll'].forEach(ev => window.addEventListener(ev, () => {
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
    //map
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFyZ2FyaWRhc2FsdmFkbyIsImEiOiJja2pndWUzMm80ZmowMnFwZDVxYmt5NWZjIn0.wh2-Kf9dve6BZJGX2hEjEw';
    // match media and device mapbox coordinates for centre
    const mobileCenter = window.matchMedia ('(max-width: 767px)');
    const mapMobileCenter = [-8.173136, 39.712646];
    const mapDesktopCenter = [-8.804163, 39.094384];
    const defaultZoom = 6.25;
    const mobileMapZoom = 5.50;
    let mapCenter;
    let mapZoom;
    //change zoom and map centre on viewport
    if (mobileCenter) {
        mapCenter = mapMobileCenter;
        mapZoom = mobileMapZoom;
    } else {
        mapCenter = mapDesktopCenter;
        mapZoom = defaultZoom;
    }
    const map = new mapboxgl.Map({
        container: 'solar-map',
        style: 'mapbox://styles/margaridasalvado/cmhrl2ube009i01quhtjdcvm6', //hosted style id
        center: mapCenter,
        zoom: mapZoom
    });

    let popup = new mapboxgl.Popup({
        closeOnClick: true,
        closeOnMove: true,
        className: 'map-popup'
    });
    let hoveredFeatureId = null;
    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', function () {
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
                    "Data_Licença_Exploração": "Data da Licença de Exploração",
                    classifica: "Classificação",
                    Description: "Descrição",
                    NUTS_NAME: "Região NUTS",
                    LEVL_CODE: "Nível",
                };
                //filter functionality
        const filterGroup = document.getElementById('filter-group');

        // Add checkbox and label elements for the layer.
        const filterInput = document.createElement('input');
        filterInput.type = 'checkbox';
        filterInput.id = l.id;
        filterInput.checked = true;
        filterGroup.appendChild(filterInput);


        const filterLabel = document.createElement('label');
        filterLabel.setAttribute('for', l.id);
        filterLabel.textContent = l.id;
        filterGroup.appendChild(filterLabel);

        const wrapper = document.createElement('div');
wrapper.className = 'filter-row';
wrapper.appendChild(filterInput);
wrapper.appendChild(filterLabel);
filterGroup.appendChild(wrapper);

        // When the checkbox changes, update the visibility of the layer.
        filterInput.addEventListener('change', (e) => {
            map.setLayoutProperty(
                l.id,
                'visibility',
                e.target.checked ? 'visible' : 'none'
            );
        });
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
        

        //list all centrals 
        const lister = createLayeredNameLister(map, {
            layerIds: [
                'Centrais Solares propostas',
                'Centrais Solares Existentes e em licenciamento'
            ],
            mode: 'rendered',
            container: '#listaCentrais .contentContainer',
            labels: {
                'Centrais Solares Existentes e em licenciamento': 'Centrais Solares Existentes ou em processo de licenciamento',
                'Centrais Solares propostas': 'Centrais Solares Propostas'
            },
            nameProps: ['Nome', 'Denominação']
        });

        // Optional: access the grouped data programmatically later
        // const groups = lister.getGroups();



    });

});