import  express  from "express";
import cors from "cors";
import { Db, MongoClient } from "mongodb";
import dayjs from "dayjs"; 
import Joi from "joi";
import dotenv from "dotenv";


//url encrypty
dotenv.config()
//

// Api construção
const app = express()
app.use(cors())
app.use(express.json())
//

// Server mongo reading and editing by api
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db ;
mongoClient.connect()
.then(() => {db = mongoClient.db();console.log("server is working")})
.catch((err) => console.log(err.message,"não foi "));
//

// page participantes 
app.post("/participants",async (req,res)=>{
    // entrada
    const name = req.body
    
    
    
    // requisitos de entrada
    const validname = Joi.object({
        name: Joi.string().required()
    })
    const valited = validname.validate(name,{ abortEarly: false })

    if(!valited.error === false || !name){
        console.log(valited.error)
        return res.status(422).send()
    }
    //mensaguem de entrada 
    const moment = new Date()
    const messager ={ 
		from: valited.value.name ,
		to: 'Todos',
		text: 'entra na sala...',
		type: 'status',
		time: `${moment.getHours()}:${moment.getMinutes()}:${moment.getSeconds()}`
    }
    // criar dado do participante 
    const participant = {
        name: valited.value.name ,
        lastStatus: Date.now()}
    // Conferir se não possui outro usuario com este nome 
    try{
        const alreadyHave= await db.collection("participants").findOne({name: valited.value.name})

        if(alreadyHave){
            console.log("já possui este usuário")
            return res.sendStatus(409) 
        }
        db.collection("participants").insertOne(participant)
        db.collection("messages").insertOne(messager)

        return res.sendStatus(201)
    }catch(err){
        return res.status(500).send(err.message);
    }
    

})
app.get("/participants",async (req,res)=>{
    try{ 
        const list_participants = await db.collection("participants").find().toArray()
        console.log(list_participants)
        res.send(list_participants)
    }catch(err){
        res.status(500).send(err)
    }

})
//

//page messages
app.post("/messages",(req,res)=>{})
app.get("/messages",(req,res)=>{})
//

//page status
app.post("/status",(eq,res)=>{})
//

// Api reading 
app.listen(5000,()=>console.log("api is working"))
