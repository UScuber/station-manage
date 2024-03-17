import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography
} from "@mui/material";

const links: Array<{ text: string, url: string, description: JSX.Element }> = [
  {
    text: "List",
    url: "/stationList",
    description: (
      <Typography variant="caption">駅一覧・検索</Typography>
    ),
  }, {
    text: "Search",
    url: "/searchStation",
    description: (
      <Typography variant="caption">最寄り駅検索</Typography>
    ),
  }, {
    text: "History",
    url: "/history",
    description: (
      <Typography variant="caption">乗降の履歴</Typography>
    ),
  }, {
    text: "Company",
    url: "/company",
    description: (
      <Typography variant="caption">会社情報</Typography>
    ),
  }, {
    text: "Prefecture",
    url: "/pref",
    description: (
      <Typography variant="caption">都道府県の情報</Typography>
    ),
  }
];

const Top = () => {
  return (
    <Container>
      <Box>
        {links.map((item) => (
          <Button
            component={Link}
            to={item.url}
            color="inherit"
            sx={{
              textTransform: "none",
              textAlign: "center",
              display: { xs: "block", sm: "inline-flex" }
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
        ))}
      </Box>
    </Container>
  );
};

export default Top;
