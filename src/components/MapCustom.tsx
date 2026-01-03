import { CSSProperties } from "react";
import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

export const MapCustom = ({
  center,
  zoom,
  style,
  children,
}: {
  center: [number, number] | { lat: number; lng: number };
  zoom?: number;
  style?: CSSProperties;
  children?: React.ReactNode | undefined;
}) => {
  return (
    <Map
      initialViewState={{
        longitude: Array.isArray(center) ? center[1] : center.lng,
        latitude: Array.isArray(center) ? center[0] : center.lat,
        zoom,
      }}
      style={style}
      mapStyle={import.meta.env.VITE_MAPBOX_STYLE_URL as string}
      mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
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
