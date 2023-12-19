import { Link } from "react-router-dom";
import { Box, Button, Card, CardContent, Container, Typography } from "@mui/material";

const links: Array<{ text: string, url: string, description: JSX.Element }> = [
  {
    text: "List",
    url: "/stationList",
    description: (
      <Typography variant="body2">Hello World</Typography>
    )
  }, {
    text: "Search",
    url: "/searchStation",
    description: (
      <Typography variant="body2">hoge hoge</Typography>
    )
  }, {
    text: "History",
    url: "/history",
    description: (
      <Typography variant="body2">huga huga</Typography>
    )
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
