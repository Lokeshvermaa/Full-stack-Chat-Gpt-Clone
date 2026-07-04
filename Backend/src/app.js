const express = require("express");
const cookieParser = require("cookie-parser")
const cors = require("cors");


/* Router */
const authRoutes = require("./routes/auth.routes")
const chatRoutes = require("./routes/chat.routes")

const app = express();


/* using middlewares*/
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ['GET','POST', 'PUT', 'DELETE'],
    credentials: true,
  })
)
app.use(express.json());
app.use(cookieParser());

/* Using Routes */
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);


module.exports = app;