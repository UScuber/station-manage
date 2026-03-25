// station

export enum RecordState {
  Get,
  Pass,
}

// 訪問種別 enum（値は優先度順）
export enum VisitType {
  None = 0,      // 履歴なし
  Pass = 1,      // 通過
  Get = 2,       // 乗降り
  GateExit = 3,  // 降りて改札下車
}

// 訪問状態（履歴の集約結果、駅単位）
export type VisitInfo = {
  visitType: VisitType;
};

export type Station = {
  stationCode: number;
  stationName: string;
  companyCode: number;
  railwayCode: number;
  stationGroupCode: number;
  railwayName: string;
  railwayCompany: string;
  latitude: number;
  longitude: number;
  prefCode: number;
  prefName: string;
  kana: string;
  railwayColor: string;
  left: number[];
  right: number[];
  timetableURL: string | undefined;
  trainPosURL: string | undefined;
};

export type StationGroup = {
  stationGroupCode: number;
  stationName: string;
  latitude: number;
  longitude: number;
  prefCode: number;
  prefName: string;
  kana: string;
  distance?: number;
};

export type Railway = {
  railwayCode: number;
  railwayName: string;
  companyCode: number;
  companyName: string;
  railwayKana: string;
  formalName: string;
  railwayColor: string;
};

export type Company = {
  companyCode: number;
  companyName: string;
  formalName: string;
};

export type Coordinate = {
  lat: number;
  lng: number;
};

export type PathData = {
  type: "Feature";
  geometry: {
    type: "MultiLineString";
    coordinates: [number, number][][];
  };
  properties: Railway;
};

// user

export type User = {
  userName: string;
  userEmail: string;
  password?: string;
};

export type Auth = {
  auth: boolean;
  userName: string | undefined;
  userEmail: string | undefined;
  isAdmin: boolean;
};

// history

export type StationDate = {
  getDate: Date | undefined;
  passDate: Date | undefined;
};

export type StationGroupDate = {
  date: Date | undefined;
};

export type StationHistory = {
  stationCode: number;
  stationGroupCode: number;
  date: Date;
  state: number;
};

// 駅情報 + 訪問状態
export type StationWithVisit = Station & VisitInfo;

export type StationHistoryDetail = Station & StationHistory & VisitInfo;

export type StationHistoryData = {
  stationGroupCode: number;
  stationCode: number | undefined;
  date: Date;
  state: number;
  railwayName?: string;
  railwayColor?: string;
};

export type StationProgress = {
  stationNum: number;
  getOrPassStationNum: number;
};

export type StationGroupHistory = {
  stationGroupCode: number;
  date: Date;
};

// ファイル入出力用のJSONの型
export type ExportHistoryJSON = {
  station_history: {
    history: {
      date: Date;
      state: number;
    }[];
    info: {
      railwayCode: number;
      latitude: number;
      longitude: number;
      stationName: string;
      railwayName: string;
      companyName: string;
    }[];
  }[];
  station_group_history: {
    history: {
      date: Date;
    }[];
    info: {
      stationName: string;
      latitude: number;
      longitude: number;
    }[];
  }[];
};

export type TimetableLinks = {
  timetable: {
    direction: string;
    url: string;
  }[];
  trainPos: string;
};

// 駅のURL出力用のJSONの型
export type ExportStationURLJSON = {
  data: {
    stationCode: number;
    timetableURL: string | undefined;
    trainPosURL: string | undefined;
  }[];
};
