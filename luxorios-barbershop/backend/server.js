const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2");

dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({verify:(req,res,buf)=>{req.rawBody=buf.toString("utf8")}}));

// ================= DB =================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.log("DB error", err);
    process.exit(1);
  }
  console.log("MySQL connected");
});

// make DB accessible in routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ================= ROUTES =================
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/admin", require("./routes/adminUsersRoutes"));
app.use("/api/push", require("./routes/pushRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/platform", require("./routes/platformRoutes"));

// ================= JOBS (FIXED) =================
require("./jobs/reminderJob")(db);
// ================= START =================
const port=Number(process.env.PORT||5000);
app.listen(port, () => {
  console.log(`Server running on port ${port} (${process.env.APP_MODE||"demo"} mode)`);
});
