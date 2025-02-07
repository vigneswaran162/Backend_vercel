const express = require("express");
const router = express.Router();
const { Userdetails } = require("./model");
const jwt = require('jsonwebtoken'); // Ensure jwt is imported

router.get('/login', async function (req, res) {
  const data = req.query;
  try {
    let response = await Userdetails.find({
      $or: [
        { UserCode: data.UserName },
        { UserName: data.UserName },
        { EmailId: data.UserName }
      ],
      Password: data.Password
    }).select('UserCode UserName PhoneNo BranchCode BranchName District state'); 
    
    if (response.length > 0) {
      let user = response[0].toObject();
      const token = jwt.sign({ sub: data.UserName }, 'ADIMIN', { expiresIn: '1y' });
      user.token = token;

      res.send({
        Boolval: true,
        Token: token,
        userdata: [user]  
      });
    } else {
      res.status(200).send({
        Boolval: false,
        returnerror: "Incorrect UserName or Password"
      });
    }
  } catch (err) {
    res.send({
      Boolval: false,
      returnerror: err.message
    });
  }
});

module.exports = router;
