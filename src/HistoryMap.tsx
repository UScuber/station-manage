import { Link } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { StationHistoryDetail, useStationHistoryListAndInfo } from "./Api";
import "leaflet/dist/leaflet.css";
import { CircleMarker, FeatureGroup, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";


type PathData = {
  railwayCode: number,
  railwayName: string,
  railwayColor: string,
  companyName: string,
  path: [number, number][],
  key: string,
};

// 同じ路線の移動ごとに分割
const splitHistoryList = (historyList: StationHistoryDetail[]): PathData[] => {
  if(!historyList.length) return [];
  let result: PathData[] = [
    {
      railwayCode: historyList[0].railwayCode,
      railwayName: historyList[0].railwayName,
      railwayColor: historyList[0].railwayColor,
      companyName: historyList[0].railwayCompany,
      path: [[historyList[0].latitude, historyList[0].longitude]],
      key: `${historyList[0].date.toString()}|${historyList[0].stationCode}`,
    }
  ];
  for(let i = 1; i < historyList.length; i++){
    const cur = historyList[i];
    const prev = historyList[i-1];
    if(cur.railwayCode === prev.railwayCode && cur.date.getTime() - prev.date.getTime() < 1000*60*60*24 && cur.left.concat(cur.right).includes(prev.stationCode)){
      result[result.length-1].path.push([cur.latitude, cur.longitude]);
    }else{
      result.push({
        railwayCode: cur.railwayCode,
        railwayName: cur.railwayName,
        railwayColor: cur.railwayColor,
        companyName: cur.railwayCompany,
        path: [[cur.latitude, cur.longitude]],
        key: `${cur.date.toString()}|${cur.stationCode}`,
      });
    }
  }
  return result;
};


const HistoryMap = () => {
  const historyListQuery = useStationHistoryListAndInfo();
  const historyList = historyListQuery.data;

  if(historyListQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(historyListQuery.isLoading){
    return (
      <Container>
        Loading ...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <MapContainer center={[36.265185, 138.126471]} zoom={6} style={{ height: "90vh" }}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {splitHistoryList(historyList!).map(item => (
          <FeatureGroup pathOptions={{ color: "#" + (item.railwayColor ?? "808080") }} key={item.key}>
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/railway/" + item.railwayCode}>{item.railwayName}</Link>
              </Box>
            </Popup>
            <Polyline weight={8} positions={item.path} />
          </FeatureGroup>
        ))}
        {historyList?.map(info => (
          <CircleMarker
            center={[info.latitude, info.longitude]}
            pathOptions={{ color: "black", weight: 2, fillColor: "white", fillOpacity: 1 }}
            radius={6}
            key={`${info.stationCode}|${info.date}|${info.state}`}
          >
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/station/" + info.stationCode}>{info.stationName}</Link>
              </Box>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </Container>
  );
};

export default HistoryMap;
