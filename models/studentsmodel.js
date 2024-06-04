import mongoose from "mongoose"

mongoose.connect("mongodb+srv://abhay:Abhay%40123@cluster0.xowgujp.mongodb.net/studentattendance?retryWrites=true&w=majority")



//--------------------Schema for StudentDetails---------------------//
const studentSchema = new mongoose.Schema({
    name: String,
    feescycle:String,
    className: String,
    pid:String,
    doj: Date,
    subjects: [],
    att: [{
        subject: String,
        months: [{
            month: String,
            t1:String,
            t2:String,
            t3:String,
            days: [{
                day: String,
                status: String  
            }]
        }]
    }],
    fees:[{
month:String,
status:String,
paymentDate:Date

    }
    ]
       

    
});




export default mongoose.model('Student', studentSchema);