
// const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'; // OSM-based style
const MAP_STYLE = 'https://pnorman.github.io/tilekiln-shortbread-demo/colorful.json'; // OSM-based style
const INITIAL_CENTER: [number, number] = [11.774270171952935, 58.21186814104058];
const INITIAL_ZOOM = 10;
import { useEffect, useState, useRef } from 'react';
import { Map as MapLibreMap, NavigationControl, Popup } from "maplibre-gl";
import { useSignalR } from './context/SignalRContext';
import type { Feature, Point, FeatureCollection, GeoJsonProperties } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';

const Map: React.FC = () => {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<MapLibreMap | null>(null);
  const vehicleSourceLoaded = useRef<boolean>(false);
  const { positions, roiStates, isConnected } = useSignalR();

  // Initialize map
  useEffect(() => {
    if (!mapReady) return;

    const map = new MapLibreMap({
      container: "map-container",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: MAP_STYLE
    });
    
    mapRef.current = map;

    const nav = new NavigationControl({
      visualizePitch: true
    });
    map.addControl(nav, "top-left");
    
    // Initialize vehicle GeoJSON source and layer on map load
    map.on("load", () => {
      // Add empty GeoJSON source for vehicles
      map.addSource("vehicles", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });

      // Add a symbol layer for vehicle points
      map.addLayer({
        id: "vehicle-points",
        type: "symbol",
        source: "vehicles",
        layout: {
          "icon-image": "triangle-11", // Using a built-in icon from the style
          "icon-size": 1.5,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-rotate": ["get", "heading"], // Rotate based on vehicle heading
          "icon-rotation-alignment": "map"
        },
        paint: {
          "icon-color": "#4668F2" // Blue color for vehicle icons
        }
      });

      // Add a layer for vehicle labels
      map.addLayer({
        id: "vehicle-labels",
        type: "symbol",
        source: "vehicles",
        layout: {
          "text-field": ["get", "id"],
          "text-size": 12,
          "text-offset": [0, 1.5],
          "text-anchor": "top"
        },
        paint: {
          "text-color": "#4668F2",
          "text-halo-color": "white",
          "text-halo-width": 1
        }
      });

      // Add popup on vehicle click
      map.on("click", "vehicle-points", (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const properties = feature.properties;
          
          // Safe access to coordinates through type checking
          if (feature.geometry.type === 'Point') {
            const coordinates = feature.geometry.coordinates.slice() as [number, number];
            
            new Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <h4>Vehicle: ${properties?.id || 'Unknown'}</h4>
                <p>Journey: ${properties?.journeyGid || "Unknown"}</p>
                <p>Speed: ${properties?.speed || "0"} km/h</p>
              `)
              .addTo(map);
          }
        }
      });

      // Change cursor on hover
      map.on("mouseenter", "vehicle-points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      
      map.on("mouseleave", "vehicle-points", () => {
        map.getCanvas().style.cursor = "";
      });

      vehicleSourceLoaded.current = true;
    });

    // Debug click info
    map.on("click", (e) => {
      console.log(e);
      console.log([e.lngLat.lng, e.lngLat.lat]);
    });
    
    // Cleanup function
    return () => {
      map.remove();
      mapRef.current = null;
      vehicleSourceLoaded.current = false;
    };
  }, [mapReady]);

  // Update GeoJSON source when position data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !positions.length || !vehicleSourceLoaded.current) return;

    const source = map.getSource("vehicles");
    if (!source) return;

    // Convert positions to GeoJSON features with proper typing
    const features: Array<Feature<Point, GeoJsonProperties>> = positions.map(position => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [position.pos.lng, position.pos.lat]
      },
      properties: {
        id: position.vehicleGid,
        journeyGid: position.journeyGid,
        speed: position.speed,
        heading: parseFloat(position.heading) || 0
      }
    }));

    // Update the GeoJSON source with properly typed GeoJSON
    const featureCollection: FeatureCollection<Point, GeoJsonProperties> = {
      type: "FeatureCollection",
      features: features
    };
    
    (source as any).setData(featureCollection);
  }, [positions]);

  // Add visualization for ROI states
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !roiStates.length) return;

    // Here you would visualize ROI states, such as by:
    // - Adding polygons or circles for regions of interest
    // - Coloring or styling them based on state
    // - Attaching popups with state information
    
    // This is a placeholder implementation and would need to be adapted
    // to match the actual structure of your ROI state data
    roiStates.forEach(roi => {
      console.log(`ROI ${roi.id} is in state: ${roi.state}`);
      // Visualization would be added here based on actual ROI data structure
    });
    
  }, [roiStates]);

  return (
    <>
      <div 
        className={`connection-indicator ${isConnected ? 'connection-active' : 'connection-inactive'}`}
      >
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      <div className="map-wrapper" ref={() => setMapReady(true)} id="map-container" />
    </>
  );
}
export default Map;