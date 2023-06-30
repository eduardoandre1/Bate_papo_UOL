import  express  from "express";
import cors from "cors"
import { MongoClient } from "mongodb"
import dayjs from "dayjs"; 
import Joi from "joi";


//url encrypty
//

// Api construção
const app = express()
app.use(cors())
app.use(express.json())
//

// Server mongo reading and editing by api
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017/test");
let db = mongoClient.db();
mongoClient.connect()
.then(() => {db = mongoClient.db();console.log("server is working")})
.catch((err) => console.log(err.message,"não foi "));
//
app.post("/participants",(req,res)=>{
    const name = req.body
    const validname = Joi.object({
        name: Joi.string().required()
    })
    const valited = validname.validate(name,{ abortEarly: false })
    console.log(valited)
    res.send(valited)
})
app.get("/participants",(req,res)=>{})

app.post("/messages",(req,res)=>{})
app.get("/messages",(req,res)=>{})


// Api reading 
app.listen(5000,()=>console.log("api is working"))
