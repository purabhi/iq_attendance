import mongoose from "mongoose"
import { type } from "os";

mongoose.connect("mongodb+srv://abhay:Abhay%40123@cluster0.xowgujp.mongodb.net/studentattendance?retryWrites=true&w=majority")


const user_att_details = new mongoose.Schema({
  
    name: {
        type:String,
        required:true
    },
    password: {
        type:String,
        required:true
    },
    role: {
        type:String,
        required:true
    },
    uid:{
        type:String,
        required:true,
    }
},{
        timestamps:true
    })

 


export default mongoose.model("userattdetails", user_att_details);


