import mongoose from 'mongoose';

const connectToDB = ()=>{
    mongoose.connect(process.env.MONGODB_URI)
        .then((con)=>{
            console.log(`Connected to DB: ${con.connection.host}`);
        })
        .catch((err)=>{
            console.error("Connection failed with error: "+err);
        })
}

export default connectToDB;