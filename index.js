const corp = require("cors")
const path = require("path")

const OS = require("os")
const fs = require("fs")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose');
const bodyparser = require("body-parser")
const fileUpload = require('express-fileupload');
const { privatemessages, User, UserPlace } = require("./models");
const { authuser, tokenToId } = require("./Auth");




const exp = require("express");
const app = exp();
const http = require('http');
const { disconnect } = require("process");
const console = require("console")

const server = http.createServer(app);
const io = require("socket.io")(server,
    {
        cors: {
            // origin: "http://localhost:3000",
            origin: "*"
        }
    })

app.use(exp.static(path.join(__dirname, "public")))
console.log(path.join(__dirname, "public"))
app.use(corp())
app.use(bodyparser.urlencoded({ extended: true }))
app.use(fileUpload());
app.use(exp.json())





async function conDb() {
    var uri = 'mongodb://localhost:27017/Renter';
    var options = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
    await mongoose.connect(uri, options).then(() => console.log("db connected successfully")).catch((error) => console.log("Database not connected Due to  Technical  Issue"))
}
conDb()




app.post('/api/auth/signin', function (req, res) {
    try {
        User.findOne({ "email": req.body.email }, function (err, result) {
            if (result && result !== null) {

                if (bcrypt.compareSync(req.body.password, result.password)) {
                    let data = {
                        userId: result.id
                    }
                    const authToken = jwt.sign(data, "manishpawlikhurd@gmail.com")
                    res.json({ status: 200, succes: "successfully Login", userid: authToken })

                } else {

                    res.json({ error: "invalid credencial" })
                }

            }
            else {
                res.json({ error: "invalid credencial" })
            }

        })


    } catch (error) {
        res.json({ error: "Server Error" })
    }




})

app.post('/api/signup', function (req, res) {
    try {
        if (req.body.username && req.body.email && req.body.password) {
            if (req.body.password == req.body.cpassword) {

                User.findOne({ "email": req.body.email }, function (err, result) {
                    if (err) throw err; //There was an error with the database.
                    if (!result) {
                        var salt = bcrypt.genSaltSync(10);
                        var hash = bcrypt.hashSync(req.body.password, salt);
                        let newUser = new User({
                            name: req.body.username,
                            email: req.body.email,
                            password: hash
                        });
                        newUser.save((error, record) => {
                            if (error) {
                                res.json({

                                    error: 'some error occoured while saving the user in database.'
                                });
                            }
                            else {
                                res.json({
                                    status: 200,
                                    success: 'your are successfully sign up.'

                                });

                            }


                        })
                    }

                    else {
                        res.json({
                            message: 'oh my dear you are already register with this email',

                        });
                    }
                })




            }
            else {
                res.json({

                    error: 'password and confirm password shoud be same',

                });
            }
        }
        else {
            res.json({

                error: 'Please fill all fields',

            });
        }



    } catch (error) {
        res.json({ error: "Server Error" })
    }


})

app.post('/api/find', async function (req, res) {
    let findquery = req.body.query;
    let findres = await UserPlace.find({ $or: [{ title: { $regex: findquery } }, { description: { $regex: findquery } }, { address: { $regex: findquery } }, { city: { $regex: findquery } }, { state: { $regex: findquery } }] }).limit(30)
    let result = []

    console.log(findres)
    findres.forEach(data => {

        let str = data.place_size + " at " + data.price_pm + " Per Month" + " in " + data.address;
        result.push(str)
    })
    res.json({ result })
})

