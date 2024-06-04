import express from "express"
import Student from "./models/studentsmodel.js"
import userattdetails from "./models/usermodel.js"
import parentdetails from "./models/parentmodel.js"

import tokenString from "./utility/build.js"
import jwt from "jsonwebtoken"
import cors from "cors"


const app=express()


app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cors())


const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {    
      jwt.verify(authHeader, tokenString, (err, username) => {
        if (err) {
          return res.sendStatus(403);
           }  
        else{
          
          if(Object.keys(username).length>0 && username.name!==undefined && username!==undefined)
            {
            // console.log(username.uid);
            req.headers.uid=username.uid
            }
            next();
          }
      });
    } else {
      res.sendStatus(401);
    }
  };

  
// ----------------------------------ADMIN ROUTES--------------------------------------------//

app.get('/',(req,res)=>res.send('hello'))

// -------------login user-----------------
app.post('/api/usr_login', async (req, res) => {
    try{
      
        const { name, password } = req.body;
        
        const user= await userattdetails.findOne({name, password})
        if(user){
            const role=user.role;
            const uid=user.uid;
            const token = jwt.sign({ name,uid }, tokenString);
          return  res.status(201).json({ msg: 'Success',token,role,name }); 
        }

        const user2 = await parentdetails.findOne({ name, password });
        if (user2) {
            const { role, uid} = user2;
            const token = jwt.sign({ name, uid }, tokenString);
            return res.status(201).json({ msg: 'Success', token, role,user2 });
        }


        return res.status(401).json({msg:"Plz Enter Correct Details!!"})
    }
    catch(err){
        console.log(err);
        res.status(500).json({msg:"Server Error"});
      }
  }); 



//------------------------to fetch students by class name---------------------------//
app.get("/api/adm_getStuList_byClass/:className",authenticateJwt, async (req, res) => {
    try {
        // console.log('gii');
        const {className} = req.params;
            console.log(className);
        if(!className || className=="Select Class")
        return res.status(401).json({msg:"No Class Selected"})

        const studentsByClass = await Student.find({ className });
         if (!studentsByClass || studentsByClass.length === 0) {
            return res.status(401).json({ msg: `No students found for class ${className}` });
        }

        res.status(200).json({msg:studentsByClass});
    } 
    catch (err) 
    {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch students by class name" });
    }
});


//------------------------adding students---------------------------//
app.post("/api/adm_addStudent",authenticateJwt, async (req, res) => {
    try {
        let monthname=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        let { name, className, doj,feescycle, subjects } = req.body;
        // console.log(req.body);
        if (!name || !className || !doj || !subjects || !feescycle || subjects.length === 0) {
            return res.status(401).json({ msg: "Please send correct details" });
        }
        
        const user=await Student.findOne({name,className})

        if(user)
        return res.status(401).send({msg:'Student Already Exists!!!'}) 


        const startMonth = new Date(doj).getMonth() + 1;
        const startYear = new Date(doj).getFullYear();
        const feesArray = [];
        const att = [];

        if(startMonth<=3)
        {
            for (let month = 1; month <= 3; month++) 
            {

                feesArray.push({
                    month: monthname[month-1].toString(),
                    status: "",
                    paymentDate: ""
                });
            } 
            
            subjects.forEach(subject => {
                const months = [];
                for (let month = 1; month <= 3; month++) {
                    const days = [];
                    const daysInMonth = new Date(startYear, month, 0).getDate();
                    for (let day = 1; day <= daysInMonth; day++) {
                        days.push({
                            day: day.toString(),
                            status: "N/A"
                        });
                    }
                    months.push({
                        month: monthname[month-1].toString(),
                        days: days,
                        t1: "", 
                        t2: "", 
                        t3: ""  
                    });
                }
                att.push({
                    subject: subject,
                    months: months
                });
            });
        }
        else
        {
            for (let month = startMonth; month <= 12; month++) {
                feesArray.push({
                    month: monthname[month-1].toString(),
                    status: "",
                    paymentDate: ""
                });
            }
            for (let month = 1; month <= 3; month++) {
                feesArray.push({
                    month: monthname[month-1].toString(),
                    status: "",
                    paymentDate: ""
                });
            }
    
            subjects.forEach(subject => {
                const months = [];
                for (let month = startMonth; month <= 12; month++) {
                    const days = [];
                    const daysInMonth = new Date(startYear, month, 0).getDate();
                    for (let day = 1; day <= daysInMonth; day++) {
                        days.push({
                            day: day.toString(),
                            status: "N/A"
                        });
                    }
                    months.push({
                        month: monthname[month-1].toString(),
                        days: days,
                        t1: "", 
                        t2: "", 
                        t3: ""  
                    });
                }
                for (let month = 1; month <= 3; month++) {
                    const days = [];
                    const daysInMonth = new Date(startYear + 1, month, 0).getDate();
                    for (let day = 1; day <= daysInMonth; day++) {
                        days.push({
                            day: day.toString(),
                            status: "N/A"
                        });
                    }
                    months.push({
                        month: monthname[month-1].toString(),
                        days: days,
                        t1: "", 
                        t2: "", 
                        t3: ""  
                    });
                }
                att.push({
                    subject: subject,
                    months: months
                });
            });
        }

        const newStudent = new Student({
            name,feescycle,pid:"",className,fees: feesArray, doj,subjects,att
        });
        await newStudent.save();
        return res.status(201).json({ msg: "Student Saved Successfully" });       
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Student Not Saved" });
    }
});

