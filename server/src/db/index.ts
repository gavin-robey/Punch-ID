import { connect }  from "mongoose";
import * as dotenv from 'dotenv';

dotenv.config();
const uri = process.env.URI;

if(uri){
    connect(uri).then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.error("Error connecting to MongoDB:", err);
    });
}

