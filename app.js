const express = require("express");
const passport = require("passport");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");

const userRouter = require("./routes/user");
const postRouter = require("./routes/post");
const postsRouter = require("./routes/posts");
const hashtagRouter = require("./routes/hashtag");
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

app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:3000",
    // {origin: 'https://netlify.upatisariputa.com'}
    credentials: true,
  })
);
app.use("/", express.static(path.join(__dirname, "uploads")));
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

app.use("/post", postRouter);
app.use("/user", userRouter);
app.use("/posts", postsRouter);
app.use("/hashtag", hashtagRouter);

// 에러를 따로 핸들링 하고 싶을경우
// app.use((err, req, res, next) => {

// })

app.listen(3065, () => {
  console.log("server start");
});
