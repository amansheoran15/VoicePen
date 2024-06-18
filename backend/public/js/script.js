const record = document.querySelector("#record");
const stop = document.querySelector("#stop");
const soundClip = document.querySelector("#sound-clip");
const controls = document.querySelector("#controls");
const time = document.querySelector("#time");
const transcribe = document.querySelector("#transcribe");
const submitBtn = document.querySelector("#submit-audio");
const summarize = document.querySelector("#summary");
let transcribedText = document.querySelector("#transcribed-text");
let summarizedText = document.querySelector("#summarized-text");

let audioRecordStartTime;
let elapsedTimeTimer;
let audioURL;
let blob;   //Blob to store audio recording

//When audio file is chosen to be uploaded, load the filename onto the page and enable the upload button
$("#choose-file").change(function() {
    filename = this.files[0].name;
    console.log(filename);
    $('#file-name').text(filename);
    $('#submit-audio').removeAttr("disabled");
});

//If microphone is connected to the system
if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
    console.log("Media supported");
    navigator.mediaDevices
        .getUserMedia(
            {
                audio: true,
            },
        )
        .then((stream) => {
            const mediaRecorder = new MediaRecorder(stream);

            //To start recording
            record.onclick = () => {
                soundClip.innerHTML = ""
                mediaRecorder.start();
                console.log("Recording started");
                console.log(mediaRecorder.state);
                transcribe.setAttribute("disabled","")
                time.removeAttribute("hidden");
                stop.removeAttribute("disabled");
                record.setAttribute("disabled","");

                //To display timer of recording
                audioRecordStartTime = new Date();
                handleElapsedRecTime();
            }

            //To stop recording
            stop.onclick = () =>{
                mediaRecorder.stop();
                console.log("Recording stopped");
                console.log(mediaRecorder.state);
                stop.setAttribute("disabled","");
                record.removeAttribute("disabled");

                //Hide the timer
                clearInterval(elapsedTimeTimer);
                time.setAttribute("hidden","");
            }

            //Push all the binary audio data into chunks
            let chunks = [];
            mediaRecorder.ondataavailable = (e) =>{
                chunks.push(e.data);
            }

            //After recording stops
            mediaRecorder.onstop = (e) => {
                console.log("Recorder Stopped");

                const audio = document.createElement("audio");

                soundClip.appendChild(audio);

                //Create blob with audio chunks and set src of audio tag to url of this blob
                blob = new Blob(chunks, {type : "audio/mp3"});
                chunks = [];
                audioURL = URL.createObjectURL(blob);
                audio.src = audioURL;
                audio.setAttribute("class","custom-audio-player")
                audio.controls = true;
                // audioPlayer.setAttribute("src",audioURL);

                transcribe.removeAttribute("disabled");

            }
        })
        .catch((err) => {
            console.log("The following getUserMedia error occurred: "+err)
        })
}else {
    console.log("getUserMedia not supported on your browser!");
}

//On uploading the audio file from system, make a blob of the audio file and set src of audio to url of blob object
submitBtn.onclick = (e) => {
    e.preventDefault();
    soundClip.innerHTML = "";
    blob = document.querySelector(".uploaded-audio").files[0];
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");

    soundClip.appendChild(audio);
    audio.src = url;
    audio.controls = true;
    transcribe.removeAttribute("disabled");

}