//------------------------- updating subjects and students details
app.put("/api/adm_updateStu/:id",authenticateJwt, async (req, res) => {
    try {
        let monthname=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

        const { name, className,feescycle, doj, subjects } = req.body;
        
        if (!name || !className || !feescycle || !doj || !subjects || subjects.length === 0) {
            return res.status(404).json({ msg: "Please provide correct details" });
        }

        let student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(400).json({ msg: "Student not found" });
        }

        const currentSubjects = student.subjects;

        const subjectsToRemove = [];
        const subjectsToAdd = [];

        currentSubjects.forEach(subject => {
            if (!subjects.includes(subject)) {
                subjectsToRemove.push(subject);
            }
        });

        subjects.forEach(subject => {
            if (!currentSubjects.includes(subject)) {
                subjectsToAdd.push(subject);
            }
        });

        subjectsToRemove.forEach(async subject => {
            await Student.updateOne(
                { 
                    _id: req.params.id 
                },
                { 
                    $pull: 
                    { 
                        att: 
                        { 
                            subject: subject 
                        } 
                    } 
                }
            );
        });

        // Add new subjects to att array
        subjectsToAdd.forEach(async subject => {
            const startMonth = new Date(doj).getMonth() + 1;
            const startYear = new Date(doj).getFullYear();
            const months = [];

            if (startMonth <= 3) {
                for (let month = 1; month <= 3; month++) {
                    const days = [];
                    const daysInMonth = new Date(startYear, month, 0).getDate();
                    for (let day = 1; day <= daysInMonth; day++) {
                        days.push({
                            day: day.toString(),
                            status: "N/A"
                        });
                    }
                    months.push({
                        month: monthname[month-1].toString(),
                        days: days,
                        t1: "", 
                        t2: "", 
                        t3: ""  
                    });
                }
            } else {
                for (let month = startMonth; month <= 12; month++) {
                    const days = [];
                    const daysInMonth = new Date(startYear, month, 0).getDate();
                    for (let day = 1; day <= daysInMonth; day++) {
                        days.push({
                            day: day.toString(),
                            status: "N/A"
                        });
                    }
                    months.push({
                        month: monthname[month-1].toString(),
                        days: days,
                        t1: "", 
                        t2: "", 
                        t3: ""  
                    });
                }
                for (let month = 1; month <= 3; month++) {
                    const days = [];
                    const daysInMonth = new Date(startYear + 1, month, 0).getDate();
                    for (let day = 1; day <= daysInMonth; day++) {
                        days.push({
                            day: day.toString(),
                            status: "N/A"
                        });
                    }
                    months.push({
                        month: monthname[month-1].toString(),
                        days: days,
                        t1: "", 
                        t2: "", 
                        t3: ""  
                    });
                }
            }

            await Student.updateOne(
                { 
                    _id: req.params.id 
                },
                { 
                    $push: 
                    { 
                        att: 
                        { 
                            subject,
                            months
                        } 
                    } 
                }
            );
        });

        await Student.updateOne(
            { 
                _id: req.params.id 
            },
            { 
                $set: 
                { 
                    name, 
                    feescycle,
                    className, 
                    doj, 
                    subjects 
                } 
            }
        );

        return res.status(200).json({ msg: "Student updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Error updating student" });
    }
});

