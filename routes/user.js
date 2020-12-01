const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const { Op } = require("sequelize");

const { User, Post, Comment, Image } = require("../models");

const { isLoggedIn, isNotLoggedIn } = require("./middlewares");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    if (req.user) {
      const fullUserWithoutPassword = await User.findOne({
        where: { id: req.user.id },
        attributes: {
          exclude: ["password"],
        },
        include: [
          { model: Post, attributes: ["id"] },
          { model: User, as: "Followings", attributes: ["id"] },
          { model: User, as: "Followers", attributes: ["id"] },
        ],
      });
      res.status(200).json(fullUserWithoutPassword);
    } else {
      res.status(200).json(null);
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 특정 유저 조회
router.get("/:userId", async (req, res, next) => {
  try {
    const fullUserWithoutPassword = await User.findOne({
      where: { id: req.params.userId },
      attributes: {
        exclude: ["password"],
      },
      include: [
        { model: Post, attributes: ["id"] },
        { model: User, as: "Followings", attributes: ["id"] },
        { model: User, as: "Followers", attributes: ["id"] },
      ],
    });
    if (fullUserWithoutPassword) {
      const data = fullUserWithoutPassword.toJSON();
      data.Posts = data.Posts.length;
      data.Follwers = data.Followers.length;
      data.Follwings = data.Followings.length;
      res.status(200).json(data);
    } else {
      res.status(404).json("User is not exist");
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 가입
router.post("/", isNotLoggedIn, async (req, res, next) => {
  try {
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (exUser) {
      return res.status(403).send("This e-mail used already");
    }
    const hasedPassword = await bcrypt.hash(req.body.password, 11);
    await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hasedPassword,
    });
    res.status(201).send("ok");
  } catch (e) {
    console.error(e);
    next(e); // status(500)
  }
});

// 로그인
router.post("/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error(err);
      next(err);
    }
    if (info) {
      return res.status(401).send(info.reason);
    }
    return req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }
      const fullUserWithoutPassword = await User.findOne({
        where: { id: user.id },
        attributes: {
          exclude: ["password"],
        },
        include: [
          { model: Post, attributes: ["id"] },
          { model: User, as: "Followings", attributes: ["id"] },
          { model: User, as: "Followers", attributes: ["id"] },
        ],
      });
      return res.status(200).json(fullUserWithoutPassword);
    });
  })(req, res, next);
});

// 로그아웃
router.post("/logout", isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.status(200).send("ok");
});

// 닉넴 수정
router.patch("/nickname", isLoggedIn, async (req, res, next) => {
  try {
    await User.update(
      {
        nickname: req.body.nickname,
      },
      {
        where: { id: req.user.id },
      }
    );
    res.status(200).json({ nickname: req.body.nickname });
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.patch("/:userId/follow", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      res.status(403).send("The user is not exist");
    }
    await user.addFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.delete("/:userId/follow", isLoggedIn, async (req, res, next) => {
  // DELETE /user/1/follow
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      res.status(403).send("The follower is not exist");
    }
    await user.removeFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete("/follower/:userId", isLoggedIn, async (req, res, next) => {
  // DELETE /user/follower/2
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      res.status(403).send("The following is not exist");
    }
    await user.removeFollowings(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get("/followers", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    const follwers = await user.getFollowers();
    console.log("팔로어", follwers);
    res.status(200).json(follwers);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.get("/followings", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    const follwings = await user.getFollowings();
    console.log("팔로잉", follwings);
    res.status(200).json(follwings);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.get("/:userId/posts", async (req, res, next) => {
  try {
    const where = { UserId: req.params.userId };
    if (parseInt(req.query.lastId, 10)) {
      // 초기 로딩이 아닐 때
      where.id = { [Op.lt]: parseInt(req.query.lastId, 10) };
    } // 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
    const posts = await Post.findAll({
      where,
      limit: 10,
      order: [
        ["createdAt", "DESC"],
        [Comment, "createdAt", "DESC"],
      ],
      include: [{ model: User, attributes: ["id", "nickname"] }, { model: Image }, { model: Comment, include: [{ model: User, attributes: ["id", "nickname"] }] }, { model: User, as: "Likers", attributes: ["id"] }, { model: Post, as: "Retweet", include: [{ model: User, attributes: ["id", "nickname"] }, { model: Image }] }],
    });
    res.status(200).json(posts);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

module.exports = router;
