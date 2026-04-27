import { QueryClient } from "@tanstack/react-query";

const HISTORY_RELATED_KEYS = [
  "LatestStationHistory",
  "LatestStationHistoryList",
  "LatestStationGroupHistory",
  "StationHistoryList",
  "StationHistoryCount",
  "StationHistoryDetail",
  "StationHistory",
  "StationGroupHistory",
  "LatestStationGroupHistoryList",
  "RailwayProgress",
  "RailwayProgressList",
  "RailwayProgressListByPref",
  "RailwayProgressListAll",
  "CompanyProgress",
  "CompanyProgressList",
  "PrefProgress",
  "PrefProgressList",
] as const;

const STATION_HISTORY_LIST_KEYS = [
  "LatestStationHistoryList",
  "StationHistoryList",
  "StationHistoryCount",
  "StationHistoryDetail",
  "LatestStationGroupHistoryList",
  "RailwayProgress",
  "RailwayProgressList",
  "RailwayProgressListByPref",
  "RailwayProgressListAll",
  "CompanyProgress",
  "CompanyProgressList",
  "PrefProgress",
  "PrefProgressList",
] as const;

export const invalidateAllHistoryQueries = (queryClient: QueryClient) => {
  for (const key of HISTORY_RELATED_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

export const invalidateStationHistoryQueries = (
  queryClient: QueryClient,
  variables: { stationCode: number; stationGroupCode: number },
) => {
  queryClient.invalidateQueries({
    queryKey: ["LatestStationHistory", variables.stationCode],
  });
  queryClient.invalidateQueries({
    queryKey: ["StationHistory", variables.stationCode],
  });
  queryClient.invalidateQueries({
    queryKey: ["LatestStationGroupHistory", variables.stationGroupCode],
  });
  queryClient.invalidateQueries({
    queryKey: ["StationGroupHistory", variables.stationGroupCode],
  });

  for (const key of STATION_HISTORY_LIST_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};