//-----------------------------Deleting students-----------------------------// 
app.delete("/api/adm_delStu/:_id",authenticateJwt, async (req, res) => {
    try {
        const {_id} = req.params;
      

        if(!_id )
        return res.status(401).json({ msg: "Student Not found" });

        
        const deleteStudent = await Student.findOneAndDelete({_id });

        if (!deleteStudent) {
            return res.status(401).json({ msg: "No students deleted" });
        }

        res.status(200).json({msg:"Student Deleted Succesfully"});
    } 
    catch (err) 
    {
        console.error(err);
        res.status(500).json({ msg: "Failed to delete student" });
    }
});



// we are fetching progress report for all the subjects for the specific student for specific month only
app.get("/api/adm_getStuProgress_byIdAndMonth/:_id/:month",authenticateJwt, async function (req, res) {
    try 
    {
        let { _id, month} = req.params;
         
        if (!_id||!month) 
        {
            return res.status(401).json({ msg: "Please send correct details" });
        }
        let student = await Student.findOne({_id});
        const monthDataExists = student.att.find(subject => 
            subject.months.find(item => item.month === month)
        );

        if (!monthDataExists) {
            return res.status(404).json({ msg: `Data not found for month ${month}` });
        }
        if (student) 
        {
            const studentData = 
            {
                id: student._id,
                name: student.name,
                subjects: []
            };

            for (let i = 0; i < student.att.length; i++) 
            {
                const subject = student.att[i];
                const subjectData = {
                    subject: subject.subject,
                    months: []
                };

                for (let j = 0; j < subject.months.length; j++) 
                {
                    const month = subject.months[j];
                    if (month.month === req.params.month) {
                        subjectData.months.push({
                            month: month.month,
                            t1: month.t1 || "",
                            t2: month.t2 || "",
                            t3: month.t3 || ""
                        });
                    }
                }

                studentData.subjects.push(subjectData);
            }

            return res.status(200).json({msg:studentData});
        } 
          
        return  res.status(401).json({ msg: [] });
        
    } 
    catch (e) 
    {
        console.log(e);
        res.status(500).json({ msg: "Server Error" });
    }
});


// updating marks for specific subject for specific month and for specific student
app.put("/api/adm_updateStuProgress_byIdMonthAndSub/:_id/:month/:subject",authenticateJwt, async function (req, res) {
    try {
        const { _id, month, subject } = req.params;
        const { t1, t2, t3 } = req.body;

        if (!_id || !month || !subject) {
            return res.status(401).json({ msg: "Please provide correct details" });
        }

        const updatedStudent = await Student.findOneAndUpdate(
            { 
                _id,
                "att.subject": subject,
                "att.months.month": month 
            },
            {
                $set: {
                    "att.$.months.$[monthFilter].t1": t1,
                    "att.$.months.$[monthFilter].t2": t2,
                    "att.$.months.$[monthFilter].t3": t3
                }
            },
            {
                new: true,
                arrayFilters: [
                    { "monthFilter.month": month }
                ]
            }
        );

        if (!updatedStudent) {
            return res.status(404).json({ msg: "Student not found or month not found or subject not found" });
        }

        const updatedMonth = updatedStudent.att.find(att => att.subject === subject).months.find(m => m.month === month);
        const updatedData = {
            name: updatedStudent.name,
            subject: subject,
            month: month,
            t1: updatedMonth.t1,
            t2: updatedMonth.t2,
            t3: updatedMonth.t3
        };
        // console.log(updatedData);

        return res.status(200).json({ msg: "Student progress updated successfully", updatedData });
    } 
    catch (e) 
    {
        console.log(e);
        return res.status(500).json({ msg: "Server Error" });
    }
});



