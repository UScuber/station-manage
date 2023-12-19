import { Link } from "react-router-dom";
import { Box, Button, Card, CardContent, Container, Typography } from "@mui/material";

const links: Array<{ text: string, url: string, description: JSX.Element }> = [
  {
    text: "List",
    url: "/stationList",
    description: <p>Hello World</p>
  }, {
    text: "Search",
    url: "/searchStation",
    description: <p>hoge hoge</p>
  }, {
    text: "History",
    url: "/history",
    description: <p>huga huga</p>
  },
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
                <Typography variant="body2">{item.description}</Typography>
              </CardContent>
            </Card>
          </Button>
        ))}
      </Box>
    </Container>
  );
};

export default Top;
