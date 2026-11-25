const express = require("express");
const router = express.Router();
const {forgotpassword, Userdetails,ArticleTable,BookingPracel,YearfolderSchema,
  BookingPracelDet,YearEventModel,Addproduct ,orderdet,Address,OrganicUserDetails,AddEventsModel,RegisterationEvent,
  ProgramMaster} = require("./model");
const { Announcement, ANNOUNCEMENT_LABELS } = require("./model");
const jwt = require('jsonwebtoken');
const { router: adminAuthRouter, requireAdmin } = require('./adminAuth');
const { router: eventOpsRouter, registrationBlocker } = require('./eventOps');
const mongoose = require("mongoose");

const {VendorSchema,LocationSchema,ScheduleSchema,BookingSchema} = require("./model")

// Heavy, rarely-used libraries are loaded lazily to keep serverless cold starts short.
let mailTransport;
const getMailTransport = () => {
  if (!mailTransport) {
    mailTransport = require("nodemailer").createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return mailTransport;
};

let razorpay;
const getRazorpay = () => {
  if (!razorpay) {
    const Razorpay = require("razorpay");
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_AApuZR0yWRvZ5T",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "sYxU4gVHXlaWWFw7BYtdblB2"
    });
  }
  return razorpay;
};

const JWT_SECRET = process.env.JWT_SECRET || 'ADIMIN';

