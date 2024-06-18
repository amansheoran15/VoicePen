/* Import required libraries */
import express from 'express';
import path, {dirname} from 'path';
import axios from "axios";
import userRouter from "./routers/user.js";
import connectToDB from "./config/database.js";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import fs from 'fs';
import multer from 'multer';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config({path:"./config/.env"});

//Convert blob to mp3
import ffmpeg from 'ffmpeg';
import authenticate from "./middlewares/auth.js";
// import * as bodyParser from "express";


const upload = multer();

const refreshInterval = 5000

connectToDB();


const app = express();
let audioURL;
let audioBuffer;

//To serve pages from public folder
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
// app.use(express.static(path.join(__dirname,"public")));
app.use(express.static("./public"));
app.set('view engine', 'ejs');
app.set('views','./public/views')
app.use(express.json());
app.use(express.text());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/',userRouter);
app.get('/', authenticate,(req,res)=>{
    res.render('index');
})

// const __dirname = dirname(fileURLToPath(import.meta.url));
// app.use(express.static(__dirname+"/public"))

//Loading environment variables
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

//Make server listen on port 3000
app.listen(3000,()=>{
    console.log(`App Started successfully on PORT : 3000`);
})


// AssemblyAI API Upload URL (to upload local audio file to AssemblyAI's server)
const url = 'https://api.assemblyai.com/v2/upload';

//Transcribing Audio File
//upload.single('audio) will process the uploaded file 'audio' and make it available in req.file
app.post('/api/data',upload.single('audio'),async (req, res) => {
    try {
        audioBuffer = req.file.buffer;
        const audioBlobPath = 'audio.mp3';
        fs.writeFileSync(audioBlobPath, audioBuffer); //Will save audioBuffer file on server disk

        let audioPath;

        //To encode binary file into MP3 format
        convertBlobToMP3(audioBlobPath).then((response) => {
            audioPath = response
            console.log("Saved audio at path: " + audioPath);

            //Reading mp3 audio file
            fs.readFile(audioPath.toString(), (err, data) => {
                if (err) {
                    return console.log("Error Occurred" + err);
                }

                const params = {
                    headers: {
                        "authorization": ASSEMBLYAI_API_KEY,
                        "Transfer-Encoding": "chunked"
                    },
                    body: data,
                    method: 'POST'
                };

                //fetch request to upload local audio file onto AssemblyAI's server
                fetch(url, params)
                    .then(response => response.json())
                    .then(async data => {           //If uploaded successfully
                        console.log(`URL: ${data['upload_url']}`)

                        //Transcribe the audio
                        getTranscript(data['upload_url']).then((response) => {
                            let transcriptData = response
                            console.log("Transcribed Text: " + transcriptData.data.text)

                            //Send it back to browser
                            res.send(transcriptData.data);
                        }).catch(err => {       //If getTranscript gets rejected
                            res.send(err);
                        });

                        //Delete the audio files from server disk
                        if (fs.existsSync(audioPath)) {
                            fs.unlink(audioPath, (err) => {
                                if (err) {
                                    console.error('Error deleting file:', err);
                                } else {
                                    console.log(audioPath + ' File deleted successfully');
                                }
                            });
                        } else {
                            console.log('File not found');
                        }

                        if (fs.existsSync(audioBlobPath)) {
                            fs.unlink(audioBlobPath, (err) => {
                                if (err) {
                                    console.error('Error deleting file:', err);
                                } else {
                                    console.log(audioBlobPath + ' File deleted successfully');
                                }
                            });
                        } else {
                            console.log('File not found');
                        }

                    })
                    .catch((error) => {
                        console.error(`Error: ${error}`);
                    });

            });
        }).catch((err)=> {
            console.log(err);
        }) //If convertBlobToMP3 gets rejected

    } catch (error) {       //catch for try block
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

//Using axios to create API request
const assembly = axios.create({
    baseURL: "https://api.assemblyai.com/v2",
    headers: {
        authorization: ASSEMBLYAI_API_KEY,
        "content-type": "application/json",
    },
})


//Function to get Transcript
const getTranscript = async (audioURL) => {

    return new Promise(async (resolve, reject) => {
        const response = await assembly.post("/transcript", {
            audio_url: audioURL,
            disfluencies: false,
            format_text: true
        });

        const checkCompletionInterval = setInterval(async () => {
            try {
                const transcript = await assembly.get(`/transcript/${response.data.id}`);
                const transcriptStatus = transcript.data.status;

                if (transcriptStatus === "completed") {
                    clearInterval(checkCompletionInterval);
                    resolve(transcript);
                } else if (transcriptStatus === "error") {
                    clearInterval(checkCompletionInterval);
                    reject(new Error("Transcription failed"));
                } else {
                    console.log(`Transcript Status: ${transcriptStatus}`);
                }
            } catch (error) {
                clearInterval(checkCompletionInterval);
                reject(error);
            }
        }, refreshInterval);
    });
}


//function to convert binary buffer to mp3
function convertBlobToMP3(audioBlob){
    return new Promise((resolve, reject) => {
        const process = new ffmpeg(audioBlob);
        process.then(function (audio){
                audio.fnExtractSoundToMP3('../audio12.mp3',function (err,file){
                    if(!err){
                        console.log("Audio file: " + file)
                        resolve(file);
                    }
                });
            }, function (err){
                console.log("Error: "+ err);
                reject(err);
            }
        );
    });
}

//Post request to provide summary
app.post('/summary',(req,res)=>{
    const text = req.body;
    query({
        inputs: text,
        options: {
            wait_for_model: true
        }
    }).then((response) => {
        console.log(response);
        res.send(JSON.stringify(response));
    });
})

const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;;

//function to fetch summary using HuggingFace API
async function query(data) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        {
            headers: { Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}` },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const result = await response.json();
    return result;
}






