let currentSong = new Audio();
let songs;
let currFolder;
let lastArrowKey = null;
let arrowKeyTimeout = null;
let arrowKeyCount = 0;
// const BASE = "http://127.0.0.1:8080/Spotify";
function secondsToMinutesSeconds(seconds)
{
    if (isNaN(seconds) || seconds < 0)
    {
        return "00:00   ";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) 
{
    currFolder = folder;
    let a = await fetch(`/${currFolder}/index.json`)
    let response = await a.json();
    songs = response;
    // let response = await a.text();
    // let div = document.createElement("div")
    // div.innerHTML = response;
    // let as = div.getElementsByTagName("a")
    // songs = []
    // for (let index = 0; index < as.length; index++) 
    // {
    //     const element = as[index];
    //     if (element.href.endsWith(".mp3") || element.href.endsWith(".mpeg") || element.href.endsWith(".mp4")) 
    //     {
    //         songs.push(element.href.split(`/${currFolder}/`)[1])
    //     }
    // }
    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    // Fetch info.json for the current folder to get the author name
    let author = "";
    try 
    {
        let infoRes = await fetch(`/${currFolder}/info.json`);
        if (infoRes.ok) 
        {
            let info = await infoRes.json();
            author = info.author || "";
        }
    } 
    catch (e) 
    {
        author = "";
    }
    for (const song of songs) 
    {
        songUL.innerHTML = songUL.innerHTML + `<li data-filename="${song}">
                                                    <img class="invert" width="34" src="img/music.svg" alt="">
                                                    <div class="info">
                                                        <div>${decodeURIComponent(song).replace(/\.(mp3|mpeg|mp4)$/i, "")}</div>
                                                        <div>${author}</div>
                                                    </div>
                                                    <div class="playnow">
                                                        <span>Play Now</span>
                                                        <img class="invert" src="img/play.svg" alt="">
                                                    </div> 
                                                </li>`;
    }
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => 
    {
        e.querySelector(".playnow").addEventListener("click", event => 
        {
            event.stopPropagation(); // prevent li click
            const filename = e.getAttribute("data-filename");
            if (currentSong.src.includes(filename)) 
            {
                if (currentSong.paused) 
                {
                    currentSong.play();
                    updatePlayIcons(true, filename);
                } 
                else 
                {
                    currentSong.pause();
                    updatePlayIcons(false, filename);
                }
            } 
            else 
            {
                playMusic(filename);
            }
        });
    });
    return songs
}

const playMusic = (track, pause = false) => 
{
    currentSong.src = `/${currFolder}/` + track;
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track).replace(/\.(mp3|mpeg|mp4)$/i, "");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
    const index = songs.indexOf(track);
    updateNextButtonState(index); // update next button availability
    updatePreviousButtonState(index); // update previous button availability
    if (!pause) 
    {
        currentSong.play();
        updatePlayIcons(true, track);
    } 
    else 
    {
        updatePlayIcons(false, track);
    }  
};

function updatePreviousButtonState(currentIndex) 
{
    const prevBtn = document.getElementById("previous");
    if (currentIndex <= 0) 
    {
        prevBtn.classList.add("disabled");
        prevBtn.style.pointerEvents = "none";
        prevBtn.style.opacity = "0.5"; // Optional: faded look
    } 
    else 
    {
        prevBtn.classList.remove("disabled");
        prevBtn.style.pointerEvents = "auto";
        prevBtn.style.opacity = "1";
    }
}

function updateNextButtonState(currentIndex) 
{
    const nextBtn = document.getElementById("next");
    if (currentIndex >= songs.length - 1) 
    {
        nextBtn.classList.add("disabled");
        nextBtn.style.pointerEvents = "none";
        nextBtn.style.opacity = "0.5"; // Optional: visually show it's disabled
    }
    else 
    {
        nextBtn.classList.remove("disabled");
        nextBtn.style.pointerEvents = "auto";
        nextBtn.style.opacity = "1";
    }
}

