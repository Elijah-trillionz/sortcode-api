const express = require("express");
const cors = require("cors");
const connectDB = require("./config/mongodb");
require("dotenv").config();
const fs = require("fs");

const createServiceAccountJSONFile = () => {
  const fileExists = fs.existsSync("./config/sortcode.json");
  if (!fileExists) {
    fs.writeFileSync(
      "./config/sortcode.json",
      atob(process.env.SERVICE_ACCOUNT)
    );
  }
};
createServiceAccountJSONFile();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// routes
app.use("/api", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/task-solutions", require("./routes/taskSolutions"));
app.use("/api/upvote", require("./routes/upvote"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/questions", require("./routes/questions"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`server running in ${process.env.NODE_ENV} on port: ${PORT}`)
);
