
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'; // OSM-based style
const INITIAL_CENTER: [number, number] = [11.774270171952935, 58.21186814104058];
const INITIAL_ZOOM = 10;
import { useEffect, useState } from 'react';
import { Map as MapLibreMap, NavigationControl } from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from 'styled-components';


const Wrapper = styled.div`
  height: 100%;
  width: 100%;
`;

const Map: React.FC = () => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapReady) return;

    const map = new MapLibreMap({
      container: "map-container",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: MAP_STYLE
    });

    const nav = new NavigationControl({
      visualizePitch: true
    });
    map.addControl(nav, "top-left");

    // @ts-expect-error for debugging
    window.map = map;

    map.on("click", (e) => {
      console.log(e);
      console.log([e.lngLat.lng, e.lngLat.lat]);
    });
  }, [mapReady]);

  return <Wrapper ref={() => setMapReady(true)} id="map-container" />;
}
export default Map;