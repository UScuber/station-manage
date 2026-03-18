import { StationGroup } from "../api";
import { Layer, Source } from "react-map-gl/mapbox";

const NearStationGroupGeojson = ({
  mainGroup,
  nearGroups,
}: {
  mainGroup: StationGroup;
  nearGroups?: StationGroup[];
}) => {
  const features = [
    {
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [mainGroup.longitude, mainGroup.latitude],
      },
      properties: {
        stationGroupCode: mainGroup.stationGroupCode,
        stationName: mainGroup.stationName,
        isMain: true,
      },
    },
    ...(nearGroups || [])
      .filter((g) => g.stationGroupCode !== mainGroup.stationGroupCode)
      .map((g) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [g.longitude, g.latitude],
        },
        properties: {
          stationGroupCode: g.stationGroupCode,
          stationName: g.stationName,
          isMain: false,
        },
      })),
  ];

  return (
    <Source
      type="geojson"
      data={{
        type: "FeatureCollection",
        features,
      }}
    >
      <Layer
        id="near-stations"
        type="circle"
        paint={{
          "circle-radius": [
            "case",
            ["boolean", ["get", "isMain"], false],
            10,
            7,
          ],
          "circle-color": [
            "case",
            ["boolean", ["get", "isMain"], false],
            "#ff0000",
            "#007aff",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        }}
      />
      <Layer
        id="near-stations-label"
        type="symbol"
        layout={{
          "text-field": ["get", "stationName"],
          "text-size": [
            "case",
            ["boolean", ["get", "isMain"], false],
            14,
            12,
          ],
          "text-offset": [0, -1.5],
          "text-anchor": "bottom",
        }}
        paint={{
          "text-color": "#333333",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        }}
      />
    </Source>
  );
};

export default NearStationGroupGeojson;
