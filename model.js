const mongoose = require('mongoose');
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
  DocNo:         { type: String, maxlength: 20 },
  DocDate:       { type: String, maxlength: 20 },
  PaymentMode:   { type: String, maxlength: 20 },
  TotalAmount:   { type: Number }, // or use Decimal128 if needed
  FromPlace:     { type: String, maxlength: 60 },
  FromName:      { type: String, maxlength: 60 },
  FromPhoneNo:   { type: String, maxlength: 30 },
  FromGSTNo:     { type: String, maxlength: 30 },
  ToPlace:       { type: String, maxlength: 60 },
  ToName:        { type: String, maxlength: 60 },
  ToPhoneNo:     { type: String, maxlength: 30 },
  ToGSTNo:       { type: String, maxlength: 30 },
  Cancel:        { type: String, maxlength: 30 },
  CanceledBy:    { type: String, maxlength: 30 },
  Void:          { type: String, maxlength: 1 },
  createdBy:     { type: String, maxlength: 50 },
  createdAt:     { type: Date },
  updatedBy:     { type: String, maxlength: 15 },
  updatedAt:     { type: Date },
  voidedBy:      { type: String, maxlength: 50 },
  voidedAt:      { type: Date }
}, {
  collection: 'BookingPracel_hdr',
  timestamps: true,
});


const BookingPracelDetSchema = new Schema({
  DocNo:         { type: String, maxlength: 20 },
  DocDate:       { type: String, maxlength: 20 },
  PaymentMode:   { type: String, maxlength: 20 },
  Article:       { type: String, maxlength: 60 },
  Description:   { type: String, maxlength: 60 },
  ItemValue:     { type: String, maxlength: 30 },
  Weight:        { type: String, maxlength: 30 },
  Quantity:      { type: String, maxlength: 60 },
  Discount:      { type: String, maxlength: 60 },
  TotalAmount:   { type: Number }, 
  FreightAmount: { type: Number }, 
  Cancel:        { type: String, maxlength: 30 },
  CanceledBy:    { type: String, maxlength: 30 },
  Void:          { type: String, maxlength: 1 },
  createdBy:     { type: String, maxlength: 50 },
  createdAt:     { type: Date },
  updatedBy:     { type: String, maxlength: 15 },
  updatedAt:     { type: Date },
  voidedBy:      { type: String, maxlength: 50 },
  voidedAt:      { type: Date }
}, {
  collection: 'BookingPracel_Det',
  timestamps: true,
});


const ArticleTableSchema = new Schema({
  Articlecode:         { type: String, maxlength: 20 },
  ArticleName:       { type: String, maxlength: 20 },
  Amount:   { type: Number },
  MinAmount:       { type: Number},



}, {
  collection: 'ArticleTable',
  timestamps: true,
});





module.exports = {
  BookingPracel: mongoose.model('BookingPracel', BookingPracelSchema),
  BookingPracelDet: mongoose.model('BookingPracelDet', BookingPracelDetSchema),
  Userdetails:mongoose.model('Userdetails', UserDetailsSchema),
  ArticleTable:mongoose.model('ArticleTable', ArticleTableSchema)
};

