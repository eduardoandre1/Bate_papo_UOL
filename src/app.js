import  express  from "express";
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv";
dotenv.config();

// Api construção
const app = express()
app.use(cors())
app.use(express.json())

// Server mongo reading and editing  creation 
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017/test");
let db = mongoClient.db();
mongoClient.connect()
.then(() => {db = mongoClient.db();console.log("server is working")})
.catch((err) => console.log(err.message,"não foi "));

// Api reading 
app.listen(5000,()=>console.log("api is working"))
