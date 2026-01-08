import { PathData, Station } from "../api";
import { Layer, Source } from "react-map-gl/mapbox";

const StationMapGeojson = ({
  railwayPath,
  stationList,
  hideStations = false,
}: {
  railwayPath?: PathData | PathData[];
  stationList?: Station[];
  hideStations?: boolean;
}) => {
  const lineFeatures = railwayPath
    ? Array.isArray(railwayPath)
      ? railwayPath
      : [railwayPath]
    : [];

  const stationFeatures = stationList?.map((item) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [item.longitude, item.latitude],
    },
    properties: {
      stationCode: item.stationCode,
      stationName: item.stationName,
    },
  }));

  return (
    <>
      <Source
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: lineFeatures as any,
        }}
      >
        <Layer
          id="lines"
          type="line"
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
          paint={{
            "line-color": ["concat", "#", ["get", "railwayColor"]],
            "line-width": 4,
          }}
        />
      </Source>

      {!hideStations && stationFeatures && (
        <Source
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: stationFeatures as any,
          }}
        >
          <Layer
            id="stations"
            type="circle"
            paint={{
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 1, 15, 6],
              "circle-color": "#ffffff",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#000000",
            }}
          />
        </Source>
      )}
    </>
  );
};

export default StationMapGeojson;
