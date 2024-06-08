import ReactDomServer from "react-dom/server";
import { GeoJSON } from "react-leaflet";
import { GeoJsonObject } from "geojson";
import Leaflet from "leaflet";
import { PathData, Station } from "../api/Api";


const RailwayGeojson = (
  { railwayPath }
  :{
    railwayPath: PathData | PathData[],
  }
) => {
  if(!Array.isArray(railwayPath)){
    return (
      <GeoJSON
        data={railwayPath as unknown as GeoJsonObject}
        style={(feature) => ({
          color: "#" + feature?.properties.railwayColor,
          weight: 8,
        })}
        onEachFeature={(feature, layer) => {
          layer.bindPopup(ReactDomServer.renderToString(
            <div style={{ textAlign: "center" }}>
              <span>{feature.properties.railwayName}</span>
            </div>
          ));
        }}
      />
    );
  }else{
    return (
      <GeoJSON
        data={railwayPath as unknown as GeoJsonObject}
        style={(feature) => ({
          color: "#" + feature?.properties.railwayColor,
          weight: 8,
        })}
        onEachFeature={(feature, layer) => {
          layer.bindPopup(ReactDomServer.renderToString(
            <div style={{ textAlign: "center" }}>
              <a href={`/railway/${feature.properties.railwayCode}`}>{feature.properties.railwayName}</a>
            </div>
          ));
        }}
      />
    );
  }
};

const StationMapGeojson = (
  { railwayPath, stationList }
  :{
    railwayPath: PathData | PathData[],
    stationList: Station[],
  }
) => {
  return (
    <>
      <RailwayGeojson railwayPath={railwayPath} />

      <GeoJSON
      data={{
        type: "FeatureCollection",
        features: stationList.map(item => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [item.longitude, item.latitude],
          },
          properties: {
            stationCode: item.stationCode,
            stationName: item.stationName,
          },
        })),
      } as unknown as GeoJsonObject}
      onEachFeature={(feature, layer) => {
        layer.bindPopup(ReactDomServer.renderToString(
          <div style={{ textAlign: "center" }}>
            <a href={`/station/${feature.properties.stationCode}`}>{feature.properties.stationName}</a>
          </div>
        ));
      }}
      pointToLayer={(feature, latlng) => {
        return Leaflet.circleMarker(latlng, {
          radius: 6,
          color: "black",
          weight: 2,
          fillColor: "white",
          fillOpacity: 1,
        });
      }}
    />
    </>
  );
};

export default StationMapGeojson;
