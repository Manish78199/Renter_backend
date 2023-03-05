const mongoose=require('mongoose')
const Schema = require('mongoose').Schema;

var User = mongoose.model('User', {
    name: String,
    email: { type: String, lowercase: true, requird: true },
    password: String,
     date:{type:Date,default:new Date()},
});


var placeSchema = mongoose.Schema({
    owner:{ type: Schema.Types.ObjectId, ref: 'User' },
    giver_name: {type:String,lowercase:true},
    title: {type:String,lowercase:true},
    contact_no: {type:String,lowercase:true},
    whatapp_no: {type:String,lowercase:true},
    place_size:{type:Number,lowercase:true},
    price_pm:{type:Number,lowercase:true},
    description: {type:String,lowercase:true},
    address: {type:String,lowercase:true},
    zip_code: {type:String,lowercase:true},
    city: {type:String,lowercase:true},
    state: {type:String,lowercase:true},
    country: {type:String,default:"india",lowercase:true},
    date:{type:Date,default:new Date()},
    images:Array

});
var UserPlace = mongoose.model('UserPlace', placeSchema);

var privatemessages=mongoose.model("privatemessages",{
    sender:String,
    reciever:String,
    message:String,
    seen:{type:Boolean,default:false},
    dateTime:{type:Date,default:new Date()},
})



module.exports.UserPlace=UserPlace;
module.exports.User=User;
module.exports.privatemessages=privatemessages
