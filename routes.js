const express = require("express");
const router = express.Router();
const { Userdetails,ArticleTable,BookingPracel,BookingPracelDet } = require("./model");
const jwt = require('jsonwebtoken'); // Ensure jwt is importedUserdetails
const mongoose = require("mongoose");


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





router.get('/GetArticle', async function (req, res) {
  try {
    const articles = await ArticleTable.find({});
    res.status(200).json({
      Boolval: true,
      data: articles,
      returnerror: ""
    });
  } catch (err) {
  
    res.status(500).json({
      Boolval: false,
      returnerror: err.message
    });
  }
}
)






router.post('/BoookingInsert' , async function (req, res) {
  const entity = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(entity,'VICKY');


    const existingDoc = await BookingPracel.findOne({ DocNo: entity.DocNo }).session(session);
    
    if (existingDoc) {
      await session.abortTransaction();
      session.endSession();
      return res.send({
        Boolval: false,
        returnerror: "Doc No already exists",
      });
    }

 const resp1 = await BookingPracel.create([entity], { session });

    
    if (entity.BookingDet && entity.BookingDet.length > 0) {
      entity.BookingDet.forEach((det) => {
        det.BookingPracelId = resp1[0]._id; 
      });

      await BookingPracelDet.insertMany(entity.BookingDet, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).send({
      Boolval: true,
      returnerror: "",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    return res.send({
      Boolval: false,
      returnerror: err.message,
    });
  }
})




router.get('/GetDocNo' , async (req, res) => {
  try {
    const count = await BookingPracel.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})


router.get('/GetAll' , async (req, res) => {
  try {
    const response = await BookingPracel.find();
    res.status(200).json({ data:response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})


router.get('/GetManagePracel', async (req, res) => {
  try {
    const param = req.query;
 
    const response = await BookingPracel.find({ ToBranchCode: param.BranchCode });

    res.status(200).json({ data:response,Boolval:true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get('/GetBranchCode', async (req, res) => {
  try {

    
    let param = req.query
    const users = await Userdetails.aggregate([
      {
        $match: { BranchCode: { $ne:param.BranchCode } } 
      },
      {
        $project: {
          UserCode: 1,
          BranchCode: 1,
          SearchField: { $concat: ["$BranchName", "-->", "$District"] } // Concatenate BranchName and District
        }
      }
    ]);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});







router.get('/', async function (req, res) {
  try {
  res.send('hello')
  } catch (err) {
  
    res.status(500).json({
      Boolval: false,
      returnerror: err.message
    });
  }
}
)

module.exports = router;
