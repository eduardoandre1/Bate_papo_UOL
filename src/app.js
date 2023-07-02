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
.catch((err) => console.log(err.message,"server offline"));
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
    const moment = dayjs().format('HH:mm:ss')
    const messager ={ 
		from: valited.value.name ,
		to: 'Todos',
		text: 'entra na sala...',
		type: 'status',
		time: `${moment}`
    }
    console.log(messager)
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
        await db.collection("messages").insertOne(messager)
        await db.collection("participants").insertOne(participant)
        const list_participants = await db.collection("participants").find().toArray()
        console.log(list_participants)
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
        res.status(500).send(err.message)
    }

})
//

//page messages
app.post("/messages",async (req,res)=>{
    const from = req.headers.user 
    const {to , text , type} = req.body
    const now = dayjs().format('HH:mm:ss')
    const message ={from: from, to: to , text: text , type: type ,time:`${now}`}
    const schema = Joi.object({
        from: Joi.string().required(),
        to: Joi.string().required(),
        text : Joi.string().required(),
        type :Joi.string().required(),
        time: Joi.required()
    })
    const {error} = schema.validate(message);
    if(error !== undefined){
        console.log(error)
        return res.sendStatus(422)
    }
    if(message.type !== "message" && message.type !== "private_message"){
        return res.sendStatus(422)
    } 
    try{
        const alreadyHave= await db.collection("participants").findOne({name: from})
        console.log(from)
        console.log(alreadyHave)
        if(!alreadyHave){
            console.log('no user finded')
            return res.sendStatus(422)
        }
        await db.collection('messages').insertOne(message)
        return res.sendStatus(201)
    }catch(err){ 
        return res.status(500).send(err.message)
    }
    
})
app.get("/messages",async(req,res)=>{
    const limites =!req.query.limit?null:req.query.limit
    console.log(limites)
    const inputs ={user : req.headers.user, limit : limites}
    const schema = Joi.object({
        user: Joi.string().required(),
        limit : Joi.number().min(1).required()
    })
    const {error} = schema.validate(inputs)
    if(error !== undefined && limites !== null){
        console.log(error)
        return res.sendStatus(422)
    }
    try{
        if(!req.query.limit){
            const publics = await db.collection("messages").find({to:"Todos"}).toArray()
            return res.status(200).send(publics)
        }
        const list_mensagens_private = await db.collection("messages").find({$or:[{to:inputs.user},{from:inputs.user},]}).toArray()
        if(list_mensagens_private.length < inputs.limit){
            return res.status(200).send(list_mensagens_private)
        }
        return res.status(200).send(list_mensagens_private.slice(-inputs.limit))
    }catch(err){
        return res.sendStatus(500)
    }
})
//

//page status
app.post("/status",async (req,res)=>{
    const user = req.headers.user
    if(!user){
        return res.sendStatus(404)
    }
    const same_men_new_time = {
        name: user ,
        lastStatus: Date.now()
    }
    try{
        const alreadyHave = await db.collection("participants").findOne({name:user})
        console.log(alreadyHave)
        if(!alreadyHave){
            return res.sendStatus(404)
        }else{
        await db.collection("participants")
        .updateOne({name:user},{$set: same_men_new_time})
        return res.sendStatus(200)
        }
    }catch(err){
        return res.sendStatus(500)
    }

})
//
async function expulseiative(){
    
    try{
        const ten_seconds_later = Date.now() -10000 
        const to_offline = await db.collection("participants").find({lastStatus:{$lte : ten_seconds_later}}).toArray()
        console.log(to_offline)
        to_offline.forEach( async (user) => {
            const moment = dayjs().format('HH:mm:ss')
            const message =
            {
                from: user.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: `${moment}`
            }
            await db.collection('messages').insertOne(message)
            console.log(message)
            await db.collection("participants").deleteOne({_id: user._id})
        });
    }
    catch(err){

    } 
}
setInterval(expulseiative,15000)
// Api reading 
app.listen(5000,()=>console.log("api is working"))
