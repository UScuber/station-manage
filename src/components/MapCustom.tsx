import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression } from "leaflet";
import { CSSProperties } from "react";


const MapCustom = (
  { center, zoom, style, children }
  :{
    center?: LatLngExpression | undefined,
    zoom?: number | undefined,
    style?: CSSProperties,
    children?: React.ReactNode | undefined,
  }
) => {
  return (
    <MapContainer center={center} zoom={zoom} style={style}>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
};

export default MapCustom;
