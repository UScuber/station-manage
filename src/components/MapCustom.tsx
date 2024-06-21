import { CSSProperties, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import Leaflet from "leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";


export const MapCustom = (
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


export const FitMapZoom = (
  { positions }
  :{
    positions: { lat: number, lng: number}[],
  }
) => {
  const map = useMap();
  const [first, setFirst] = useState(true);
  if(first){
    const group = Leaflet.featureGroup(positions.map(pos => Leaflet.marker(pos)));
    map.fitBounds(group.getBounds());
    setFirst(false);
  }
  return null;
};
