const  mongoose = require("mongoose");


async function connectDb(){
    try{
        console.log(process.env.MONGO_URI); 
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to MongoDB")
    }    
    catch(err){
        console.error("Error connecting to MongoDB:", err)
    }
    
}

module.exports = connectDb;