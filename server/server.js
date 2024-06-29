const app = require("./src/router");

const PORT = process.env.PORT || 3001;


app.listen(PORT);
console.log(`Server running at ${PORT}`);
