const express = require("express");
const path = require("path");
const axios = require("axios")
// const audioURL = "https://bit.ly/3yxKEIY"
const APIKey = "7d823a3e6ffe44f29465aabf105aadc8"
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const fs = require('fs');
const multer = require('multer');
const upload = multer();
const stream = require('stream');
const { Readable } = require('stream');
const {response} = require("express");
const refreshInterval = 5000




const app = express();
let audioURL;
let audioBuffer;

app.use(express.static(path.join(__dirname,"public")));

// app.get("/",(req,res)=>{
//     res.sendFile("index.html")
// })

app.listen(5100,()=>{
    console.log("App Started");
})

app.use(bodyParser.json());

// Upload audio file to remote server (AWS)
// Set your AWS credentials and S3 bucket region
AWS.config.update({
    accessKeyId: 'AKIAXHX7F43KQ6P6I2U2',
    secretAccessKey: '7Uddh8TYgYdkjRi8ecKpRZD+Y4zu6pc6+DXkOUnk',
    region: 'eu-north-1'
});

app.post('/api/data', upload.single('audio'),(req, res) => {
    audioBuffer = req.file.buffer;
    const audioBlob = new Blob([audioBuffer])
    // console.log(req);
    console.log('Received file info:', audioBlob);
    audioBlob.type = "audio/mp3"
    // Process the URL as needed
    res.send('MP3 file received successfully!');
    console.log('Received Blob Size:', audioBlob.size);
    // Create an S3 instance
    const s3 = new AWS.S3();

    // Convert blob to stream
    // function blobToStream(blob) {
    //     const buffer = Buffer.from(blob, 'base64');
    //     const readable = new Readable();
    //     readable._read = () => {
    //     };
    //     readable.push(buffer);
    //     readable.push(null);
    //     return readable;
    // }


    // const audioStream = blobToStream(audioBlob)
    // const audioStream = await audioBlob.stream();
    // console.log(audioStream)
    // const audioBuffer1 = audioBlobToBuffer(audioBlob);

    // Set S3 upload parameters
    const uploadParams = {
        Bucket: 'voicepen',
        Key: 'audio12.mp3',
        Body: audioBlob,
        ContentType: 'audio/mp3',
        ACL: 'public-read' // Make the uploaded file public
    };

    // Upload the file to S3
    s3.upload(uploadParams, (err, data) => {
        if (err) {
            console.error('Error uploading file:', err);
        } else {
            console.log('File uploaded successfully. Public URL:', data.Location);
            // getTranscript(data.Location)
            //     .then(response => response.text())
        }
    });

});



// app.post('/api/data/url', (req, res) => {
//     let mp3FileUrl = req.query.url;
//     // mp3FileUrl = mp3FileUrl.substring(5)
//     console.log('Received MP3 file URL:', mp3FileUrl);
//     // Process the URL as needed
//     res.send('MP3 file URL received successfully!');
//
//     const uploadUrl = uploadOnServer("../test.mp3");
//     getTranscript(uploadUrl);
// });
//
// const baseUrl = 'https://api.assemblyai.com/v2'
//
// const headers = {
//     authorization: '7d823a3e6ffe44f29465aabf105aadc8'
// }

// var uploadOnServer = async (mp3FileUrl) => {
//     const path = '../test.mp3';
//     const audioData = await fs.readFile(path)
//     const uploadResponse = await axios.post(`${baseUrl}/upload`, audioData, {
//         headers
//     })
//     const uploadUrl = uploadResponse.data.upload_url
//     return uploadUrl;
// }

const assembly = axios.create({
    baseURL: "https://api.assemblyai.com/v2",
    headers: {
        authorization: APIKey,
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


