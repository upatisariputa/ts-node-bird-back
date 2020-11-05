const express = require("express");

const { Post, User, Image, Comment } = require("../models");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      // where: {id: lastId},
      limit: 10,
      order: [
        ["createdAt", "DESC"],
        [Comment, "createdAt", "DESC"],
      ], // 생성순서대로, DESC: 내림,  ASC: 오름차순
      include: [{ model: User, attributes: ["id", "nickname"] }, { model: Image }, { model: Comment, include: [{ model: User, attributes: ["id", "nickname"] }] }, { model: User, as: "Likers", attributes: ["id"] }],
    });
    res.status(200).json(posts);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

module.exports = router;
