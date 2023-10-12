const record = document.querySelector("#record");
const stop = document.querySelector("#stop");
const soundClip = document.querySelector("#sound-clip");
// const audioPlayer = document.querySelector("#audioPlayer");

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
                mediaRecorder.start();
                console.log("Recording started");
                console.log(mediaRecorder.state);
                stop.removeAttribute("disabled");
                record.setAttribute("disabled","");
            }
            stop.onclick = () =>{
                mediaRecorder.stop();
                console.log("Recording stopped");
                console.log(mediaRecorder.state);
                stop.setAttribute("disabled","");
                record.removeAttribute("disabled");
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
