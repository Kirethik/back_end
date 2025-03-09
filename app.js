const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require('dotenv').config();

const { UserCluster, StudentCluster, EventCluster } = require('./DB/models'); // ✅ Import all models
const router = require('./DB/routes'); // ✅ Import routes

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS Config (Ensures Cookies Work)
app.use(cors({
    origin: "https://nss-amrita.vercel.app", // ✅ Update to your frontend URL
    credentials: true
}));

// ✅ Middleware
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());

// ✅ Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Routes
app.use('/api', router);



// ............................................................................................................................. Login
app.post("/api/login", async (req, res) => {
    console.log("📩 Received Request Body:", req.body);

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    try {
        const userCluster = await UserCluster.findOne();
        if (!userCluster) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        const user = userCluster.users.find((u) => u.username === username);
        if (!user) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        console.log("✅ Password Matched!");

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // ✅ Store Token in HTTP-Only Cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // Change to true in production (HTTPS required)
            sameSite: 'lax'
        }).json({ message: "Login Successful" });

    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ Authentication Middleware
const authenticate = (req, res, next) => {
    console.log("🔍 Cookies Received in /api/user:", req.cookies);

    const token = req.cookies.token; // ✅ Token from Cookie
    if (!token) {
        console.log("🚫 No Token Found!");
        return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("🚫 Invalid Token:", err);
            return res.status(403).json({ message: "Invalid Token" });
        }
        req.user = user;
        next();
    });
};

// ✅ Get User Info (Protected Route)
app.get("/api/user", authenticate, (req, res) => {
    res.json({ user: req.user });
});

// ✅ Logout
app.post("/api/logout", (req, res) => {
    res.clearCookie("token").json({ message: "Logged Out" });
});

app.post("/api/roll", (req, res) => {
    const { rollNumber } = req.body;
    if (!rollNumber) {
        return res.status(400).json({ error: "Roll Number is required" });
    }
    console.log("Received Roll Number:", rollNumber);
    res.status(200).json({ message: "Roll Number received successfully" });
});


app.get("/api/attendance", async (req, res) => {
    try {
        const students = await StudentCluster.find();
        const events = await EventCluster.find();

        // Convert event_id -> event_hours mapping
        const eventMap = new Map();
        events.forEach(cluster => {
            cluster.events.forEach(event => {
                eventMap.set(event.event_id, parseInt(event.event_hours, 10));
            });
        });

        // Process each student
        const attendanceData = students.flatMap(student =>
            student.students.map(s => {
                let totalHours = 0;

                // Sum up event hours properly
                s.events_participated.forEach(eventId => {
                    if (eventMap.has(eventId)) {
                        totalHours += eventMap.get(eventId);
                    }
                });

                return {
                    studentName: s.name || "Unknown",
                    totalHours,
                };
            })
        );

        res.json({ attendance: attendanceData });

    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// ✅ Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server Running on Port ${PORT}`);
});
