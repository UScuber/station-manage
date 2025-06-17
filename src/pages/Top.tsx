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
  description: JSX.Element;
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
        {links.map((item) =>
          !item.auth || isAuthenticated ? (
            <Button
              component={Link}
              to={item.url}
              color="inherit"
              sx={{
                textAlign: "center",
                display: { xs: "block", md: "inline-flex" },
              }}
              key={item.url}
            >
              <Card variant="outlined">
                <CardContent>
                  <Typography sx={{ fontSize: 18 }}>{item.text}</Typography>
                  {item.description}
                </CardContent>
              </Card>
            </Button>
          ) : null
        )}
      </Box>
    </Container>
  );
};

export default Top;