// we are fetching attendance for specific month and specific subject for particular student
// app.get("/api/adm_getStuAtt_byIdMonthAndSub/:subject/:month/:classname",authenticateJwt, async (req, res) => {
//     let monthname=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
//     try {
//         const { subject, month,classname} = req.params;
        

//         if(!subject||!month ||!classname )
//         {
//             return res.status(401).json({ msg: "Please send correct details" });
//         }

//         const currentdate=new Date(month)
    
//         const getmonth=currentdate.getMonth()
//         const getday=currentdate.getDate()
//         // console.log(getmonth);
//         // console.log(monthname[getmonth]);

//         const attendance = await Student.find(
//             {
//                 "att.subject": subject,
//                 "className": classname,
//                 "att.months.month":monthname[getmonth]
//             },
//             {
//                 "name": 1,
//                 "feescycle": 1,
//                 "className": 1,
//                 "att.$": 1
//             }
//         );
    
//         if (!attendance || attendance.length === 0) {
//             return res.status(404).json({ msg: `Attendance data not found for subject ${subject}, month ${month}, and classname ${classname}` });
//         }

       
        
//         const studentAttendanceData = attendance.map(student => {
//             const subjectData = student.att.find(item => item.subject === subject);
//             const monthData = subjectData.months.find(item => item.month === monthname[getmonth]);
//             console.log(monthData);
//             const daydata=monthData.days.find(item=>item.day==getday.toString())

//             if (monthData) {
//                 return {
//                     _id:student._id,
//                     name: student.name,
//                     feescycle: student.feescycle,
//                     className: student.className,
//                     subject: subject,
//                     month: monthData.month,
//                     days: daydata
//                 };
//             } else {
//                 return null;
//             }
//         }).filter(item => item !== null);
        
//         console.log(studentAttendanceData);

//         if (studentAttendanceData.length === 0) {
//             return res.status(404).json({ msg: `Attendance data not found for month ${month}` });
//         }

//         return res.status(200).json({msg:studentAttendanceData});
//     } 
//     catch (err) 
//     {
//         console.error(err);
//         res.status(500).json({ msg: "Failed to fetch student attendance" });
//     }
// });


app.get("/api/adm_getStuAtt_byIdMonthAndSub/:subject/:month/:classname", async (req, res) => {
    try {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const { subject, month, classname } = req.params;

        if (!subject || !month || !classname) {
            return res.status(401).json({ msg: "Please send correct details" });
        }

        const currentDate = new Date(month);
        if (isNaN(currentDate)) {
            return res.status(401).json({ msg: "Invalid month format" });
        }

        const getMonth = currentDate.getMonth();
        const getDay = currentDate.getDate();

        const attendance = await Student.find(
            {
                "att.subject": subject,
                "className": classname,
                "att.months.month": monthNames[getMonth]
            },
            {
                "name": 1,
                "className": 1,
                "att.subject": 1,
                "att.months": 1
            }
        );

        // console.log(attendance);
        if (!attendance || attendance.length === 0) {
            return res.status(401).json({ msg: `Attendance Data Not Found` });
        }

        const studentAttendanceData = attendance.map(student => {
            const subjectData = student.att.find(item => item.subject === subject);
            if (!subjectData) return null;

            const monthData = subjectData.months.find(item => item.month === monthNames[getMonth]);
            if (!monthData) return null;

            const dayData = monthData.days.find(item => item.day == getDay.toString());
            if (!dayData) return null;

            return {
                _id: student._id,
                name: student.name,
                subject: subject,
                className: student.className,
                attendance: dayData
            };
        }).filter(item => item !== null);

        if (studentAttendanceData.length === 0) {
            return res.status(401).json({ msg: `Attendance Data Not Found` });
        }

        return res.status(200).json({msg:studentAttendanceData});
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch student attendance" });
    }
});




