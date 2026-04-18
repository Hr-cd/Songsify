let currentSong = new Audio();
let songs;
let currFolder;
let lastArrowKey = null;
let arrowKeyTimeout = null;
let allAlbums = [];
let currentAlbumPage = 1;
const ALBUMS_PER_PAGE = 20;
let colorThief;
let isShuffle = false;
let isRepeat = false;

// Initialize ColorThief when it's available
document.addEventListener("DOMContentLoaded", () => {
    if (typeof ColorThief !== "undefined") {
        colorThief = new ColorThief();
    }
});

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

async function fetchLyrics(track) 
{
    const lyricsContent = document.getElementById("lyricsContent");
    if (!lyricsContent) return;
    
    let txtFile = track.replace(/\.(mp3|mpeg|mp4|wav|ogg)$/i, ".txt");
    let url = `/${currFolder}/${txtFile}`;
    
    // Clear old lyrics while fetching
    lyricsContent.innerHTML = "Loading lyrics...";
    lyricsContent.classList.remove("error");
    
    try 
    {
        let res = await fetch(url);
        if (res.ok) 
        {
            let text = await res.text();
            // Optional: Escape HTML to be safe, but we just set text directly using textContent or safe innerHTML since it's local.
            lyricsContent.textContent = text; 
        } 
        else 
        {
            lyricsContent.innerHTML = "🎵 Looks like we don't have the lyrics for this track yet.";
            lyricsContent.classList.add("error");
        }
    } 
    catch(err) 
    {
        lyricsContent.innerHTML = "🎵 Looks like we don't have the lyrics for this track yet.";
        lyricsContent.classList.add("error");
    }
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
    // Fetch lyrics dynamically
    fetchLyrics(track);
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
    let res = await fetch("/songs/index.json");
    if (!res.ok) {
        console.error("Cannot load albums");
        return;
    }
    allAlbums = await res.json();
    await renderAlbumPage(currentAlbumPage);
    
    // Attach event listeners for pagination arrows
    document.getElementById("prev-album-page").addEventListener("click", async (e) => {
        e.preventDefault();
        if (currentAlbumPage > 1) {
            currentAlbumPage--;
            await renderAlbumPage(currentAlbumPage);
        }
    });

    document.getElementById("next-album-page").addEventListener("click", async (e) => {
        e.preventDefault();
        const maxPages = Math.ceil(allAlbums.length / ALBUMS_PER_PAGE);
        if (currentAlbumPage < maxPages) {
            currentAlbumPage++;
            await renderAlbumPage(currentAlbumPage);
        }
    });
}