app.post('/api/auth/addshop', async function (req, res) {

    let userId = authuser(req.headers.token)
    let myuser = { ["owner"]: userId, ...JSON.parse(req.body.placedata) }

    const newplace = new UserPlace(
        myuser
    )

    let isuser = User.exists({ _id: userId })
    try {


        if (isuser) {
            try {
                await newplace.save();
            } catch (error) {
                console.log("error in saving ", error)
                res.json({ error: "Interal Server Error" })
            }


            let uploadPath = path.join(__dirname, '/public/static/img');

            let folder = newplace._id.toString();

            try {
                fs.mkdirSync(path.join(uploadPath, folder), true)
                console.log("created folder")
            } catch (error) {
                console.log("ispe folder na banaya ja rha ar yo bta rha ", error)
            }

            let sampleFile;
            let files = [];

            try {
                if (req.files) {
                    files = req.files.placeimage
                    console.log("from req.files", files.length)
                    if (files.length > 0) {
                        for (let image of files) {
                            sampleFile = image;
                            sampleFile.mv(path.join(uploadPath, folder, image.name));
                            console.log("file saved", image.name)
                        }
                    }
                    else {

                        files.mv(path.join(uploadPath, folder, files.name));
                        console.log("file saved", files.name)
                    }
                }

                let result2 = fs.readdirSync(path.join(uploadPath, folder))
                newplace.images = result2
                newplace.save()
            } catch (error) {
                console.log(error)
            }


            // fs.readdir(path.join(uploadPath, folder), function (err, result2) {
            //     if (result2) {
            //         newplace.images = result2
            //         newplace.save()
            //         console.log("from read dir", result2)
            //     }
            //     else {
            //         console.log("error in reading file", err)
            //     }

            // })













            res.json({
                status: 200,
                success: 'place details successfully saved.',

            });

        } else {
            res.json({
                error: 'you are not allowed add place'
            });
        }

    } catch (error) {
        console.log(error)
        res.json({ error: "Interal Server Error" })
    }








})



// update place details
app.put('/api/auth/updateshop/:shopid', async function (req, res) {
    let shopid = req.params.shopid
    let placedetails = JSON.parse(req.body.placedata)
    let wantdelete = JSON.parse(req.body.wantdelete)


    console.log("choosen image")
    let userId = authuser(req.headers.token)
    console.log(userId, shopid, wantdelete)
    UserPlace.findOneAndUpdate({ $and: [{ owner: userId }, { _id: shopid }] }, placedetails, function (err, result) {
        if (err) {
            console.log("there is ", err)
            res.json({
                error: 'Internal Error',

            });
        }
        console.log("updated")
        try {
            if (wantdelete.length > 0) {
                wantdelete.forEach((image) => {
                    console.log(image)
                    fs.unlinkSync(path.join(__dirname, "public/static/img", shopid, image))
                })
            }
        } catch (error) {
            console.log("error in want delete", error)
        }

        let sampleFile;
        let uploadPath = path.join(__dirname, '/public/static/img');


        let files = [];


        try {
            if (req.files && req.files!==null) {
                files = req.files.placeimage
                console.log("from req.files", files.length)
                if (files.length > 0) {
                    for (let image of files) {
                        sampleFile = image;
                        sampleFile.mv(path.join(uploadPath, shopid, image.name));
                        console.log("file saved", image.name)
                    }
                }
                else {

                    files.mv(path.join(uploadPath, shopid, files.name));
                    console.log("file saved", files.name)
                }
            }

        } catch (error) {
            console.log(error)
        }


        try {
            let result2 = fs.readdirSync(path.join(uploadPath, shopid))
            if (result2) {
                result.images = result2
                result.save()
                console.log("from read dir", result2)
            }
        }
        catch (error) {
            console.log("error in reading file", error)
        }












        res.json({
            status: 200,
            success: 'Place Details Successfully Updated.',

        });

    })


})


app.post('/api/mysaveplace', async function (req, res) {
        let wantmyplace=req.body.mysaveplace
        let orderBy = ["owner", "giver_name", "title", "contact_no", "whatapp_no", "place_size", "price_pm",
        "description", "address", "zip_code", "city", "state", "country", "images", "date"]
        
        console.log(req.body)
        let mysavedplaces=[]
        
        for(let place of wantmyplace){
            
            
            try {
                // let savedobj={}
                 let places = await UserPlace.findOne({_id:place},orderBy)
                //  savedobj[place]=places

                  mysavedplaces.push(places)
            } catch (error) {
                console.log("there is some error",error)
            }
           
            
        }
        res.json({status:200,mysavedplaces}) 

})