app.get("/api/adm_getstuSubjects/:_id",authenticateJwt, async (req, res) => {

    try {
        const {_id} = req.params;
      
        if(!_id )
        return res.status(401).json({ msg: "No Student Found" });

        
        const student = await Student.findById({_id });

        if (!student) {
            return res.status(401).json({ msg: "No Student Found" });
        }


        res.status(200).json({msg:student.subjects});
    } 
    catch (err) 
    {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch student attendance" });
    }
});

// we are updating multiple days with different status 
app.put("/api/adm_updateStuAttDays_byIdMonthAndSub/:subject/:month/:classnm",authenticateJwt, async (req, res) => {
    let monthname=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    try {
        const { subject, month, classnm } = req.params;
        let { daysToUpdate } = req.body;

      

    //    daysToUpdate = JSON.parse(daysToUpdate);

        
        if (!subject || !month || !classnm || !daysToUpdate || daysToUpdate.length === 0) {
            return res.status(401).json({ msg: "Please provide correct details including an array of days to update" });
        }

        if (typeof daysToUpdate === 'string') {
            daysToUpdate = JSON.parse(daysToUpdate);
        }

        const currentdate=new Date(month)
    
        const getmonth=currentdate.getMonth()
        const getday=currentdate.getDate()
        
        for (const studentUpdate of daysToUpdate) {
            const { _id, attendance } = studentUpdate;
                // console.log('studentUpdate',studentUpdate);
            const student = await Student.findById(_id);
            if (!student) {
                return res.status(401).json({ msg: "Student not found" });
            }

            const attendancedat = student.att.find(item => item.subject === subject);

            if (!attendancedat) {
              return  res.status(401).json({ msg: "Attendance data not found" });   
            }

            const monthData = attendancedat.months.find(item => item.month === monthname[getmonth]);

            if (!monthData) {
                res.status(401).json({ msg: "Attendance data not found" });
                return; // Skip to the next student update if the month data is not found
            }

            if (attendance.day.toString() === getday.toString()) {
                const dayToUpdate = monthData.days.find(d => d.day === attendance.day.toString());
                if (dayToUpdate) {
                    dayToUpdate.status = attendance.status;
                } else {
                  return  res.status(401).json({ msg: "Day Not Found" });
                }
            }

            await student.save();
        }

     

        return res.status(200).json({msg:"Attendance updated successfully"});
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to update student attendance" });
    }
});





// fetching fees details for specific month of the specific student
app.get("/api/adm_getStuFees_byIdAndMonth/:_id/:month",authenticateJwt, async (req, res) => {
    try {
        const { _id, month } = req.params;
       
     
        if(!_id||!month)
        {
            return res.status(401).json({ msg: "Please send correct details" });
        }


        const student = await Student.findOne({_id});

        if (!student) {
            return res.status(401).json({ msg: "Student not found" });
        }

        const feesData = student.fees.find(item => item.month === month);

        console.log(feesData);

        if (!feesData) 
        {
            return res.status(401).json({ msg: `Fees data not found for month ${month}` });
        }

        return res.status(200).json({msg:[{
            status: feesData.status,
            feescycle:student.feescycle,
            paymentDate: feesData.paymentDate
        }]});
    } catch (err) 
    {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch student fees" });
    }
});

