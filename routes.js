const express = require("express");
const router = express.Router();
const User = require("./model");
const mongoose = require("mongoose");

router.post("/create", async (req, res) => {
  try {
    console.log(req.body)

    let loaddata = {
      
        name: "Vicky",
        password: "vicky123",
        email: "vigneswaran162@gmail.com"
      
      
    }
    const user = new User(loaddata);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.get("/getall", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




router.get("/example", async (req, res) => {
  try {
      const data = await someAsyncFunction();
      res.json(data);
  } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});




router.delete("/delete", async (req, res) => {
    try {
         
   
    

      let { _id } = req.query; 
      const user = await User.findByIdAndDelete(new mongoose.Types.ObjectId(_id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });



  router.put("/update", async (req, res) => {
    try {

      let { _id } = req.query; 


      const user = await User.findByIdAndUpdate(new mongoose.Types.ObjectId(_id), req.body, {
        new: true,
        runValidators: true, 
      });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
module.exports = router;
