import { Box, Container, Typography } from "@mui/material";


const NotFound = () => {
  return (
    <Container>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h2">404</Typography>
        <Typography variant="h5">Page Not Found</Typography>
      </Box>
    </Container>
  );
};

export default NotFound;