// updating fees details for specific student for specific month
app.put("/api/adm_updFee_byIdAndMonth/:studentId/:month",authenticateJwt, async (req, res) => {
    try {
        const { studentId, month } = req.params;
       

        const { status, paymentDate } = req.body;
        console.log(req.body);
        if (!studentId || !month || !status || !paymentDate) {
            return res.status(401).json({ msg: "Please send correct details" });
        }

        const updatedStudentFeesDetails = await Student.findOneAndUpdate(
            { _id: studentId, "fees.month": month },
            {
                $set: {
                    "fees.$.status": status,
                    "fees.$.paymentDate": paymentDate, 
                },
            },
            { new: true }//used to return the updated data 
        );

        if (!updatedStudentFeesDetails) {
            return res.status(401).json({ msg: "Student or fee details not found" });
        }

        const updatedFeeDetails = updatedStudentFeesDetails.fees.find(fee => fee.month === month);

        const response = {
            name: updatedStudentFeesDetails.name,
            month: updatedFeeDetails.month,
            status: updatedFeeDetails.status,
            paymentDate: updatedFeeDetails.paymentDate,
        };

        return res.status(200).json({ msg: "Fee details updated successfully", feeDetails: response });
    } 
    catch (err) 
    {
        console.error(err);
        return res.status(500).json({ msg: "Error updating fee details" });
    }
});






// ------------------------PARENT ROUTES---------------------------------------//


// we are fetching progress report for all subjects for that month for specific student
app.get("/api/pr_getStuProgress_byIdAndMonth/:_id/:month",authenticateJwt, async function (req, res) {
    try 
    {
        let { _id, month} = req.params;
      

        if (!_id||!month) 
        {
            return res.status(401).json({ msg: "Please send correct details" });
        }
        let student = await Student.findOne({_id});
        if (student) 
        {
            const studentData = 
            {
                id: student._id,
                name: student.name,
                subjects: []
            };

            for (let i = 0; i < student.att.length; i++) 
            {
                const subject = student.att[i];
                const subjectData = {
                    subject: subject.subject,
                    months: []
                };

                for (let j = 0; j < subject.months.length; j++) 
                {
                    const month = subject.months[j];
                    if (month.month === req.params.month) {
                        subjectData.months.push({
                            month: month.month,
                            t1: month.t1 || "",
                            t2: month.t2 || "",
                            t3: month.t3 || ""
                        });
                    }
                }

                studentData.subjects.push(subjectData);
            }

            return res.status(200).json({msg:studentData});
        } 
          
        return res.status(401).json({ msg: "Data Not Found!" });
        
    } 
    catch (e) 
    {
        console.log(e);
        res.status(500).json({ msg: "Server Error" });
    }
});



app.get("/api/pr_getStuAtt_byIdMonthAndSub/:_id/:month/:subject",authenticateJwt, async (req, res) => {
    try {
        const { _id, subject, month } = req.params;
        

        if(!_id||!subject||!month )
        {
            return res.status(401).json({ msg: "Please send correct details" });
        }

        const student = await Student.findOne({_id});

        if (!student) 
        {
            return res.status(401).json({ msg: "Student not found" });
        }

        const attendance = student.att.find(item => item.subject === subject);

        if (!attendance) {
            return res.status(401).json({ msg: `Attendance data not found for subject ${subject}` });
        }

        const monthData = attendance.months.find(item => item.month === month);

        if (!monthData) {
            return res.status(401).json({ msg: `Attendance data not found for month ${month}` });
        }

        return res.status(200).json({
            name: student.name,
            subject: attendance.subject,
            month: monthData.month,
            days: monthData.days
        });
    } 
    catch (err) 
    {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch student attendance" });
    }
});


// fetching fees details for specific month of the specific student
app.get("/api/pr_getStuFees_byIdAndMonth/:_id/:month",authenticateJwt, async (req, res) => {
    try {
        const { _id, month } = req.params;
        

        if(!_id||!month)
        {
            return res.status(401).json({ msg: "Please send correct details" });
        }

        const student = await Student.findOne({_id});

        if (!student) {
            return res.status(404).json({ msg: "Student not found" });
        }

        const feesData = student.fees.find(item => item.month === month);

        if (!feesData) 
        {
            return res.status(401).json({ msg: `Fees data not found for month ${month}` });
        }

const feesCycle=student.feescycle

        return res.status(200).json({
            month: feesData.month,
            feescycle: feesCycle,
            status: feesData.status,
            paymentDate: feesData.paymentDate
        });
    } catch (err) 
    {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch student fees" });
    }
});



