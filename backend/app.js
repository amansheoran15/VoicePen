import express from 'express';
import path, {dirname} from 'path';
import axios from "axios";

import fs from 'fs';
import multer from 'multer';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

//Convert blob to mp3
import ffmpeg from 'ffmpeg';
const API_KEY = "7d823a3e6ffe44f29465aabf105aadc8";

const upload = multer();

const refreshInterval = 5000




const app = express();
let audioURL;
let audioBuffer;

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname,"public")));
app.use(express.json());
app.use(express.text());

// app.get("/",(req,res)=>{
//     res.sendFile("index.html")
// })

app.listen(5100,()=>{
    console.log("App Started");
})

const url = 'https://api.assemblyai.com/v2/upload';

app.post('/api/data',upload.single('audio'),async (req, res) => {
    try {
        audioBuffer = req.file.buffer;
        const audioBlobPath = 'audio.mp3';
        fs.writeFileSync(audioBlobPath, audioBuffer);

        let audioPath;
        convertBlobToMP3(audioBlobPath).then((response) => {
            audioPath = response
            console.log("Hello" + audioPath);
            fs.readFile(audioPath.toString(), (err, data) => {
                if (err) {
                    return console.log("Error Occurred" + err);
                }

                const params = {
                    headers: {
                        "authorization": API_KEY,
                        "Transfer-Encoding": "chunked"
                    },
                    body: data,
                    method: 'POST'
                };


                fetch(url, params)
                    .then(response => response.json())
                    .then(async data => {
                        console.log(`URL: ${data['upload_url']}`)
                        getTranscript(data['upload_url']).then((response) => {
                            let transcriptData = response
                            console.log("Transcribed Text: " + transcriptData.data.text)
                            res.send(transcriptData.data);

                        });
                        if (fs.existsSync(audioPath)) {
                            fs.unlink(audioPath, (err) => {
                                if (err) {
                                    console.error('Error deleting file:', err);
                                } else {
                                    console.log('File deleted successfully');
                                }
                            });
                            fs.unlink(audioBlobPath, (err) => {
                                if (err) {
                                    console.error('Error deleting file:', err);
                                } else {
                                    console.log('File deleted successfully');
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
        })





    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})





const assembly = axios.create({
    baseURL: "https://api.assemblyai.com/v2",
    headers: {
        authorization: API_KEY,
        "content-type": "application/json",
    },
})

const getTranscript = async (audioURL) => {

    return new Promise(async (resolve, reject) => {
        const response = await assembly.post("/transcript", {
            audio_url: audioURL,
            disfluencies: false,
            format_text: true,
            summarization: true,
            summary_model: 'informative',
            summary_type: 'bullets_verbose'
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

app.post('/summary',(req,res)=>{
    const text = req.body;
    console.log(text);
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

const API_TOKEN = "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";

async function query(data) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const result = await response.json();
    return result;
}






