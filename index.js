const express = require('express')
const app = express()
const cors = require('cors')
const { urlencoded } = require("body-parser"); //to get the post result from the html and more
const mongoose = require("mongoose");
require('dotenv').config()
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}); //logging into the database

var exerciseSchema = new mongoose.Schema({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: Date.now}
})
var exercise = mongoose.model("exercise",exerciseSchema);

var userSchema = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exerciseSchema],
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




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