// Shared login logic (identical for both login endpoints).
async function loginWith(Model, fields, req, res) {
  const data = req.query;
  try {
    const user = await Model.findOne({
      $or: [
        { PhoneNo: data.UserName },
        { UserName: data.UserName },
        { Email: data.UserName }
      ],
      Password: data.Password
    }).select(fields).lean();

    if (user) {
      const token = jwt.sign({ sub: data.UserName }, JWT_SECRET, { expiresIn: '1y' });
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
}

router.get('/login', (req, res) => loginWith(Userdetails, 'UserName PhoneNo Email', req, res));


router.get('/GetArticle', async function (req, res) {
  try {
    const articles = await ArticleTable.find({}).lean();
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


// Multi-document write: keeps its transaction.
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
    const response = await BookingPracel.find().lean();
    res.status(200).json({ data:response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})


router.get('/GetManagePracel', async (req, res) => {
  try {
    const param = req.query;

    const response = await BookingPracel.find({ ToBranchCode: param.BranchCode }).lean();

    res.status(200).json({ data:response,Boolval:true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/GetReport', async (req, res) => {
  const param = req.query
  try {
    const response = await BookingPracelDet.find({
      createdAt: {
        $gte: new Date(param.FromDate),
        $lte: new Date(param.ToDate)
      }
    }).lean();
    res.status(200).json({ data: response, Boolval: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/GetBranchCode', async (req, res) => {
  try {
    const param = req.query
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


router.get('/', (req, res) => {
  res.send('hello')
})


//add products

router.post('/Addproducts' , async function (req, res) {
  try {
    // Single-document insert is already atomic; no session/transaction needed.
    await Addproduct.create(req.body);
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



router.get('/GetOrderID' , async (req, res) => {
  try {
    const count = await Address.countDocuments();
    const DocNo = 'ORD-00-' + (count + 1);
    res.status(200).json({ orderid:DocNo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
})


// Two collections written together: keeps its transaction.
router.post('/OrdersInsert' , async function (req, res) {
  const entity = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Address.create([entity], { session });
    await orderdet.insertMany(entity.CartDet, { session });
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
    const response = await Addproduct.find({Category:req.query.Category}).lean();
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
    const response = await Addproduct.find({ Latest: 'Y' }).lean();

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



router.get('/Ecommercelogin', (req, res) => loginWith(OrganicUserDetails, 'Email UserName PhoneNo', req, res));

router.post('/Register' , async function (req, res) {
  try {
    await OrganicUserDetails.create(req.body);
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



router.get('/GetUserDetailsAll', async (req, res) => {
  try {
    const response = await OrganicUserDetails.find().lean();
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



// Insert + email must succeed together, so the transaction is kept.
router.post("/forgotpasswordOTP", async function (req, res) {
  const param = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const token = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP

    const entity = {
      email: param.Email,
      resetToken: token,
      resetTokenExpires: new Date(Date.now() + 3600000), // 1-hour expiry
    };

    await forgotpassword.create([entity], { session });

    // Send email before committing the transaction
    await getMailTransport().sendMail({
      from: process.env.EMAIL_USER,
      to: param.Email,
      subject: "RESET PASSWORD - ORGANIC",
      text: `Your OTP Number: ${token}`,
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      Boolval: true,
      msg: "Email sent successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", err.message);

    return res.status(500).json({
      Boolval: false,
      returnerror: err.message
    });
  }
});



router.get('/ValidateOtp', async (req, res) => {
  try {
    const response = await forgotpassword.find().lean();
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
    await OrganicUserDetails.updateOne(
      { Email: entity.Email },
      { $set: { Password: entity.Password } }
    );
    await forgotpassword.findOneAndDelete({ email: entity.Email});
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
    const filter = { UserName: req.query.UserName };

    // Independent queries run concurrently.
    const [resp1, resp2] = await Promise.all([
      Address.find(filter).lean(),
      orderdet.find(filter).lean(),
    ]);

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
  try {
    const existingEvent = await AddEventsModel.exists({ EventNo: entity.EventNo });

    if (existingEvent) {
      return res.status(400).send({
        Boolval: false,
        returnerror: "Event No already exists",
      });
    }

    await AddEventsModel.create(entity);
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



router.post("/UpdateEvent", async function (req, res) {
  const entity = req.body;

  try {
    const resp1 = await AddEventsModel.findOneAndUpdate(
      { EventNo: entity.EventNo },
      entity,
      { new: true }
    );

    if (!resp1) {
      throw new Error("Event not found");
    }

    return res.status(200).send({
      Boolval: true,
      returnerror: "",
      updatedEvent: resp1,
    });
  } catch (err) {
    return res.status(500).send({
      Boolval: false,
      returnerror: err.message,
    });
  }
});




router.get('/GetEvents', async function (req, res) {
  try {
    const response = await AddEventsModel.find().lean();
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
    const filter = { EventNo: req.query.EventNo };
    const [response, response1] = await Promise.all([
      AddEventsModel.find(filter).lean(),
      RegisterationEvent.find(filter).lean(),
    ]);

    res.status(200).json({
      Boolval: true,
      data: response,
      data2:response1,
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


// Insert + email must succeed together, so the transaction is kept.
router.post("/RegisterEvent", async function (req, res) {
  const entity = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Server-side rules: event exists, registration open (deadline / seats / status), no duplicate roll number.
    // Business-rule rejections use HTTP 200 + Boolval:false so the page can show the message.
    const blocked = await registrationBlocker(entity, session);
    if (blocked) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({ Boolval: false, returnerror: blocked });
    }
    // Attendance fields can only be set by the check-in screen.
    delete entity.CheckedIn; delete entity.CheckedInAt; delete entity.CheckedInBy; delete entity.Void;

    const count = await RegisterationEvent.countDocuments();
    const prefix = entity.EventTitle.slice(0, 3);
    let seq = count + 1;
    let DocNo = prefix + '/' + seq + '/' + '2025';
    // Counting alone can repeat an id after a deletion; keep it unique.
    while (await RegisterationEvent.exists({ RegisterationID: DocNo }).session(session)) {
      seq += 1;
      DocNo = prefix + '/' + seq + '/' + '2025';
    }
    entity.RegisterationID = DocNo;
    await RegisterationEvent.create([entity], { session });
    const qrText = `EventName: ${entity.EventTitle}\nName: ${entity.FullName}\nRegistration ID: ${entity.RegisterationID}\nRoll No: ${entity.RollNo}\nEmail: ${entity.EmailAddress}`;

    // Generate QR code as a buffer (no file system needed)
    const qrCodeBuffer = await require('qrcode').toBuffer(qrText, { errorCorrectionLevel: 'L' });

    await getMailTransport().sendMail({
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
          filename: 'qrcode.png',
          content: qrCodeBuffer,
          encoding: 'base64'
        }
      ]
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      Boolval: true,
      msg: "Email sent successfully",
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error:", err.message);
    return res.status(500).json({
      Boolval: false,
      returnerror: err.message
    });
  }
});



router.get('/GetFolder' , async function (req, res) {
  try {
    const response = await YearfolderSchema.find().lean();
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
})


router.post('/AddFolder' , async function (req, res) {
  const entity = req.body;
  try {
    const existingEvent = await YearfolderSchema.exists({ YearName: entity.YearName });

    if (existingEvent) {
      return res.send({
        Boolval: false,
        returnerror: "Year already exists",
        message:"Year already exists"
      });
    }

    await YearfolderSchema.create(entity);
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



// ---- Events inside a year folder (name, date, guest, participant list from Excel) ----
router.get('/GetYearEvents', requireAdmin, async function (req, res) {
  try {
    const filter = { Void: { $ne: 'Y' } };
    if (req.query.YearName) filter.YearName = String(req.query.YearName);
    // Participants are omitted from the list view (can be large); fetch one with /GetYearEventById.
    const data = await YearEventModel.find(filter).select('-Participants').sort({ createdAt: -1 }).lean();
    res.status(200).json({ Boolval: true, data, returnerror: "" });
  } catch (err) {
    res.status(500).json({ Boolval: false, returnerror: err.message, message: err.message });
  }
});

router.get('/GetYearEventById', requireAdmin, async function (req, res) {
  try {
    const data = await YearEventModel.findById(req.query.id).lean();
    if (!data) return res.send({ Boolval: false, returnerror: "Not found", message: "Not found" });
    res.status(200).json({ Boolval: true, data, returnerror: "" });
  } catch (err) {
    res.status(500).json({ Boolval: false, returnerror: err.message, message: err.message });
  }
});

router.post('/AddYearEvent', requireAdmin, async function (req, res) {
  const e = req.body || {};
  try {
    const YearName = String(e.YearName || '').trim();
    const EventName = String(e.EventName || '').trim();
    const EventDate = String(e.EventDate || '').trim();
    if (!YearName || !EventName || !EventDate) {
      return res.send({ Boolval: false, returnerror: "Year, event name and date are required", message: "Year, event name and date are required" });
    }
    if (!(await YearfolderSchema.exists({ YearName }))) {
      return res.send({ Boolval: false, returnerror: "Folder does not exist", message: "Folder does not exist" });
    }
    const Participants = Array.isArray(e.Participants) ? e.Participants : [];
    await YearEventModel.create({
      YearName,
      EventName,
      EventDate,
      GuestName: String(e.GuestName || '').trim(),
      FileName: e.FileName,
      Participants,
      ParticipantCount: Participants.length,
      Void: 'N',
      createdBy: e.createdBy,
    });
    return res.status(200).send({ Boolval: true, returnerror: "" });
  } catch (err) {
    return res.send({ Boolval: false, returnerror: err.message, message: err.message });
  }
});

router.post('/VoidYearEvent', requireAdmin, async function (req, res) {
  try {
    await YearEventModel.updateOne({ _id: req.body.id }, { Void: 'Y' });
    return res.status(200).send({ Boolval: true, returnerror: "" });
  } catch (err) {
    return res.send({ Boolval: false, returnerror: err.message, message: err.message });
  }
});


router.get('/GetLocationDetails', async function (req, res) {
  try {
    const resp = await LocationSchema.find({}).lean();
    res.status(200).json({
      Boolval: true,
      data: resp,
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


router.get('/GetVendorDetails', async function (req, res) {
  try {
    const resp = await VendorSchema.find({}).lean();
    res.status(200).json({
      Boolval: true,
      data: resp,
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



router.get('/GetAllPrograms', async function (req, res) {
  try {
    const resp = await ProgramMaster.find({}).lean();
    res.status(200).json({
      Boolval: true,
      data: resp,
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


router.post('/Schedule' , async function (req, res) {
  const entity = req.body;
  try {
    const existingEvent = await ScheduleSchema.exists({ ScheduleID: entity.Entity.ScheduleID });

    if (existingEvent) {
      return res.send({
        Boolval: false,
        returnerror: "ScheduleID exists",
      });
    }

    await ScheduleSchema.create(entity.Entity);
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



router.get('/GetBusSearch', async function (req, res) {
  try {
    const param = req.query
    const resp = await ScheduleSchema.find({FromLocation:param.FromLocation,ToLocation:param.ToLocation}).lean();
    res.status(200).json({
      Boolval: true,
      data: resp,
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


router.get('/GetScheduleDetail', async function (req, res) {
  try {
    const resp = await ScheduleSchema.findOne({ScheduleID:req.query.ScheduleID}).lean();
    res.status(200).json({
      Boolval: true,
      data: resp,
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



router.post('/BusBooking' , async function (req, res) {
  try {
    await BookingSchema.create(req.body.Entity);
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



router.get('/GetBookedSeats', async function (req, res) {
  try {
    const result = await BookingSchema.aggregate([
      { $match: { scheduleId: req.query.ScheduleID } },
      { $unwind: "$busBookingPassengers" },
      {
        $group: {
          _id: "$scheduleId",
          seatNumbers: { $addToSet: "$busBookingPassengers.seatNo" }
        }
      }
    ]);

    res.status(200).json({
      Boolval: true,
      data: result,
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

router.post('/createOrder', async function (req, res) {
  try {
    const response = await getRazorpay().orders.create({
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "order_rcptid_11"
    });

    res.status(200).json({
      Boolval: true,
      data: response
    });
  } catch (err) {
    console.error("Razorpay error:", err);
    res.status(500).json({
      Boolval: false,
      returnerror: err.message
    });
  }
});


// ---------------- Event Announcements (CRUD) ----------------

const pickAnnouncement = ({ EventName, Comment, Description, Label }) =>
  ({ EventName, Comment, Description, Label });

// Dropdown values for the Label field
router.get('/GetAnnouncementLabels', (req, res) => {
  res.status(200).json({ Boolval: true, data: ANNOUNCEMENT_LABELS, returnerror: "" });
});

// Create
router.post('/AddAnnouncement', async function (req, res) {
  try {
    const doc = await Announcement.create(pickAnnouncement(req.body));
    return res.status(200).send({ Boolval: true, returnerror: "", data: doc });
  } catch (err) {
    return res.send({ Boolval: false, returnerror: err.message });
  }
});

// List (optional ?Label= filter), newest first
router.get('/GetAnnouncements', async function (req, res) {
  try {
    const filter = req.query.Label ? { Label: String(req.query.Label) } : {};
    const data = await Announcement.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({ Boolval: true, data, returnerror: "" });
  } catch (err) {
    res.status(500).json({ Boolval: false, returnerror: err.message });
  }
});

// Read one (for the edit screen)
router.get('/GetAnnouncementById', async function (req, res) {
  try {
    const data = await Announcement.findById(req.query.id).lean();
    if (!data) {
      return res.status(404).json({ Boolval: false, returnerror: "Announcement not found" });
    }
    res.status(200).json({ Boolval: true, data, returnerror: "" });
  } catch (err) {
    res.status(500).json({ Boolval: false, returnerror: err.message });
  }
});

// Update
router.put('/UpdateAnnouncement', async function (req, res) {
  try {
    const data = await Announcement.findByIdAndUpdate(
      req.body._id,
      pickAnnouncement(req.body),
      { new: true, runValidators: true, omitUndefined: true }
    ).lean();
    if (!data) {
      return res.status(404).json({ Boolval: false, returnerror: "Announcement not found" });
    }
    res.status(200).json({ Boolval: true, returnerror: "", data });
  } catch (err) {
    res.status(500).json({ Boolval: false, returnerror: err.message });
  }
});

// Delete
router.delete('/DeleteAnnouncement', async function (req, res) {
  try {
    const data = await Announcement.findByIdAndDelete(req.query.id).lean();
    if (!data) {
      return res.status(404).json({ Boolval: false, returnerror: "Announcement not found" });
    }
    res.status(200).json({ Boolval: true, returnerror: "" });
  } catch (err) {
    res.status(500).json({ Boolval: false, returnerror: err.message });
  }
});

// Seat availability (public), check-in and dashboard (admin) -> /api/availability, /api/checkin, /api/dashboard
router.use('/api', eventOpsRouter);

// Admin sign-in -> /api/admin/login, /api/admin/me
router.use('/api/admin', adminAuthRouter);

// Event announcements CRUD -> /api/events
router.use('/api/events', require('./announcement'));

module.exports = router;