function updatePlayIcons(isPlaying, trackName) 
{
    // Update playbar icon
    play.src = isPlaying ? "img/pause.svg" : "img/play.svg";
    // Update song cards
    document.querySelectorAll(".songList li").forEach(li => 
    {
        const playNowImg = li.querySelector(".playnow img");
        const songName = li.getAttribute("data-filename");
        if (songName === trackName) 
        {
            playNowImg.src = isPlaying ? "img/pause.svg" : "img/play.svg";
            // Add highlight to the playing song
            if (isPlaying) 
            {
                li.classList.add("playing");
                li.scrollIntoView({ behavior: "smooth", block: "center" });
            } 
            // else 
            // {
            //     li.classList.remove("playing");
            // }
        } 
        else 
        {
            playNowImg.src = "img/play.svg"; // reset others
            li.classList.remove("playing");  // remove highlight from others
        }
    });
}

async function displayAlbums() 
{
    try 
    {
        let res = await fetch("/songs/index.json");

        if (!res.ok) 
        {
            console.error("Cannot load albums");
            return;
        }

        let folders = await res.json();

        let cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = "";

        for (let folder of folders) 
        {
            let info;

            try 
            {
                let infoRes = await fetch(`/songs/${folder}/info.json`);

                if (infoRes.ok) 
                {
                    info = await infoRes.json();
                } 
                else 
                {
                    throw new Error("Missing info.json");
                }
            } 
            catch 
            {
                info = {
                    title: folder,
                    description: ""
                };
            }

            // Always start with JPG
            let coverUrl = `/songs/${folder}/cover.jpg`;

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">

                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M5 20V4L19 12L5 20Z"
                                stroke="#141B34"
                                fill="#000"
                                stroke-width="1.5"
                                stroke-linejoin="round" />
                        </svg>
                    </div>

                    <img 
                        src="${coverUrl}"
                        alt="${info.title}"
                        onerror="this.onerror=null; this.src='/songs/${folder}/cover.png';"
                    >

                    <h2>${info.title}</h2>
                    <p>${info.description}</p>

                </div>
            `;
        }

        // Attach click events
        document.querySelectorAll(".card").forEach(card => 
        {
            card.addEventListener("click", async e => 
            {
                let folder = e.currentTarget.dataset.folder;

                songs = await getSongs(`songs/${folder}`);

                if (songs && songs.length > 0) 
                {
                    playMusic(songs[0]);
                }
            });
        });
    } 
    catch (err) 
    {
        console.error("displayAlbums failed:", err);
    }
}

async function main() 
{
    // Get the list of all the songs
    // await getSongs()
    await getSongs("songs/Default")
    playMusic(songs[0], true)
    // Display all the albums on the page
    await displayAlbums()
    // Attach an event listener to play, next and previous
    play.addEventListener("click", () => 
    {
        const track = currentSong.src.split("/").pop();
        if (currentSong.paused) 
        {
            currentSong.play();
            updatePlayIcons(true, track);
        } 
        else 
        {
            currentSong.pause();
            updatePlayIcons(false, track);
        }
    });

    currentSong.addEventListener("ended", () => 
    {
        let current = decodeURIComponent(currentSong.src.split("/").pop());

        let index = songs.indexOf(current);
        if (index + 1 < songs.length)
        {
            // Play the next song in list
            playMusic(songs[index + 1]);
            // playMusic(songs[index + 0]);
        } 
        else 
        {
            // Last song ended – update UI accordingly
            play.src = "img/play.svg"; // reset bottom play icon
            updatePlayIcons(false, current); // reset play icon for the last song in the song list
        }
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => 
    {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => 
    {
        document.querySelector(".left").style.left = "0"
    })

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => 
    {
        document.querySelector(".left").style.left = "-120%"
    })

    // Add an event listener to previous
    previous.addEventListener("click", () => 
    {
        currentSong.pause()
        let current = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(current);
        if (index - 1 >= 0) 
        {
            playMusic(songs[index - 1])
        }
    })

    // Add an event listener to next
    next.addEventListener("click", () => 
    {
        currentSong.pause()
        let current = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(current);
        if (index + 1 < songs.length) 
        {
            playMusic(songs[index + 1])
        }
    })

    // Add an event to volume
    // document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => 
    // {
    //     currentSong.volume = parseInt(e.target.value) / 100
    //     if (currentSong.volume >0)
    //     {
    //         document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
    //     }
    // })

    // Automatically play next song when current ends
    // currentSong.addEventListener("ended", () => 
    // {
    //     let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    //     if ((index + 1) < songs.length) 
    //     {
    //         playMusic(songs[index + 1]);
    //     } 
    //     else 
    //     {
    //         play.src = "img/play.svg"; // Reset play icon
    //     }
    // });

    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e=>
    { 
        if(e.target.src.includes("volume.svg"))
        {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentSong.volume = 0;
            // document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else
        {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentSong.volume = .90;
            // document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })

    const seekbar = document.querySelector(".seekbar");
    currentSong.addEventListener("timeupdate", () => 
    {
        const progress = (currentSong.currentTime / currentSong.duration) * 100;
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = progress + "%";
        // Update seekbar color
        seekbar.value = progress;
        seekbar.style.background = `linear-gradient(to right, #1DB954 ${progress}%, #535353 ${progress}%)`;
    });

    document.addEventListener("keydown", (e) => 
    {
        const key = e.key.toLowerCase();
        // Common logic for ArrowRight and ArrowLeft
        if (key === "arrowright" || key === "arrowleft") 
        {
            if (lastArrowKey === key) 
            {
                arrowKeyCount++;
            } 
            else 
            {
                arrowKeyCount = 1;
                lastArrowKey = key;
            }
            clearTimeout(arrowKeyTimeout);
            arrowKeyTimeout = setTimeout(() => 
            {
                if (arrowKeyCount >= 2) 
                {
                    // Double press → next/previous song
                    if (key === "arrowright") 
                        next.click();
                    else 
                    if (key === "arrowleft") 
                        previous.click();
                } 
                else 
                {
                    // Single press → seek 5s
                    if (key === "arrowright") 
                    {
                        currentSong.currentTime = Math.min(currentSong.duration, currentSong.currentTime + 5);
                    } 
                    else 
                    {
                        currentSong.currentTime = Math.max(0, currentSong.currentTime - 5);
                    }
                }
                // Reset tracking
                arrowKeyCount = 0;
                lastArrowKey = null;
            }, 300); // 300ms window to detect double press
            return; // prevent double-handling
         }
        switch (key) 
        {
            case " ":
                e.preventDefault(); // prevent scrolling
                if (currentSong.paused) 
                {
                    currentSong.play();
                    updatePlayIcons(true, currentSong.src.split("/").pop());
                } 
                else 
                {
                    currentSong.pause();
                    updatePlayIcons(false, currentSong.src.split("/").pop());
                }
                break;
            case "arrowright":
                    currentSong.currentTime = Math.min(currentSong.duration, currentSong.currentTime + 5);
                    break;
            case "arrowleft":
                    currentSong.currentTime = Math.max(0, currentSong.currentTime - 5);
                    break;
            case "arrowup":
                currentSong.volume = Math.min(1, currentSong.volume + 0.1);
                e.preventDefault(); 
                break;
            case "arrowdown":
                currentSong.volume = Math.max(0, currentSong.volume - 0.1);
                e.preventDefault(); 
                break;
            case "m":
                const volumeIcon = document.querySelector(".volume>img");
                if (volumeIcon.src.includes("volume.svg")) 
                {
                    volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
                    currentSong.volume = 0;
                } 
                else 
                {
                    volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
                    currentSong.volume = 0.9;
                }
                break;
        }
    });
}

main() 