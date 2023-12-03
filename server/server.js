const express = require("express");

const PORT = process.env.PORT || 3001;
const app = express();

app.get("/", (req, res) => {
  res.end("OK");
});

app.get("/api", (req, res) => {
  res.json({ res: "OK" });
});

app.listen(PORT);
console.log(`Server running at ${PORT}`);