async function renderAlbumPage(page) 
{
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";
    
    let start = (page - 1) * ALBUMS_PER_PAGE;
    let end = start + ALBUMS_PER_PAGE;
    let paginatedFolders = allAlbums.slice(start, end);

    for (let folder of paginatedFolders) 
    {
        let info;
        try {
            let infoRes = await fetch(`/songs/${folder}/info.json`);
            info = await infoRes.json();
        } 
        catch {
            info = {
                title: folder,
                description: ""
            };
        }
        // Check if cover.jpg exists, if not, check for cover.png
        let coverUrlJpg = `/songs/${folder}/cover.jpg`;
        let coverUrlPng = `/songs/${folder}/cover.png`;
        let coverUrl = coverUrlJpg;
        // Try to fetch cover.jpg, if not found, use cover.png
        try 
        {
            let coverRes = await fetch(coverUrlJpg, { method: "HEAD" });
            if (!coverRes.ok) 
            {
                coverRes = await fetch(coverUrlPng, { method: "HEAD" });
                if (coverRes.ok) 
                {
                    coverUrl = coverUrlPng;
                }
            }
        } 
        catch (e) 
        {
            coverUrl = coverUrlPng;
        }
        cardContainer.innerHTML = cardContainer.innerHTML + ` <div data-folder="${folder}" class="card">
                                                                <div class="play">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                                                                    </svg>
                                                                </div>
                                                                <img src="${coverUrl}" alt="">
                                                                <h2>${info.title}</h2>
                                                                <p>${info.description}</p>
                                                            </div>`
    }
    // Load the playlist whenever card is clicked
    document.querySelectorAll(".card").forEach(card => {
            card.addEventListener(
                "click",
                async e => {
                    let folder = e.currentTarget.dataset.folder;

                    // Dynamic Background Extraction
                    if (colorThief) {
                        try {
                            const img = e.currentTarget.querySelector("img");
                            if (img.complete) {
                                const color = colorThief.getColor(img);
                                const rightContainer = document.querySelector(".right");
                                rightContainer.style.background = `linear-gradient(to bottom, rgb(${color[0]}, ${color[1]}, ${color[2]}) 0%, #121212 100%)`;
                            }
                        } catch(err) {
                            console.error("Could not extract image color.", err);
                        }
                    }

                    songs = await getSongs(`songs/${folder}`);
                    if (songs.length > 0) {
                        playMusic(songs[0]);
                    }
                }
            );
        });

    // Update pagination arrows visual state
    const prevBtn = document.getElementById("prev-album-page");
    const nextBtn = document.getElementById("next-album-page");
    const maxPages = Math.ceil(allAlbums.length / ALBUMS_PER_PAGE);
    
    prevBtn.style.opacity = page === 1 ? "0.5" : "1";
    prevBtn.style.pointerEvents = page === 1 ? "none" : "auto";
    
    nextBtn.style.opacity = page >= maxPages || maxPages === 0 ? "0.5" : "1";
    nextBtn.style.pointerEvents = page >= maxPages || maxPages === 0 ? "none" : "auto";
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

    const shuffleBtn = document.getElementById("shuffle");
    const repeatBtn = document.getElementById("repeat");

    shuffleBtn.addEventListener("click", () => {
        isShuffle = !isShuffle;
        shuffleBtn.style.opacity = isShuffle ? "1" : "0.5";
    });

    repeatBtn.addEventListener("click", () => {
        isRepeat = !isRepeat;
        repeatBtn.style.opacity = isRepeat ? "1" : "0.5";
    });

    const playNext = () => {
        if (!songs || songs.length === 0) return;
        let current = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(current);

        if (isShuffle) {
            let nextIndex = Math.floor(Math.random() * songs.length);
            while (nextIndex === index && songs.length > 1) {
                nextIndex = Math.floor(Math.random() * songs.length);
            }
            playMusic(songs[nextIndex]);
        } else {
            if (index + 1 < songs.length) {
                playMusic(songs[index + 1]);
            } else if (isRepeat) {
                playMusic(songs[0]); // Loop back to start
            } else {
                play.src = "img/play.svg";
                updatePlayIcons(false, current);
            }
        }
    };

    currentSong.addEventListener("ended", playNext);

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
        currentSong.pause();
        let current = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(current);
        
        // If the song is >3s in, restart it instead of going to previous
        if (currentSong.currentTime > 3) {
            currentSong.currentTime = 0;
            currentSong.play();
            return;
        }

        if (index - 1 >= 0) 
        {
            playMusic(songs[index - 1]);
        }
        else if (isRepeat && songs.length > 0)
        {
            playMusic(songs[songs.length - 1]);
        }
    });

    // Add an event listener to next
    next.addEventListener("click", () => 
    {
        currentSong.pause();
        playNext();
    });

    // Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => 
    {
        currentSong.volume = parseInt(e.target.value) / 100
        if (currentSong.volume >0)
        {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg")
        }
        else 
        {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("volume.svg", "mute.svg");
        }
    })

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
                const volumeInput = document.querySelector(".range").getElementsByTagName("input")[0];
                if (volumeIcon.src.includes("volume.svg")) 
                {
                    volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
                    currentSong.volume = 0;
                    volumeInput.value = 0;
                } 
                else 
                {
                    volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
                    currentSong.volume = 0.9;
                    volumeInput.value = 90;
                }
                break;
        }
    });
    // Setup request song modal
    const requestBtn = document.getElementById("request-song-btn");
    const modal = document.getElementById("requestSongModal");
    const closeBtn = document.getElementById("closeModal");
    const reqForm = document.getElementById("requestSongForm");

    if (requestBtn && modal) {
        requestBtn.addEventListener("click", () => {
            modal.showModal();
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.close();
        });
    }

    if (reqForm && modal) {
        reqForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const songName = document.getElementById("reqSongName").value;
            const songAuthor = document.getElementById("reqSongAuthor").value;
            
            // Generate a mailto link that opens the user's email client
            const devEmail = "parayehrushikesh10@gmail.com"; // <--- CHANGE THIS TO YOUR ACTUAL EMAIL
            const subject = encodeURIComponent(`New Song Request: ${songName}`);
            const body = encodeURIComponent(`Hello Developer!\n\nPlease add the following song to the Spotify Clone:\n\nSender Name: ${document.getElementById("reqSongSender").value}\nSong Name: ${songName}\nAuthor: ${songAuthor}\n\nThanks!`);
            
            window.location.href = `mailto:${devEmail}?subject=${subject}&body=${body}`;

            // Reset and close
            reqForm.reset();
            modal.close();
            
            alert(`Opening your email client to send the request for "${songName}"!`);
        });
    }

    // Setup Lyrics Panel Toggle
    const lyricsBtn = document.getElementById("lyrics-btn");
    const lyricsPanel = document.getElementById("lyricsPanel");
    const closeLyrics = document.getElementById("closeLyrics");

    if (lyricsBtn && lyricsPanel) {
        lyricsBtn.addEventListener("click", () => {
            lyricsPanel.classList.toggle("active");
            if(lyricsPanel.classList.contains("active") && currentSong.src) {
                const track = decodeURIComponent(currentSong.src.split("/").pop());
                fetchLyrics(track);
            }
        });
    }

    if (closeLyrics && lyricsPanel) {
        closeLyrics.addEventListener("click", () => {
            lyricsPanel.classList.remove("active");
        });
    }
}

main() 