//On clicking transcribe button
transcribe.onclick = () => {
    //Disable the button
    transcribe.setAttribute("disabled","")
    const transcribedPara = document.querySelector("#transcription-textbox");
    transcribedPara.innerText = "";

    //Create a new FormData object and pass audio blob through this object
    const formData = new FormData();
    formData.append('audio', blob, 'audio.mp3');
    console.log('FormData:', formData.get('audio'));

    //Make a post request to transcribe the audio recording
    fetch(`/api/data`, {
        method: 'POST',
        body: formData
    })
        .then((response) => {
            return response.text()
        })
        .then(data => {
            alert("Transcribed successfully!")
            transcribe.removeAttribute("disabled");
            summarize.removeAttribute("disabled")
            const transcript = JSON.parse(data)

            //To remove repeating words in the transcription
            let text = removeConsecutiveDuplicateWords(transcript.text)

            transcribedPara.innerText = text
            transcribedPara.removeAttribute("disabled")

            //Once the recording is transcribed successfully, enable the summarize button
            summarize.removeAttribute("hidden");
            summarize.onclick = () => {
                summarize.setAttribute("disabled","");

                //Again fetch the textarea text so that if user has changed anything in the transcription, summary would be based on the changed text.
                text = transcribedPara.value;
                const summarizedPara = document.querySelector("#summary-textbox")
                summarizedPara.innerText = "";

                //Make a post request to get summary
                fetch('/summary', {
                    method: 'POST',
                    headers: {
                       'Content-Type': 'text/plain'
                    },
                    body: text,


                })
                    .then((response) => {
                        console.log(response.ok)

                        return response.text()
                    })
                    .then(data => {
                        summarize.removeAttribute("disabled");
                        const result = JSON.parse(data)

                        summarizedPara.innerText = result[0].summary_text;
                    })
                alert("Summarizing.. please wait")
            }


        })
        .catch(error => {
            console.error('Error:', error);
        });
    alert("Transcribing... This could take a minute or two, please wait.")

}

//Functions to handle timer starts

function computeElapsedTime(startTime) {
    //record end time
    let endTime = new Date();

    //time difference in ms
    let timeDiff = endTime - startTime;

    //convert time difference from ms to seconds
    timeDiff = timeDiff / 1000;

    //extract integer seconds that dont form a minute using %
    let seconds = Math.floor(timeDiff % 60); //ignoring uncomplete seconds (floor)

    //pad seconds with a zero if neccessary
    seconds = seconds < 10 ? "0" + seconds : seconds;

    //convert time difference from seconds to minutes using %
    timeDiff = Math.floor(timeDiff / 60);

    //extract integer minutes that don't form an hour using %
    let minutes = timeDiff % 60; //no need to floor possible incomplete minutes, becase they've been handled as seconds
    minutes = minutes < 10 ? "0" + minutes : minutes;

    //convert time difference from minutes to hours
    timeDiff = Math.floor(timeDiff / 60);

    //extract integer hours that don't form a day using %
    let hours = timeDiff % 24; //no need to floor possible incomplete hours, becase they've been handled as seconds

    //convert time difference from hours to days
    timeDiff = Math.floor(timeDiff / 24);

    // the rest of timeDiff is number of days
    let days = timeDiff; //add days to hours

    let totalHours = hours + (days * 24);
    totalHours = totalHours < 10 ? "0" + totalHours : totalHours;

    if (totalHours === "00") {
        return minutes + ":" + seconds;
    } else {
        return totalHours + ":" + minutes + ":" + seconds;
    }
}

function handleElapsedRecTime() {
    displayElapsedTime("00:00",time);
    elapsedTimeTimer = setInterval(() => {
        //compute the elapsed time every second
        let elapsedTime = computeElapsedTime(audioRecordStartTime); //pass the actual record start time
        //display the elapsed time
        displayElapsedTime(elapsedTime,time);
    }, 1000); //every second
}

var displayElapsedTime = (elapsedTime,elapsedTimeTag) => {
    elapsedTimeTag.innerHTML = elapsedTime;
}

//Functions to handle timer ends

//to remove repeated words
function removeConsecutiveDuplicateWords(inputString) {
    let words = inputString.split(/\s+/); // Split the input string into words
    let result = [words[0]]; // Initialize the result array with the first word

    for (let i = 1; i < words.length; i++) {
        if (words[i] !== words[i - 1]) {
            // If the current word is not the same as the previous one, add it to the result array
            result.push(words[i]);
        }
    }

    return result.join(" "); // Join the words into a string using space as separator
}



