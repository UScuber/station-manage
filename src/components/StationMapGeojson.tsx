import { PathData, StationWithVisit, VisitType } from "../api";
import { Layer, Source } from "react-map-gl/mapbox";
import { VISIT_TYPE_STYLE } from "../constants/visitType";

const StationMapGeojson = ({
  railwayPath,
  stationList,
  hideStations = false,
}: {
  railwayPath?: PathData | PathData[];
  stationList?: StationWithVisit[];
  hideStations?: boolean;
}) => {
  const lineFeatures = railwayPath
    ? Array.isArray(railwayPath)
      ? railwayPath
      : [railwayPath]
    : [];

  const stationFeatures = stationList?.map((item) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [item.longitude, item.latitude],
    },
    properties: {
      stationCode: item.stationCode,
      stationName: item.stationName,
      visitType: item.visitType ?? VisitType.None,
    },
  }));

  return (
    <>
      <Source
        type="geojson"
        data={{
          type: "FeatureCollection",
          features: lineFeatures,
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
            features: stationFeatures,
          }}
        >
          <Layer
            id="stations"
            type="circle"
            paint={{
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                7,
                [
                  "match",
                  ["get", "visitType"],
                  VisitType.GateExit,
                  2 * VISIT_TYPE_STYLE[VisitType.GateExit].sizeScale,
                  VisitType.Get,
                  2 * VISIT_TYPE_STYLE[VisitType.Get].sizeScale,
                  VisitType.Pass,
                  2 * VISIT_TYPE_STYLE[VisitType.Pass].sizeScale,
                  2 * VISIT_TYPE_STYLE[VisitType.None].sizeScale,
                ],
                16,
                [
                  "match",
                  ["get", "visitType"],
                  VisitType.GateExit,
                  6 * VISIT_TYPE_STYLE[VisitType.GateExit].sizeScale,
                  VisitType.Get,
                  6 * VISIT_TYPE_STYLE[VisitType.Get].sizeScale,
                  VisitType.Pass,
                  6 * VISIT_TYPE_STYLE[VisitType.Pass].sizeScale,
                  6 * VISIT_TYPE_STYLE[VisitType.None].sizeScale,
                ],
              ],
              "circle-color": [
                "match",
                ["get", "visitType"],
                VisitType.GateExit,
                VISIT_TYPE_STYLE[VisitType.GateExit].color,
                VisitType.Get,
                VISIT_TYPE_STYLE[VisitType.Get].color,
                VisitType.Pass,
                VISIT_TYPE_STYLE[VisitType.Pass].color,
                VISIT_TYPE_STYLE[VisitType.None].color,
              ],
              "circle-stroke-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                7,
                0.5,
                16,
                2,
              ],
              "circle-stroke-color": [
                "match",
                ["get", "visitType"],
                VisitType.GateExit,
                VISIT_TYPE_STYLE[VisitType.GateExit].strokeColor,
                VisitType.Get,
                VISIT_TYPE_STYLE[VisitType.Get].strokeColor,
                VisitType.Pass,
                VISIT_TYPE_STYLE[VisitType.Pass].strokeColor,
                VISIT_TYPE_STYLE[VisitType.None].strokeColor,
              ],
            }}
          />
        </Source>
      )}
    </>
  );
};

export default StationMapGeojson;
