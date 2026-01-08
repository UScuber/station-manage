import React from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth";

const links: Array<{
  text: string;
  url: string;
  description: React.ReactElement;
  auth: boolean;
}> = [
  {
    text: "List",
    url: "/stationList",
    description: <Typography variant="caption">駅一覧・検索</Typography>,
    auth: false,
  },
  {
    text: "Search",
    url: "/searchStation",
    description: <Typography variant="caption">最寄り駅検索</Typography>,
    auth: false,
  },
  {
    text: "History",
    url: "/history",
    description: <Typography variant="caption">乗降の履歴</Typography>,
    auth: true,
  },
  {
    text: "Map",
    url: "/historyMap",
    description: <Typography variant="caption">乗車マップ</Typography>,
    auth: true,
  },
  {
    text: "Railway",
    url: "/railway",
    description: <Typography variant="caption">路線一覧</Typography>,
    auth: false,
  },
  {
    text: "Company",
    url: "/company",
    description: <Typography variant="caption">会社一覧</Typography>,
    auth: false,
  },
  {
    text: "Prefecture",
    url: "/pref",
    description: <Typography variant="caption">都道府県一覧</Typography>,
    auth: false,
  },
];

const Top = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Container>
      <Box>
        {links.map((item) => (
          <Button
            component={Link}
            to={item.url}
            sx={{
              textAlign: "center",
              display: { xs: "block", md: "inline-flex" },
            }}
            disabled={item.auth && !isAuthenticated}
            key={item.url}
          >
            <Card
              variant="outlined"
              sx={{
                opacity: item.auth && !isAuthenticated ? 0.5 : 1,
              }}
            >
              <CardContent>
                <Typography sx={{ fontSize: 18 }}>{item.text}</Typography>
                {item.description}
              </CardContent>
            </Card>
          </Button>
        ))}
      </Box>

      <Box sx={{ mt: 4, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Station Manageについて
        </Typography>
        <Typography variant="body2">
          Station
          Manageは、日本の鉄道駅の訪問記録(乗りつぶし)を管理・可視化するためのウェブアプリケーションです
          <br />
          訪れた駅や通過した駅を記録し、路線や都道府県ごとの制覇率を進捗として確認したり、地図上で履歴を振り返ることができます
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          主な機能
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>
              <b>List / Search:</b>{" "}
              全国の駅を検索し、訪問状況を確認・記録できます
            </li>
            <li>
              <b>History / Map:</b>{" "}
              これまでの訪問履歴をリストや地図上で確認できます(ログイン必須です)
            </li>
            <li>
              <b>Railway / Company / Prefecture:</b>{" "}
              路線、鉄道会社、都道府県ごとの駅一覧と制覇率を確認できます
            </li>
          </ul>
        </Typography>

        {!isAuthenticated ? (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              訪問履歴の保存にはログインが必要です
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/login"
              >
                ログイン
              </Button>
              <Button variant="outlined" size="large" component={Link} to="/signup">
                アカウント作成
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2">
              現在ログイン中です。上部のリンクから機能をご利用ください
            </Typography>
            <Button variant="outlined" component={Link} to="/profile">
              プロフィールを確認
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Top;
