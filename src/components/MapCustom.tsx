import { CSSProperties, useCallback, useEffect, useRef } from "react";
import Map, { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { calcBounds } from "../utils/map";

export const MapCustom = ({
  center,
  zoom,
  style,
  children,
  stationList,
  interactiveLayerIds,
  onClick,
  mapRef: mapRefProp,
}: {
  center: { lat: number; lng: number };
  zoom?: number;
  style?: CSSProperties;
  children?: React.ReactNode | undefined;
  stationList?: { lat: number; lng: number }[];
  interactiveLayerIds?: string[];
  onClick?: (e: any) => void;
  mapRef?: React.RefObject<MapRef | null>;
}) => {
  const internalMapRef = useRef<MapRef | null>(null);
  const mapRef = mapRefProp || internalMapRef;

  const handleFitBounds = useCallback(() => {
    if (!mapRef.current || !stationList || stationList.length === 0) return;
    const bounds = calcBounds(stationList);

    mapRef.current.fitBounds(bounds, {
      padding: 40,
      duration: 0,
    });
  }, [stationList, mapRef]);

  // Handle fitBounds when stationList changes
  useEffect(() => {
    handleFitBounds();
  }, [handleFitBounds]);

  return (
    <Map
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom,
      }}
      style={style}
      mapStyle={import.meta.env.VITE_MAPBOX_STYLE_URL as string}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      interactiveLayerIds={interactiveLayerIds}
      onClick={onClick}
      onLoad={handleFitBounds}
      ref={mapRef}
    >
      {children}
    </Map>
  );
};

export const FitMapZoom = ({
  positions,
}: {
  positions: { lat: number; lng: number }[];
}) => {
  return null;
};
