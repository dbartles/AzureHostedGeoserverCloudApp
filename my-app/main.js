import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import TileWMS from 'ol/source/TileWMS.js';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new TileLayer({
      source: new TileWMS({
        url: 'http://13.64.141.70:9090/ows?service=WMS',
        params: {'LAYERS': 'trails:CDT', 'TILED': true},
        serverType: 'geoserver',
        // Countries have transparency, so do not fade tiles:
        transition: 0,
      }),
    }),
  ],
  view: new View({
    center: [-12000000, 4500000],
    zoom: 5,
  }),
});
