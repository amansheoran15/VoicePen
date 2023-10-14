import express from 'express';
import path from 'path';
import axios from "axios";
// const axios = require("axios")
// // const audioURL = "https://bit.ly/3yxKEIY"
// const APIKey = "7d823a3e6ffe44f29465aabf105aadc8"
// const bodyParser = require('body-parser');
// const AWS = require('aws-sdk');
import fs from 'fs';
// const multer = require('multer');
// const upload = multer();
// const stream = require('stream');
// const { Readable } = require('stream');
// const {response} = require("express");
const refreshInterval = 5000




const app = express();
let audioURL;
let audioBuffer;

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname,"public")));

// app.get("/",(req,res)=>{
//     res.sendFile("index.html")
// })

app.listen(5100,()=>{
    console.log("App Started");
})


import dotenv from 'dotenv';
dotenv.config();

// Your code here

import fetch from 'node-fetch';
// const fs = require('fs');
const url = 'https://api.assemblyai.com/v2/upload';

let audioPath = '../test.mp3';
const API_KEY = "7d823a3e6ffe44f29465aabf105aadc8";

fs.readFile(audioPath, (err, data) => {
    if (err) {
        return console.log(err);
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
        .then(data => {
            console.log(`URL: ${data['upload_url']}`)
            getTranscript(data['upload_url'])
        })
        .catch((error) => {
            console.error(`Error: ${error}`);
        });

});

const assembly = axios.create({
    baseURL: "https://api.assemblyai.com/v2",
    headers: {
        authorization: API_KEY,
        "content-type": "application/json",
    },
})

// assembly
//     .post("/transcript", {
//         audio_url: audioURL
//     })
//     .then((res) => console.log(res.data))
//     .catch((err) => console.error(err));

const getTranscript = async (audioURL) => {
    // Sends the audio file to AssemblyAI for transcription
    const response = await assembly.post("/transcript", {
        audio_url: audioURL,
    })

    // Interval for checking transcript completion
    const checkCompletionInterval = setInterval(async () => {
        const transcript = await assembly.get(`/transcript/${response.data.id}`)
        const transcriptStatus = transcript.data.status

        if (transcriptStatus !== "completed") {
            console.log(`Transcript Status: ${transcriptStatus}`)
        } else if (transcriptStatus === "completed") {
            console.log("\nTranscription completed!\n")
            let transcriptText = transcript.data.text
            console.log(`Your transcribed text:\n\n${transcriptText}`)
            clearInterval(checkCompletionInterval)
        }else if(transcriptStatus === "error"){
            clearInterval(checkCompletionInterval)
        }
    }, refreshInterval)
}














// getTranscript(audioURL)


