
let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds){
    if(isNaN(seconds) || seconds < 0){
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;

}


async function getSongs(folder){
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if(element.href.endsWith(".mp3")){
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }


    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li data-filename="${song}"><img class="invert" src="Music.png" alt="">
                <div class="info">
                  <div>${cleanSongName(song)}</div>
                  <div>Daksh</div>
                </div>
                <div class="playnow">
                  <span>Play Now</span>
                  <img src="play_circle.svg" alt="">
                </div></li>`;
    }
    // attach an eventlistener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
    e.addEventListener("click", element => {
        let fileName = e.getAttribute("data-filename");
        playMusic(fileName);
        });
    });

}

const playMusic = (track, pause=false)=>{
    // let audio = new Audio("/songs/" + track)
    currentSong.src = `/${currFolder}/` + track
    if(!pause){

        currentSong.play()
        play.src = "pause_1.svg"
    }
    document.querySelector(".songinfo").innerHTML = cleanSongName(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"

}


function cleanSongName(fileName) {
    // clean useless tags and .mp3
    let name = decodeURIComponent(fileName)
        .replace(/\s*[-–]?\s*\d{3}KBPS\s*/gi, "")
        .replace(/\.mp3$/i, "")
        .trim();

    // Remove exact duplicates split by ' - '
    let parts = name.split(" - ").filter((item, index, arr) => item !== arr[index - 1]);

    return parts.join(" - ");
}

async function displayAlbums() {
    try {
        let a = await fetch(`http://127.0.0.1:5500/songs/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;

        let anchors = div.getElementsByTagName("a");

        Array.from(anchors).forEach(async (e) => {
            if (e.href.includes("/songs/") && !e.href.endsWith(".mp3")) {
                let folder = e.href.replace(/\/$/, "").split("/").pop();

                try {
                    let res = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                    if (!res.ok) throw new Error("info.json not found");
                    let data = await res.json();
                    console.log(`Album "${data.title}" in folder "${folder}"`, data);
                } catch (err) {
                    console.warn(`Skipping ${folder}: ${err.message}`);
                }
                cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="DHH" class="card">
              <div class="play">
                <img src="play_button.svg" alt="" />
              </div>
              <img src="/songs/${folder}/cover.png" alt="" />
              <h2>${response.title}</h2>

              <h5>${response.description}</h5>
            </div>`
            }
        });
    } catch (err) {
        console.error("displayAlbums error:", err);
    }
}


async function main(){
    // Get the list of all the songs
    await getSongs("songs/HH")
    playMusic(songs[0], true)

    //display all the albums on the page
    displayAlbums()




//Attach an event listener to play, next and previous
play.addEventListener("click", ()=>{
    if(currentSong.paused){
        currentSong.play()
        play.src = "pause_1.svg"
    }
    else{
        currentSong.pause()
        play.src = "play_circle.svg"

    }
})

    // timeupdate event
    currentSong.addEventListener("timeupdate", ()=>{
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    //Add an event listner to seekbar
    document.querySelector(".seekbar").addEventListener("click", e=>{
        let percent = (e.offsetX/e.target.getBoundingClientRect().width) * 100; 
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })


    //Add an eventlistener for hamburger
    document.querySelector(".hamburger").addEventListener("click",()=>{
        document.querySelector(".left").style.left = "0"
    })

    //Add an eventlistener for close hamburger
    document.querySelector(".close").addEventListener("click",()=>{
        document.querySelector(".left").style.left = "-120%"
    })

    //Add an evbent listener to previous and next
    previous.addEventListener("click",()=>{
        console.log("Previous clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if((index-1) >= 0){
            playMusic(songs[index-1])
        }
    })
    //Add an evbent listener to previous and next
    next.addEventListener("click",()=>{
        console.log("Next clicked")

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if((index+1) < songs.length){
            playMusic(songs[index+1])
        }
  
    })
    
    //Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change",(e)=>{
        console.log("Setting volume to", e.target.value, "/ 100")
        currentSong.volume = parseInt(e.target.value) / 100
    })

    //loads the playlist folder whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e=>{
        console.log(e)
        e.addEventListener("click", async item=>{
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
            
        })
    })

    let lastVolume = 0.1;

document.querySelector(".volume>img").addEventListener("click", e => {
    const img = e.target;
    
    if (currentSong.volume > 0) {
        lastVolume = currentSong.volume;
        currentSong.volume = 0;
        img.src = "mute.svg";
    } else {
        currentSong.volume = lastVolume;
        img.src = "volume.svg";
    }
});
}

main()