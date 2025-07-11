const mongoose = require('mongoose');
const type = require('mongoose/lib/schema/operators/type');
const { Schema } = mongoose;

const UserDetailsSchema = new Schema({
  UserCode: { type: String, maxlength: 20 },
  UserName: { type: String, maxlength: 100 },
  EmailId: { type: String, maxlength: 50 },
  PhoneNo: { type: String, maxlength: 20 },
  Password: { type: String, maxlength: 40 },
  Address: { type: String, maxlength: 200 },
  BranchCode: { type: String, maxlength: 30 },
  BranchName: { type: String, maxlength: 30 },
  District: { type: String, maxlength: 60 },
  state: { type: String, maxlength: 60 },
  Void: { type: String, maxlength: 1 },
  createdBy: { type: String, maxlength: 50 },
  createdAt: { type: Date },
  updatedBy: { type: String, maxlength: 15 },
  updatedAt: { type: Date },
  voidedBy: { type: String, maxlength: 50 },
  voidedAt: { type: Date }
}, {
  collection: 'Userdetails',
  timestamps: true,
});



const BookingPracelSchema = new Schema({
  DocNo: { type: String, maxlength: 20 },
  DocDate: { type: String, maxlength: 20 },
  PaymentMode: { type: String, maxlength: 20 },
  TotalAmount: { type: Number },
  FromPlace: { type: String, maxlength: 60 },
  ToBranchCode: { type: String, maxlength: 10 },
  FormBranchCode: { type: String, maxlength: 10 },

  FromPlace: { type: String, maxlength: 60 },
  FromName: { type: String, maxlength: 60 },
  FromPhoneNo: { type: String, maxlength: 30 },
  FromGSTNo: { type: String, maxlength: 30 },
  ToPlace: { type: String, maxlength: 60 },
  ToName: { type: String, maxlength: 60 },
  ToPhoneNo: { type: String, maxlength: 30 },
  ToGSTNo: { type: String, maxlength: 30 },
  Cancel: { type: String, maxlength: 30 },
  CanceledBy: { type: String, maxlength: 30 },
  Void: { type: String, maxlength: 1 },
  createdBy: { type: String, maxlength: 50 },
  createdAt: { type: Date },
  updatedBy: { type: String, maxlength: 15 },
  updatedAt: { type: Date },
  voidedBy: { type: String, maxlength: 50 },
  voidedAt: { type: Date },
  Status: { type: String, maxlength: 10 },
}, {
  collection: 'BookingPracel_hdr',
  timestamps: true,
});


const BookingPracelDetSchema = new Schema({
  DocNo: { type: String, maxlength: 20 },
  DocDate: { type: String, maxlength: 20 },
  ToBranchCode: { type: String, maxlength: 10 },
  FormBranchCode: { type: String, maxlength: 10 },
  Status: { type: String, maxlength: 10 },
  PaymentMode: { type: String, maxlength: 20 },
  Article: { type: String, maxlength: 60 },
  Description: { type: String, maxlength: 60 },
  ItemValue: { type: String, maxlength: 30 },
  Weight: { type: String, maxlength: 30 },
  Quantity: { type: String, maxlength: 60 },
  Discount: { type: String, maxlength: 60 },
  TotalAmount: { type: Number },
  FreightAmount: { type: Number },
  Cancel: { type: String, maxlength: 30 },
  CanceledBy: { type: String, maxlength: 30 },
  Void: { type: String, maxlength: 1 },
  createdBy: { type: String, maxlength: 50 },
  createdAt: { type: Date },
  updatedBy: { type: String, maxlength: 15 },
  updatedAt: { type: Date },
  voidedBy: { type: String, maxlength: 50 },
  voidedAt: { type: Date }
}, {
  collection: 'BookingPracel_Det',
  timestamps: true,
});


const ArticleTableSchema = new Schema({
  Articlecode: { type: String, maxlength: 20 },
  ArticleName: { type: String, maxlength: 20 },
  Amount: { type: Number },
  MinAmount: { type: Number },



}, {
  collection: 'ArticleTable',
  timestamps: true,
});



const AddproductSchema = new Schema({
  ProductNo: { type: String, maxlength: 20 },
  ProductDate: { type: String, maxlength: 20 },
  ProductName: { type: String, maxlength: 40 },
  Category: { type: String, maxlength: 40 },
  Rate: { type: String, maxlength: 10 },
  Quantity: { type: String, maxlength: 20 },
  QuantityDescription: { type: String, maxlength: 60 },
  Status: { type: String, maxlength: 60 },
  Latest: { type: String, maxlength: 60 },
  CartQuantity: { type: String, maxlength: 60 },
  Trending: { type: String, maxlength: 30 },
  ProductImage: { type: String },
  ProductImageurl:{ type: String, maxlength: 30 },
  createdBy: { type: String, maxlength: 50 },
  createdAt: { type: Date },
  updatedBy: { type: String, maxlength: 15 },
  updatedAt: { type: Date },
  voidedBy: { type: String, maxlength: 50 },
  voidedAt: { type: Date }
}, {
  collection: 'Addproduct',
  timestamps: true,
});



