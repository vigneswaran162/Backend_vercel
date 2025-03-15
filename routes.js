const express = require("express");
const router = express.Router();
const {forgotpassword, Userdetails,ArticleTable,BookingPracel,BookingPracelDet,Addproduct ,orderdet,Address,OrganicUserDetails,AddEventsModel,RegisterationEvent} = require("./model");
const jwt = require('jsonwebtoken'); // Ensure jwt is importedUserdetails
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");


const QRCode = require('qrcode');
const fs = require('fs');



router.get('/login', async function (req, res) {
  const data = req.query;
  try {
    let response = await Userdetails.find({
      $or: [
        { PhoneNo: data.UserName },
        { UserName: data.UserName },
        { Email: data.UserName }
      ],
      Password: data.Password
    }).select('UserName PhoneNo Email'); 
    
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

router.get('/GetReport', async (req, res) => {
  let param = req.query
  try {
    const response = await BookingPracelDet.find({
      createdAt: {
        $gte: new Date(param.FromDate),
        $lte: new Date(param.ToDate)
      }
    });
    res.status(200).json({ data: response, Boolval: true });
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
          SearchField: { $concat: ["$BranchName", "-->", "$District"] } 
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


//add products



router.post('/Addproducts' , async function (req, res) {
  const entity = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const resp1 = await Addproduct.create([entity], { session });
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



router.get('/GetOrderID' , async (req, res) => {
  try {
    const count = await Address.countDocuments();
    let countnum = count+1 
    let DocNo = 'ORD-00-'+countnum;
    console.log(DocNo,'hello')
    res.status(200).json({ orderid:DocNo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})


router.post('/OrdersInsert' , async function (req, res) {
  const entity = req.body;
  console.log(entity)
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const resp1 = await Address.create([entity], { session });
    const resp2 = await orderdet.insertMany(entity.CartDet, { session });
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


router.get('/GetProductAll', async function (req, res) {
  try {
    let param = req.query
    console.log(param,'hello')
    const response = await Addproduct.find({Category:param.Category});
    res.status(200).json({
      Boolval: true,
      data: response,
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

router.get('/GetProductLatestAll', async (req, res) => {
  try {
    let response = await Addproduct.find({ Latest: 'Y' });

    return res.status(200).json({
      Boolval: true,
      data: response,
      returnerror: ""
    });
  } catch (err) {
    return res.status(500).json({
      Boolval: false,
      data: [],
      returnerror: err.message
    });
  }
});



router.get('/Ecommercelogin', async function (req, res) {
  const data = req.query;
  console.log('login')
  try {
    let response = await OrganicUserDetails.find({
      $or: [
        { PhoneNo: data.UserName },
        { UserName: data.UserName },
        { Email: data.UserName }
      ],
      Password: data.Password
    }).select('Email UserName PhoneNo '); 
    
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

router.post('/Register' , async function (req, res) {
  const entity = req.body;
  const session = await  mongoose.startSession();
  session.startTransaction();
  try {
    const resp1 = await OrganicUserDetails.create([entity], { session });
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




router.get('/GetUserDetailsAll', async (req, res) => {
  try {
    let response = await OrganicUserDetails.find();
    return res.status(200).json({
      Boolval: true,
      data: response,
      returnerror: ""
    });
  } catch (err) {
    return res.status(500).json({
      Boolval: false,

      returnerror: err.message
    });
  }
});



router.post("/forgotpasswordOTP", async function (req, res) {
  const param = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Received Request:", param);

    const token = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP

    let entity = {
      email: param.Email,
      resetToken: token,
      resetTokenExpires: new Date(Date.now() + 3600000), // 1-hour expiry
    };

    const resp1 = await forgotpassword.create([entity], { session });

    // Configure email transport using environment variables
    const transportmail = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email message
    const message = {
      from: process.env.EMAIL_USER,
      to: param.Email,
      subject: "RESET PASSWORD - ORGANIC",
      text: `Your OTP Number: ${token}`,
    };

    // Send email before committing the transaction
    await transportmail.sendMail(message);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      Boolval: true,
      msg: "Email sent successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", err);

    return res.status(500).json({
      Boolval: false,
      returnerror: err.message
    });
  }
});



router.get('/ValidateOtp', async (req, res) => {
  try {
    let response = await forgotpassword.find();
    return res.status(200).json({
      Boolval: true,
      data: response,
      returnerror: ""
    });
  } catch (err) {
    return res.status(500).json({
      Boolval: false,

      returnerror: err.message
    });
  }
});



router.post('/UpdatePassword' , async function (req, res) {
  const entity = req.body;
  try {
    let response = await OrganicUserDetails.updateOne(
      { Email: entity.Email },
      { $set: { Password: entity.Password } } 
  );    
  let response1 = await forgotpassword.findOneAndDelete({ email: entity.Email});
    return res.status(200).send({
      Boolval: true,
      returnerror: "",
    });
  } catch (err) {
    return res.send({
      Boolval: false,
      returnerror: err.message,
    });
  }
})



router.get('/Getorders', async function (req, res) {
  try {
    let param = req.query

    const resp1 = await Address.find({UserName:param.UserName});
    const resp2 = await orderdet.find({UserName:param.UserName});

    res.status(200).json({
      Boolval: true,
      data1: resp1,
      data2:resp2,
    });
  } catch (err) {
    res.status(500).json({
      Boolval: false,
      returnerror: err.message
    });
  }
}
)



router.post('/AddEvents' , async function (req, res) {
  const entity = req.body;
  console.log(entity)
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const resp1 = await AddEventsModel.create([entity], { session });
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



router.get('/GetEvents', async function (req, res) {
  try {
    const response = await AddEventsModel.find();
    res.status(200).json({
      Boolval: true,
      data: response,
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


router.get('/EventsGetById', async function (req, res) {
  try {
    let param = req.query
    const response = await AddEventsModel.find({EventNo:param.EventNo});
    res.status(200).json({
      Boolval: true,
      data: response,
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



router.post("/RegisterEvent", async function (req, res) {
  const entity = req.body;
  console.log(entity)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const resp1 = await RegisterationEvent.create([entity], { session });
    await session.commitTransaction();
    const qrFilePath = 'qrcode.png';
    const qrText = `EventName: ${entity.EventTitle}
    Name: ${entity.FullName}
    Registration ID: ${entity.RegistrationID}
    Email: ${entity.EmailAddress}`;    await generateQRCode(qrText, qrFilePath);

    const safeEventTitle = entity.EventTitle.replace(/\s+/g, '_'); 
    const qrcFilePath = `${safeEventTitle}_Tickect_QR.png`; 


    const transportmail = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email message
    const message = {
      from: process.env.EMAIL_USER,
      to: entity.EmailAddress,
      subject: "🎉 Event Registration Confirmation",
      text: `Dear ${entity.FullName},
  
  We are pleased to confirm your registration for **${entity.EventTitle}**.
  
  Thank you for signing up! We are excited to have you with us and look forward to an engaging and insightful event. If you have any questions or need assistance, please feel free to reach out.
  
  See you there!
  
  Best regards,  
  The Event Team`,
  attachments: [
    {
        filename: qrcFilePath,
        path: qrFilePath
    }
]
  };
    await transportmail.sendMail(message);
    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      Boolval: true,
      msg: "Email sent successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", err);
    return res.status(500).json({
      Boolval: false,
      returnerror: err.message
    });
  }
});



const generateQRCode = async (text, filePath) => {
    return new Promise((resolve, reject) => {
        QRCode.toFile(filePath, text, { type: 'png' }, (err) => {
            if (err) reject(err);
            resolve(filePath);
        });
    });
};



module.exports = router;
