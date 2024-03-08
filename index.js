const express = require('express')
const app = express()
const cors = require('cors')
const { urlencoded } = require("body-parser"); //to get the post result from the html and more
const mongoose = require("mongoose");
require('dotenv').config()
mongoose.connect(process.env.MONGO_URI); //logging into the database

var exerciseSchema = new mongoose.Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: String, default: () => new Date().toDateString()},
})
var exercise = mongoose.model("exercise",exerciseSchema);

var userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  count: {type: Number, default: 0},
  log: {type: [exerciseSchema], default : [],},
});
var user = mongoose.model("user", userSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true })) // In short this makes req.body possible
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.post("/api/users", async (req,res)=>{
let nickname = req.body.username;
let savedUser = await new user({username: nickname}).save();
res.json({username: savedUser.username, _id: savedUser._id});
})

app.get("/api/users", async (req,res)=>{
let data = await user.find({}) 
res.json(data);
})

app.post("/api/users/:_id/exercises", async (req,res)=>{
  let id = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = new Date(req.body.date);
  let dateString = date.toDateString()
  console.log("req.body.date is",req.body.date);

  console.log("the dateString is",date, "the typoe of dateString is",typeof(dateString));
  let savedExercise = await new exercise({description: description, duration: duration, userId: id}).save();
  console.log("saved exercise is",savedExercise.toJSON());
  if(!(dateString == "Invalid Date")){ 
    savedExercise.date =dateString;  
    }
    await savedExercise.save();
  console.log("savedExercise.date is",savedExercise.date);
  let foundUser = await user.findOne({_id: id});
  foundUser.log.push(savedExercise);
  foundUser.count= foundUser.count+1;
  await foundUser.save();
 // console.log("savedExercise.date is",savedExercise.date);
 // let dateString = savedExercise.date.toDateString();
  //console.log("dateString is",dateString);
  //let count = foundUser.log.length;

  //console.log( " Count is %d, date is %s",count,dateString);
  res.json({_id: foundUser._id, username: foundUser.username, date: savedExercise.date, duration: savedExercise.duration, description: savedExercise.description, });
  //res.json({username: foundUser.username, count: count, _id: foundUser._id, log:[{description: savedExercise.description, duration: savedExercise.duration, date: savedExercise.date,}],});
  })

  app.get("/api/users/:_id/logs",async (req,res)=>{
    let id = req.params._id;
    let foundUser = await user.findOne({_id: id});
   // foundUser.count = foundUser.log.length;
    await foundUser.save();
    res.json({_id : foundUser.id, username: foundUser.username, count: foundUser.count, log: foundUser.log,});


  })


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