app.post('/api/rentedshop', async function (req, res) {
    let pageLenght=3
    let myquery = req.body.formfilter;
    console.log(myquery)
    let orderBy = ["owner", "giver_name", "title", "contact_no", "whatapp_no", "place_size", "price_pm",
        "description", "address", "zip_code", "city", "state", "country", "images", "date"]
    let AllFilter = []
    let essentialor = []
    let essentialand1 = []
    for (const key in myquery) {
        if (key != "query" && myquery[key] && myquery[key].length > 0 && key!="sort") {

            if (key == "size") {
                // place_size
                let [gt, lt] = myquery[key].split("-")
                let tempobj = {}
                if (gt && gt.length > 0) {
                    tempobj["$gt"] = parseInt(gt) - 1
                }
                if (lt && lt.length > 0) {
                    tempobj["$lt"] = parseInt(lt) + 1
                }
                essentialand1.push({ place_size: tempobj })
            }
            else if (key == "rent") {
                // price_pm
                let [gt, lt] = myquery[key].split("-")
                let tempobj = {}
                if (gt && gt.length > 0) {
                    tempobj["$gte"] = parseInt(gt) 
                }
                if (lt && lt.length > 0) {
                    tempobj["$lte"] = parseInt(lt) 
                }
                essentialand1.push({ price_pm: tempobj })


            }
            else {
                let gh = {}
                gh[key] = myquery[key]
                essentialand1.push(gh)
            }
        }
    }



    
    console.log(essentialand1)
    AllFilter.push({ "$and": essentialand1 })
    if (myquery["query"]) {
        essentialor = [{ title: { $regex: myquery.query } },
        { description: { $regex: myquery.query } },
        { address: { $regex: myquery.query } },
        { place_size: { $regex: myquery.query } },
        { city: { $regex: myquery.query } },
        { state: { $regex: myquery.query } }
        ]
        AllFilter.push({ "$or": essentialor })
    }
  let sort={}
   if (myquery["sort"]) {
      console.log(myquery["sort"])
      sort=myquery["sort"]=="lowprice"?{price_pm:1}:myquery["sort"]=="highprice"?{price_pm:-1}:myquery["sort"]=="highplace"?{place_size:-1}:myquery["sort"]=="lowplace"?{place_size:1}:myquery["sort"]=="new"?{date:-1}:null
      console.log(sort)
   }


    // console.log(AllFilter)
    try {
        let placesSize=0;
        if(req.body.page){
            placesSize= await UserPlace.countDocuments({ $or: AllFilter}, orderBy)
        }

        let skip=req.body.pageno || 0
        skip=skip*pageLenght
         
        let places = await UserPlace.find({ $or: AllFilter}, orderBy).skip(skip).limit(pageLenght).sort(sort)
        
        console.log(places)
        res.json({ status: 200, resultlength: Math.ceil(placesSize/pageLenght), places })
    } catch (err) {
        res.json({ error: "Interal Server Error" })
    }




})






app.delete("/api/auth/dshop/:shopid", async function (req, res) {
    let shopid = req.params.shopid;
    let userId = authuser(req.headers.token)
    UserPlace.findOneAndDelete({ $and: [{ _id: shopid }, { owner: userId }] }, function (err, result) {

        if (result) {

            fs.readdir(path.join(__dirname, "public/static/img", shopid), function (err, files) {
                console.log(files)
                if (files) {
                    files.forEach((file) => {
                        fs.unlink(path.join(__dirname, "public/static/img", shopid, file), function (err) {
                            if (err) {
                                console.log("error in deleting image", err)
                            } 

                        })
                    })


                    fs.rmdir(path.join(__dirname, "public/static/img", shopid), function (err) {
                        if (err) {
                            console.log("error in delete dir")
                        }

                    })
                }
            })

            console.log("after readdir")
            res.json({ status: 200, succes: "Succesfully Deleted" })

        }
        else {
            res.json({ error: "Internal Error" })
        }

    })
})










// app.delete("/api/auth/dshop/:shopid", async function (req, res) {
//     let shopid = req.params.shopid;
//     let userId = authuser(req.headers.token)
//     try {
//         let place = await UserPlace.findOne({ _id: shopid })
//         console.log(place)
//         if (place && place !== null) {
//             if (place.owner == userId) {

//                 let delplace = await UserPlace.findByIdAndDelete(shopid)
//                 fs.readdir(path.join(__dirname, "public/static/img", shopid), function (err, files) {
//                     console.log(files)
//                 })
//                 res.json({ status: 200, succes: "Succesfully Deleted" })
//             }
//             else {
//                 res.json({ error: "Not Found" })
//             }

//         }
//         else {
//             res.json({ error: "Not Found" })
//         }

//     } catch (error) {
//         res.json({ error: "Server Error" })
//     }
// })


app.post("/api/auth/myshops", function (req, res) {
    let userId = authuser(req.headers.token)
    let orderBy = ["giver_name", "title", "contact_no", "whatapp_no", "place_size", "price_pm",
        "description", "address", "zip_code", "city", "state", "country", "images", "date"]

    try {


        UserPlace.find({ owner: userId }, orderBy, function (err, result) {

            if (result) { res.json({ status: 200, places: result }) }
            else {
                res.json({ error: 'You have Not Add Place For Rent' })
            }

        })
    } catch (error) {
        res.status(500).send("Server Error")
    }

})



