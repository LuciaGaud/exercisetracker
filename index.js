const express = require("express");
const app = express();
const cors = require("cors");
const { urlencoded } = require("body-parser"); //to get the post result from the html and more
const mongoose = require("mongoose");
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI); //logging into the database

var exerciseSchema = new mongoose.Schema({
  userId: { type: Object, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, default: () => new Date().toDateString() },
  dateISO: { type: Date, default: Date.now },
});
var exercise = mongoose.model("exercise", exerciseSchema);

var userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number, default: 0 },
  log: { type: [exerciseSchema], default: [] },
});
var user = mongoose.model("user", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // In short this makes req.body possible
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.post("/api/users", async (req, res) => {
  try {
    let nickname = req.body.username;
    let savedUser = await new user({ username: nickname }).save();
    res.json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    res.status(500).send({ message: "Error creating user", error: err });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    let data = await user.find({});
    res.json(data);
  } catch (err) {
    res.status(500).send({ message: "Error fetching users", error: err });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    let id = req.params._id;
    let description = req.body.description;
    let duration = parseInt(req.body.duration);
    let date = req.body.date ? new Date(req.body.date) : new Date();
    let dateString = date.toDateString();

    let savedExercise = await new exercise({
      userId: id,
      description: description,
      duration: duration,
      date: dateString,
      dateISO: date,
    }).save();

    let foundUser = await user.findOne({ _id: id });
    if (!foundUser) {
      return res.status(404).send({ message: "User not found" });
    }
    foundUser.log.push(savedExercise);
    foundUser.count = foundUser.log.length;
    await foundUser.save();

    res.json({
      _id: foundUser._id,
      username: foundUser.username,
      date: savedExercise.date,
      duration: savedExercise.duration,
      description: savedExercise.description,
    });
  } catch (err) {
    res.status(500).send({ message: "Error adding exercise", error: err });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    let id = req.params._id;
    let from = new Date(req.query.from || 0);
    let to = new Date(req.query.to || Date.now());
    let limit = parseInt(req.query.limit) || 0;

    let foundUser = await user.findOne({ _id: id });
    if (!foundUser) {
      return res.status(404).send({ message: "User not found" });
    }

    let filtered = await exercise
      .find({
        userId: id,
        dateISO: { $gte: from, $lte: to },
      })
      .select("description duration date")
      .limit(limit)
      .exec();

    res.json({
      _id: foundUser._id,
      username: foundUser.username,
      count: foundUser.log.length,
      log: filtered,
    });
  } catch (err) {
    res.status(500).send({ message: "Error fetching exercise log", error: err });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});