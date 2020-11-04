const express = require("express");
const passport = require("passport");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

const postRouter = require("./routes/post");
const userRouter = require("./routes/user");
const db = require("./models");

const passportConfig = require("./passport");
const app = express();

dotenv.config();
db.sequelize
  .sync()
  .then(() => {
    console.log("Connect success");
  })
  .catch((e) => {
    console.error(e);
  });
passportConfig();

app.use(
  cors({
    origin: "*",
    // {origin: 'https://netlify.upatisariputa.com'}
    credentials: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: process.env.COOKIE_SECRET,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("node backend!");
});
// app.get("/", (req, res) => {
//   res.send("hello express");
// });

// app.get("/api/posts/", (req, res) => {
//   res.json({
//     id: 1,
//     content: "hello",
//   });
// });

app.use(postRouter);
app.use("/user", userRouter);

app.listen(3065, () => {
  console.log("server start");
});