const OrderSchema = new Schema({
  orderId: { type: String, maxlength: 20  },
  UserName: { type: String, maxlength: 100 },
  customerName: { type: String, maxlength: 100 },
  ProductName: { type: String, maxlength: 40 },
  Category: { type: String, maxlength: 40 },
  Rate: { type: String, maxlength: 10 },
  Quantity: { type: String, maxlength: 20 },
  price: { type: String, maxlength: 20 },
  CartQuantity: { type: String, maxlength: 60 },
  status:{ type: String, maxlength: 20  },
  createdBy: { type: String, maxlength: 50 },
  createdAt: { type: Date },
  updatedBy: { type: String, maxlength: 15 },
  updatedAt: { type: Date },
  voidedBy: { type: String, maxlength: 50 },
  voidedAt: { type: Date }
}, {
  collection: 'OrderDetails',
  timestamps: true,
  strict: false 
});




const AddressSchema = new mongoose.Schema(
  {
    orderId: { type: String, maxlength: 20  },
    UserName: { type: String, maxlength: 100 },
    Name: { type: String, maxlength: 100 },
    PhoneNo: { type: String, maxlength: 15 },
    APhoneNo: { type: String, maxlength: 15 },
    Address: { type: String, maxlength: 255 },
    City: { type: String, maxlength: 100 },
    PinCode: { type: String, maxlength: 10 },
    State: { type: String, maxlength: 100 },
    Country: { type: String, maxlength: 100 },
    LandMark: { type: String, maxlength: 150 },
    PaymentMode: { type: String, maxlength: 50 },
    createdBy: { type: String, maxlength: 50 },
    createdAt: { type: Date },
    updatedBy: { type: String, maxlength: 15 },
    updatedAt: { type: Date },
    voidedBy: { type: String, maxlength: 50 },
    voidedAt: { type: Date }
  },
  { collection: 'AddresssModel',
    timestamps: true ,
    strict: false 
  } // Adds createdAt & updatedAt automatically
);





const UserSchema = new mongoose.Schema(
  {
    UserName: { type: String, maxlength: 100 },
    PhoneNo: { type: String, maxlength: 15 },
    Email: { type: String, maxlength: 50 },
    Password: { type: String, maxlength: 100 },
    role: { type: String, maxlength: 100 },
    Status: { type: String, maxlength: 50 },
    createdBy: { type: String, maxlength: 50 },
    createdAt: { type: Date },
    updatedBy: { type: String, maxlength: 15 },
    updatedAt: { type: Date },
    voidedBy: { type: String, maxlength: 50 },
    voidedAt: { type: Date }
  },
  { collection: 'organicUserDetails',
    timestamps: true } 
);

const forgotpasswordSchema = new mongoose.Schema(
  {
    email: { type: String, maxlength: 100 },
    resetToken: { type: String, maxlength: 15 },
    resetTokenExpires: { type: String, maxlength: 200 },
  },
  { collection: 'forgotpassword',
    timestamps: true } 
);





const AddEventSchema = new mongoose.Schema({
    EventNo: { type: String, maxlength: 50 },
    EventTitle: { type: String, maxlength: 50 },
    EventType: { type: String, maxlength: 20 },
    EventDate: { type: String, maxlength: 20 },
    EventLastDate: { type: String, maxlength: 20 },
    StartTime: { type: String, maxlength: 20 },
    EndTime: { type: String, maxlength: 20 },
    EventThumbnailImage: {type: String }, // BLOB equivalent in MongoDB
    EventMainImage: {type: String }, 
    EventSummary: { type: String, maxlength: 1000 },
    EventDetails: { type: String, maxlength: 3000 },
    EventPlace: { type: String, maxlength: 100 },
    PersonAllowed: { type: String, maxlength: 10 },
    Void: { type: String, maxlength: 2 },
    VoidedBy: { type: String, maxlength: 40 },
    CreatedBy: { type: String, maxlength: 40 },
    UpdatedBy: { type: String, maxlength: 40 },
    Type: { type: String, maxlength: 20 },

}, {
    collection: 'AddEvent', // Setting the table/collection name
    timestamps: true // Adds createdAt and updatedAt fields
});