// -------------------------------TEACHER ROUTES------------------------//


// to fetch student on the basis of class and subject 
app.get("/api/pr_getStu_byId/:pid",authenticateJwt, async function (req, res) {
    try {
        let { pid } = req.params;
        if (!pid) {
            return res.status(401).json({ msg: "Please send correct details" });
        }

        let students = await Student.find({ pid }, 'name className _id feescycle subjects');
        if (students.length > 0) {
            return res.status(200).json({msg:students});
        } 
        
        return res.status(401).json({ msg: "Data Not Found!" });
        
    } catch (e) {
        console.log(e);
        res.status(500).json({ msg: "Server Error" });
    }
});

app.get("/api/tch_getStuList_byClassAndSub/:className",authenticateJwt, async (req, res) => {
    try {
        const { className } = req.params;

        const {uid}=req.headers
        // console.log(req.headers.uid);
        if(!uid)
        return res.status(401).json({msg:"Error Occured!"})

        const studentsByClassAndSubject = await Student.find({ className, subjects: uid });

        if (!studentsByClassAndSubject || studentsByClassAndSubject.length === 0) {
            return res.status(401).json({ msg: `No students found for class ${className} and subject ${uid}` });
        }

        res.status(200).json({ msg: studentsByClassAndSubject });
    } 
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch students by class and subject" });
    }
});



// to fetch progress report for specific month and specific subject only for particular student
app.get("/api/tch_getStuProgress_byIdMonthAndSub/:_id/:month",authenticateJwt, async function (req, res) {
    try {
        const { _id, month } = req.params;

        const {uid}=req.headers

        

        if (!_id || !month || !uid) {
            return res.status(401).json({ msg: "Please send correct details" });
        }

        const student = await Student.findById(_id);

        if (!student) {
            return res.status(401).json({ msg: 'No Student Found' });
        }

        const studentData = {
            id: student._id,
            name: student.name,
            subjects: []
        };

        for (let i = 0; i < student.att.length; i++) {
            const att = student.att[i];
            if (att.subject === uid) {
                const subjectData = {
                    subject: att.subject,
                    months: []
                };

                for (let j = 0; j < att.months.length; j++) {
                    const attMonth = att.months[j];
                    if (attMonth.month === month) {
                        subjectData.months.push({
                            month: attMonth.month,
                            t1: attMonth.t1 || "",
                            t2: attMonth.t2 || "",
                            t3: attMonth.t3 || ""
                        });
                    }
                }

                studentData.subjects.push(subjectData);
            }

       
    
        }

        return res.json({ msg: studentData });
    } 
    catch (e) 
    {
        console.log(e);
        res.json({ msg: "Server Error" });
    }
});


//update progress on the basis of month id and subject  
app.put("/api/tch_updateStuProgress_byIdMonthAndSub/:_id/:month",authenticateJwt, async function (req, res) {
    try {
        const { _id, month } = req.params;
        const { t1, t2, t3 } = req.body;


        const {uid}=req.headers

        if (!_id || !month || !uid) {
            return res.status(401).json({ msg: "Please provide correct details" });
        }

        const updatedStudent = await Student.findOneAndUpdate(
            { 
                _id: _id, 
                "att.subject": uid,
                "att.months.month": month 
            },
            {
                $set: {
                    "att.$.months.$[monthFilter].t1": t1,
                    "att.$.months.$[monthFilter].t2": t2,
                    "att.$.months.$[monthFilter].t3": t3
                }
            },
            {
                new: true,
                arrayFilters: [
                    { "monthFilter.month": month }
                ]
            }
        );

        if (!updatedStudent) {
            return res.status(404).json({ msg: "Student not found or month not found or subject not found" });
        }

        const updatedMonth = updatedStudent.att.find(att => att.subject === uid).months.find(m => m.month === month);
        const updatedData = {
            name: updatedStudent.name,
            subject: uid,
            month: month,
            t1: updatedMonth.t1,
            t2: updatedMonth.t2,
            t3: updatedMonth.t3
        };
        // console.log(updatedData);

        return res.status(200).json({ msg: "Student progress updated successfully", updatedData });
    } 
    catch (e) 
    {
        console.log(e);
        return res.status(500).json({ msg: "Server Error" });
    }
});