app.get("/api/auth/mychats", async function (req, res) {


    let me = authuser(req.headers.token)



    let Allchat = []
    let helplist = []
    let mychats = await privatemessages.find({ $or: [{ sender: me }, { reciever: me }] }, ["sender", "reciever", "message", "dateTime"])

    mychats.forEach((chat) => {
        if (chat.reciever != me) {
            if (helplist.includes(chat.reciever)) {

                Allchat[helplist.indexOf(chat.reciever)] = { userid: chat.reciever, message: chat.message, time: chat.dateTime }



            }
            else {

                helplist.push(chat.reciever)
                Allchat.push({ userid: chat.reciever, message: chat.message, time: chat.dateTime })
            }

        }


        if (chat.sender != me) {

            if (helplist.includes(chat.sender)) {
                Allchat[helplist.indexOf(chat.sender)] = { userid: chat.sender, message: chat.message, time: chat.dateTime }


                console.log("all chck 1")
            }
            else {
                helplist.push(chat.sender)
                Allchat.push({ userid: chat.sender, message: chat.message, time: chat.dateTime })
            }

        }
    })


    let chat = []
    delete helplist
    for (const myvalue of Allchat) {
        try {
            let unseen = await privatemessages.countDocuments({ $and: [{ reciever: me }, { sender: myvalue.userid }, { seen: false }] })

            let cuser = await User.findOne({ _id: myvalue.userid }, "name")
            console.log("unseen messages send by ", cuser.name, unseen)
            let authToken = jwt.sign(myvalue.userid, "manishpawlikhurd@gmail.com")

            chat.push({ username: cuser.name, ...myvalue, unseen, userid: authToken })
        } catch (error) {

        }

    }


    res.json({ chat })
})

app.post("/api/auth/mymessage", function (req, res) {
    pmess = privatemessages({
        ...req.body.mymessage
    })
    pmess.save()
    res.send("succefully send")
})

app.post("/api/auth/chatmessage", function (req, res) {

})


var onlineuser = {}

io.on('connection', (socket) => {

    socket.on("connected", data => {
        let me = authuser(data.token)

        if (!onlineuser[me]) {
            onlineuser[me] = socket.id
        }
        console.log('connected', socket.id)


    })

    socket.on("mymessage", async function (data) {
        let me = authuser(data.me)
        let friend = tokenToId(data.friend)
        let sendChatmessage = []
        privatemessages.updateMany({ $and: [{ sender: friend }, { reciever: me }] }, { $set: { seen: true } }, function (err, res) {
            if (err) {
                console.log("some error")
            }
            console.log(res)
        })
        let Allchatmessage = await privatemessages.find({ $and: [{ $or: [{ sender: me }, { reciever: me }] }, { $or: [{ sender: friend }, { reciever: friend }] }] }, ["sender", "reciever", "message", "dateTime"])
        Allchatmessage.forEach((mess) => {
            if (mess.sender == me) {
                sendChatmessage.push({ send: mess.message, timestamp: mess.dateTime })
            }
            else {
                sendChatmessage.push({ recieve: mess.message, timestamp: mess.dateTime })
            }
        })
        socket.emit("yourmessage", sendChatmessage)
    })

    socket.on("saygreet", data => {
        console.log(data)

        let sender = authuser(data.sender)
        let reciever = data.reciever
        let greetings = "Hi Sir/Madam , I Am Interested To Taking Your Place on Rent. Please ,Reply me"
        console.log(reciever)
        let makemessage = privatemessages({



            sender: sender,
            reciever: reciever,
            message: greetings

        })
        makemessage.save()
        console.log(reciever, onlineuser)
        socket.to(onlineuser[reciever]).emit("messageRecieve", { message: greetings })
    })

    socket.on("messageSend", data => {
        console.log(data)
        let sender = authuser(data.sender)
        let reciever = tokenToId(data.reciever)
        console.log(reciever)
        let makemessage = privatemessages({



            sender: sender,
            reciever: reciever,
            message: data.message

        })
        makemessage.save()
        console.log(reciever, onlineuser)
        socket.to(onlineuser[reciever]).emit("messageRecieve", data)
    })






    socket.on("disconnect", () => {
        console.log("disconnect", socket.id)
        for (const user in onlineuser) {
            if (onlineuser[user] == socket.id) {
                delete onlineuser[user]
                break;
            }

        }
    })






});




server.listen(1337, () => {
    console.log('listening on *:1337');
});