const RegistrationEventSchema = new mongoose.Schema({
  RegisterationID: { type: String, maxlength: 50 },
  EventTitle: { type: String, maxlength: 100 },
  RollNo: { type: String, maxlength: 20 },
  FullName: { type: String, maxlength: 80 }, 
  EmailAddress: { type: String, maxlength: 100 },
  PhoneNo: { type: String, maxlength: 12 },
  DOB: { type: Date },
  CollegeName: { type: String, maxlength: 100 },
  Department: { type: String, maxlength: 40 },
  Void: { type: String, maxlength: 2 },
  EventNo:{ type: String, maxlength: 50 }
}, { collection: 'RegisterationEvent',
  timestamps: true 
 });

 const YearfolderSchema = new mongoose.Schema({
  YearName: { type: String, maxlength: 50 },
  createdBy: { type: String, maxlength: 100 },
  RollNo: { type: String, maxlength: 20 },
  Void: { type: String, maxlength: 2 },
}, { collection: 'Yearfolder',
  timestamps: true 
 });

//bus Booking

const LocationSchema = new mongoose.Schema({
  LocationCode: { type: String, maxlength: 20 },
  LocationName: { type: String, maxlength: 100 },
  Void: { type: String, maxlength: 2 },
}, { collection: 'LocationMaster',
  timestamps: true 
 });



 const VendorSchema = new mongoose.Schema({
  VendorID: { type: String, maxlength: 50 },
  VendorName: { type: String, maxlength: 100 },
  EmailAddress: { type: String, maxlength: 100 },
  PhoneNumber: { type: String, maxlength: 20 },
  Void: { type: String, maxlength: 2 },
}, { collection: 'VendorMaster',
  timestamps: true 
 });



 const ScheduleSchema = new mongoose.Schema({
  ScheduleID: { type:String },
  VendorID: { type: String },
  BusName: { type: String, maxlength: 100 },
  BusVehicleNo: { type: String, maxlength: 50 },
  FromLocation: { type: String },
  ToLocation: { type: String },
  DepartureTime: { type: String },
  ArrivalTime: { type: String },
  ScheduleDate: { type: Date },
  Price: { type: Number },
  TotalSeats: { type: Number },
  AvailableSeats:{type:Number}
}, {
  collection: 'ScheduleMaster',
  timestamps: true
});


const BusBookingPassengerSchema = new mongoose.Schema({
  passengerEmailId: { type: String},
  bookingId: { type: String, required: true },
  passengerName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  seatNo: { type: String, required: true },
  Price:{ type: String, required: true },

}, {
  collection: 'BusBookingPassenger',
  timestamps: true
});

const BookingSchema = new mongoose.Schema({
  bookingId: { type:String, required: true },
  custId: { type: String, required: true },
  bookingDate: { type: Date, required: true },
  scheduleId: { type: String, required: true },
  PickupPoint: { type: String },
  DropPoint: { type: String },
  EmailAddress: { type: String, required: true },
  PhoneNo: { type: String, required: true },
  TotalAmount: { type: String, required: true },
  PaymentMode:{ type: String },
  busBookingPassengers: [BusBookingPassengerSchema]
}
, {
  collection: 'BusBookingMaster',
  timestamps: true
});


module.exports = {
  BookingPracel: mongoose.model('BookingPracel', BookingPracelSchema),
  BookingPracelDet: mongoose.model('BookingPracelDet', BookingPracelDetSchema),
  Userdetails: mongoose.model('Userdetails', UserDetailsSchema),
  ArticleTable: mongoose.model('ArticleTable', ArticleTableSchema),
  Addproduct:mongoose.model('Addproduct', AddproductSchema),
  orderdet:mongoose.model('OrderDetails', OrderSchema),
  Address:mongoose.model("AddresssModel", AddressSchema),
  OrganicUserDetails:mongoose.model('organicUserDetails',UserSchema),
  forgotpassword:mongoose.model('forgotpassword',forgotpasswordSchema),
  AddEventsModel:mongoose.model('AddEvent',AddEventSchema),
  RegisterationEvent:mongoose.model('RegisterationEvent',RegistrationEventSchema),
  YearfolderSchema:mongoose.model('Yearfolder',YearfolderSchema),
  VendorSchema:mongoose.model('VendorSchema',VendorSchema),
  LocationSchema:mongoose.model('LocationSchema',LocationSchema),
  ScheduleSchema:mongoose.model('ScheduleSchema',ScheduleSchema),
  BusBookingPassengerSchema:mongoose.model('BusBookingPassengerSchema',BusBookingPassengerSchema),
  BookingSchema:mongoose.model('BookingSchema',BookingSchema),




};

