const record = document.querySelector("#record");
const stop = document.querySelector("#stop");
const soundClip = document.querySelector("#sound-clip");
const controls = document.querySelector("#controls");
// const audioPlayer = document.querySelector("#audioPlayer");
const time = document.querySelector("#time");

let audioRecordStartTime;
let elapsedTimeTimer;

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

            record.onclick = () => {
                soundClip.innerHTML = ""
                mediaRecorder.start();
                console.log("Recording started");
                console.log(mediaRecorder.state);
                time.removeAttribute("hidden");
                stop.removeAttribute("disabled");
                record.setAttribute("disabled","");

                // controls.appendChild(time);
                audioRecordStartTime = new Date();
                handleElapsedRecTime();
            }
            stop.onclick = () =>{
                mediaRecorder.stop();
                console.log("Recording stopped");
                console.log(mediaRecorder.state);
                stop.setAttribute("disabled","");
                record.removeAttribute("disabled");

                clearInterval(elapsedTimeTimer);
                time.setAttribute("hidden","");
            }

            let chunks = [];
            mediaRecorder.ondataavailable = (e) =>{
                chunks.push(e.data);
            }

            mediaRecorder.onstop = (e) => {
                console.log("Recorder Stopped");

                const audio = document.createElement("audio");

                soundClip.appendChild(audio);

                const blob = new Blob(chunks, {type : "audio/mp3; codecs=opus"});
                chunks = [];
                const audioURL = URL.createObjectURL(blob);
                audio.src = audioURL;
                audio.controls = true;
                // audioPlayer.setAttribute("src",audioURL);

            }
        })
        .catch((err) => {
            console.log("The following getUserMedia error occurred: "+err)
        })
}else {
    console.log("getUserMedia not supported on your browser!");
}


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


