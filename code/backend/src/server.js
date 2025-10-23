import express from "express"
import { connectDB } from "./config/db.js"
import dotenv from "dotenv"

import pathologistRoutes from "./routes/pathologistRoutes.js"
import doctorRoutes from "./routes/doctorRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"

dotenv.config();

const app = express();

connectDB();

app.use("/api/pathologist", pathologistRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/admin", adminRoutes);



app.listen(5001, ()=>{
    console.log("Server started on port 5001");
})

//
//2h2lSmoIExtE3byZ

//mongodb+srv://trial_user:2h2lSmoIExtE3byZ@cluster0.4na7c1n.mongodb.net/?appName=Cluster0