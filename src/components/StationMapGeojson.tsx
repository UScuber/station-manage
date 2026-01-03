import { PathData, Station } from "../api";
import { Layer, Source } from "react-map-gl/mapbox";

const RailwayGeojson = ({
  railwayPath,
}: {
  railwayPath: PathData | PathData[];
}) => {
  if (!Array.isArray(railwayPath)) {
    return (
      <Source type="geojson" data={railwayPath}>
        <Layer
          id="railway"
          type="line"
          paint={{
            "line-color": ["concat", "#", ["get", "railwayColor"]],
            "line-width": 8,
          }}
        />
      </Source>
    );
  } else {
    return (
      <Source
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: railwayPath,
        }}
      >
        <Layer
          id="railway"
          type="line"
          paint={{
            "line-color": ["concat", "#", ["get", "railwayColor"]],
            "line-width": 8,
          }}
        />
      </Source>
    );
  }
};

const StationMapGeojson = ({
  railwayPath,
  stationList,
}: {
  railwayPath: PathData | PathData[];
  stationList: Station[];
}) => {
  return (
    <>
      <RailwayGeojson railwayPath={railwayPath} />

      <Source
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: stationList.map((item) => ({
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
        }}
      >
        <Layer
          id="station"
          type="circle"
          paint={{
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 1, 15, 6],
            "circle-color": "white",
            "circle-stroke-color": "black",
            "circle-stroke-width": 2,
          }}
        />
      </Source>
    </>
  );
};

export default StationMapGeojson;