// we are fetching attendance for specific month and specific subject for particular student
app.get("/api/tch_getStuAtt_byIdMonthAndSub/:month/:className",authenticateJwt, async (req, res) => {
    try {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const { className, month } = req.params;

        const {uid}=req.headers

        if(!className||!uid||!month)
        {
            return res.status(401).json({ msg: "Please send correct details" });
        }

        const currentDate = new Date(month);
        if (isNaN(currentDate)) {
            return res.status(401).json({ msg: "Invalid month format" });
        }

        const getMonth = currentDate.getMonth();
        const getDay = currentDate.getDate();

        const attendance = await Student.find(
            {
                "att.subject": uid,
                "className": className,
                "att.months.month": monthNames[getMonth]
            },
            {
                "name": 1,
                "className": 1,
                "att.subject": 1,
                "att.months": 1
            }
        );

        // console.log(attendance);
        if (!attendance || attendance.length === 0) {
            return res.status(401).json({ msg: `Attendance Data Not Found` });
        }

        const studentAttendanceData = attendance.map(student => {
            const subjectData = student.att.find(item => item.subject === uid);
            if (!subjectData) return null;

            const monthData = subjectData.months.find(item => item.month === monthNames[getMonth]);
            if (!monthData) return null;

            const dayData = monthData.days.find(item => item.day == getDay.toString());
            if (!dayData) return null;

            return {
                _id: student._id,
                name: student.name,
                subject: uid,
                className: student.className,
                attendance: dayData
            };
        }).filter(item => item !== null);

        if (studentAttendanceData.length === 0) {
            return res.status(401).json({ msg: `Attendance Data Not Found` });
        }

        return res.status(200).json({msg:studentAttendanceData});

    } 
    catch (err) 
    {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch student attendance" });
    }
});




// we are updating multiple days with different status 

app.put("/api/tch_updateStuAttDays_byIdMonthAndSub/:month/:className",authenticateJwt, async (req, res) => {
    let monthname=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    try {
        const { className, month } = req.params;
        let { daysToUpdate } = req.body;

        const {uid}=req.headers

        if (!className || !uid || !month || !daysToUpdate || daysToUpdate.length === 0) {
            return res.status(401).json({ msg: "Please provide correct details including an array of days to update" });
        }
        if (typeof daysToUpdate === 'string') {
            daysToUpdate = JSON.parse(daysToUpdate);
        }

        const currentdate=new Date(month)
    
        const getmonth=currentdate.getMonth()
        const getday=currentdate.getDate()
        
        for (const studentUpdate of daysToUpdate) {
            const { _id, attendance } = studentUpdate;
                // console.log('studentUpdate',studentUpdate);
            const student = await Student.findById(_id);
            if (!student) {
                return res.status(401).json({ msg: "Student not found" });
            }

            const attendancedat = student.att.find(item => item.subject === uid);

            if (!attendancedat) {
                return   res.status(401).json({ msg: "Attendance data not found" });
              
            }

            const monthData = attendancedat.months.find(item => item.month === monthname[getmonth]);

            if (!monthData) {
                return   res.status(401).json({ msg: "Attendance data not found" });
               
            }

            if (attendance.day.toString() === getday.toString()) {
                const dayToUpdate = monthData.days.find(d => d.day === attendance.day.toString());
                if (dayToUpdate) {
                    dayToUpdate.status = attendance.status;
                } else {
                    return   res.status(401).json({ msg: "Day Not Found" });
                }
            }

            await student.save();
        }

      

        return res.status(200).json({msg:"Attendance updated successfully"});

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to update student attendance" });
    }
});




const port=1600
app.listen(port,()=>console.log(`server is running in port:`,port))

