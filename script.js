// 1. Element Selectors
const fileInput = document.getElementById('file-input');
const loadBtn = document.getElementById('load-btn');
const player = document.getElementById('player');
const title = document.getElementById('song-title');
const artist = document.getElementById('artist-name');
const progress = document.getElementById('progress-fill');
const wheel = document.getElementById('click-wheel');
const centerBtn = document.getElementById('center-button');
const batteryText = document.getElementById("battery");
const playlistView = document.getElementById('playlist-view');
const nowPlayingView = document.getElementById('now-playing-view');
const songList = document.getElementById('song-list');
const screenMode = document.getElementById('screen-mode');
const menuLabel = document.querySelector('.menu');
const videoPlayer = document.getElementById('video-player');
const seekBar = document.getElementById('seek-bar');
const resetBtn = document.getElementById('reset-btn');
const videoFill = document.getElementById('video-progress-fill');
const videoControls = document.getElementById('video-controls');

// 2. State Variables
let songs = [];
let currentIdx = parseInt(localStorage.getItem('lastPlayedIndex')) || 0;
let isDragging = false;
let lastAngle = 0;
let rotationAccumulator = 0;

let isScrubbing = false;
let holdTimer;

let centerPressed = false;

// 3. File Loading Logic
loadBtn.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    songs = Array.from(e.target.files);
    if (songs.length > 0) {
        renderPlaylist();
        // Resume from last known spot if it exists in current selection
        const startIdx = currentIdx < songs.length ? currentIdx : 0;
        loadTrack(startIdx);
        loadBtn.style.display = 'none';
        showPlaylist();
    }
};

function renderPlaylist() {
    songList.innerHTML = '';
    songs.forEach((song, index) => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.id = `song-${index}`;
        li.innerText = `${index + 1}. ${song.name.split('.')[0]}`;
        
        // Ensure this is properly attached
        li.addEventListener('click', (e) => {
            e.stopPropagation();
            loadTrack(index);
        });
        
        songList.appendChild(li);
    });
}

// 4. Playback Functions
// Variable to track if we are using the <audio> or <video> element
let activeMedia = player; 

function loadTrack(idx) {
    if (!songs[idx]) return;
    currentIdx = idx;
    localStorage.setItem('lastPlayedIndex', currentIdx);

    const file = songs[idx];
    const url = URL.createObjectURL(file);
    
    const extension = file.name.split('.').pop().toLowerCase();

const audioExtensions = [
    'mp3',
    'm4a',
    'wav',
    'aac',
    'flac',
    'ogg'
];

const videoExtensions = [
    'mp4',
    'webm',
    'mov',
    'mkv'
];

const isVideo = videoExtensions.includes(extension);

    const songName = file.name.split(".")[0];

    // 1. Reset LCD & Controls (The "Clear Slate")
    videoPlayer.style.display = 'none';
    nowPlayingView.style.display = 'none';
    videoControls.style.display = 'none';

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: songName,
            artist: "RetroPod Library", // Shows as the sub-text
            album: "Local Files",       // Shows in the info section
            artwork: [
                { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
            ]
        });
        
        // Re-setup handlers to ensure they point to the new activeMedia
        setupMediaActions();
    }

    // --- NEW: TRIGGER ANIMATION ---
    const screenContent = document.getElementById('screen-content');
    screenContent.classList.remove('lcd-animate');
    void screenContent.offsetWidth; // "Magic" line to reset the animation
    screenContent.classList.add('lcd-animate');

    if (player.src) URL.revokeObjectURL(player.src);
    if (videoPlayer.src) URL.revokeObjectURL(videoPlayer.src);

    if (isVideo) {
        activeMedia = videoPlayer;
        player.pause();
        player.src = ""; // Empty audio so it doesn't conflict
        videoPlayer.src = url;
        
        // // LCD Management
        // videoPlayer.style.display = (playlistView.style.display === 'none') ? 'block' : 'none';
        // nowPlayingView.style.display = 'none'; 
        
        // // Show bottom video bar
        // videoControls.style.display = 'block'; 

        // Show Video elements if not in Playlist
        if (playlistView.style.display === 'none') {
            videoPlayer.style.display = 'block';
            videoControls.style.display = 'block'; 
        }
    } else {
        activeMedia = player;
        videoPlayer.pause();
        videoPlayer.src = ""; // Empty video so it doesn't conflict
        videoPlayer.style.display = 'none';
        player.src = url;
        
        // Hide bottom video bar during audio
        videoControls.style.display = 'none'; 
        
        nowPlayingView.style.display = 'flex';
        
        title.innerText = file.name.split('.')[0];
        artist.innerText = `Song ${currentIdx + 1} of ${songs.length}`;
    }

    // 5. Update Media Session & UI
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: file.name.split('.')[0],
            artist: "RetroPod Library",
            album: "Local Files"
        });
        setupMediaActions();
    }

    // --- PLAYLIST MENU UPDATE ---
    updatePlaylistUI(idx);

    activeMedia.play().catch(() => {});
    updatePlaylistHighlight(idx);
}

// This function handles the visual change in the list
function updatePlaylistHighlight(idx) {
    // 1. Remove highlight from everyone
    document.querySelectorAll('.song-item').forEach(el => {
        el.classList.remove('active');
    });

    // 2. Highlight the new song
    const activeItem = document.getElementById(`song-${idx}`);
    if (activeItem) {
        activeItem.classList.add('active');
        
        // 3. Minimal scroll animation: keep the song in the middle of the LCD
        activeItem.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

function updatePlaylistUI(idx) {
    // Remove active class from all items
    const items = document.querySelectorAll('.song-item');
    items.forEach(item => item.classList.remove('active'));

    // Add active class to current item
    const activeItem = document.getElementById(`song-${idx}`);
    if (activeItem) {
        activeItem.classList.add('active');
        
        // Minimal smooth scroll so the active track is always visible
        activeItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }
}

function setupMediaActions() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => activeMedia.play());
    navigator.mediaSession.setActionHandler('pause', () => activeMedia.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    
    // Optional: Allow seeking from the lockscreen slider
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && activeMedia.duration) {
            activeMedia.currentTime = details.seekTime;
        }
    });
}
function togglePlay() {
    // 1. Check if we have a file loaded at all
    if (!activeMedia || !activeMedia.src) {
        console.log("No media loaded to play/pause");
        return;
    }

    // 2. Perform the toggle
    if (activeMedia.paused) {
        activeMedia.play().catch(err => {
            console.error("Playback failed:", err);
        });
    } else {
        activeMedia.pause();
    }
}

function nextTrack() {
    if (songs.length === 0) return;
    currentIdx = (currentIdx + 1) % songs.length;
    loadTrack(currentIdx);
    activeMedia.play();
}

function prevTrack() {
    if (songs.length === 0) return;
    currentIdx = (currentIdx - 1 + songs.length) % songs.length;
    loadTrack(currentIdx);
    activeMedia.play();
}

// 3. The Video Bar (Seek) Logic
seekBar.onclick = function(e) {
    if (!activeMedia.duration) return;
    
    // Calculate click position relative to the bar width
    const rect = seekBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    
    // Set the new time
    activeMedia.currentTime = pos * activeMedia.duration;
};

// 5. Navigation / View Toggling
function showPlaylist() {

    // Hide all player views
    nowPlayingView.style.display = 'none';
    videoPlayer.style.display = 'none';
    videoControls.style.display = 'none';

    // Show playlist
    playlistView.style.display = 'block';

    screenMode.innerText = "Playlist";
}

function showNowPlaying() {

    // Hide playlist first
    playlistView.style.display = 'none';

    // Reset all screen elements
    nowPlayingView.style.display = 'none';
    videoPlayer.style.display = 'none';
    videoControls.style.display = 'none';

    screenMode.innerText = "Now Playing";

    // VIDEO MODE
    if (activeMedia === videoPlayer && videoPlayer.src) {

        videoPlayer.style.display = 'block';
        videoControls.style.display = 'block';

    } 
    
    // AUDIO MODE
    else {

        nowPlayingView.style.display = 'flex';

    }
}

// Function to start "Scrub Mode"
const startHold = (e) => {

    e.preventDefault();

    centerPressed = true;

    holdTimer = setTimeout(() => {

        isScrubbing = true;

        if (navigator.vibrate) navigator.vibrate(10);

    }, 200);
};

// Function to end "Scrub Mode"
const endHold = (e) => {

    // Ignore if center button wasn't involved
    if (!centerPressed) return;

    clearTimeout(holdTimer);

    if (!isScrubbing) {
        togglePlay();
    }

    isScrubbing = false;
    centerPressed = false;
};

// Listeners for both Mouse and Mobile Touch
centerBtn.addEventListener('mousedown', startHold);
window.addEventListener('mouseup', endHold);

centerBtn.addEventListener('touchstart', startHold, { passive: false });
window.addEventListener('touchend', endHold);

menuLabel.addEventListener('click', (e) => {
    e.stopPropagation();
    if (playlistView.style.display === 'none') showPlaylist();
    else showNowPlaying();
});

// --- Reset & Re-upload Logic ---
resetBtn.onclick = (e) => {
    e.stopPropagation();
    
    // 1. Clear current state
    songs = [];
    currentIdx = 0;
    
    // 2. Stop any playing media
    if (activeMedia) {
        activeMedia.pause();
        activeMedia.src = "";
    }
    
    // 3. Reset the UI
    songList.innerHTML = "";
    title.innerText = "No Music";
    artist.innerText = "Select files below";
    progress.style.width = "0%";
    
    // 4. Trigger new file selection
    fileInput.click();
};

// 6. Wheel Logic
function getAngle(x, y, rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(y - cy, x - cx) * (180 / Math.PI);
}

function handleMove(clientX, clientY) {
    const rect = wheel.getBoundingClientRect();
    const angle = getAngle(clientX, clientY, rect);

    if (lastAngle === 0) {
        lastAngle = angle;
        return;
    }

    let delta = angle - lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    rotationAccumulator += delta;

    // Sensitivity threshold
    if (Math.abs(rotationAccumulator) > 30) {
        if (isScrubbing && activeMedia === videoPlayer) {
            // MODE: VIDEO SCRUBBING
            // Each "click" of the wheel moves the video 5 seconds
            const direction = rotationAccumulator > 0 ? 5 : -5;
            activeMedia.currentTime += direction;
        } else {
            // MODE: TRACK CHANGING
            if (rotationAccumulator > 0) nextTrack();
            else prevTrack();
        }
        rotationAccumulator = 0;
    }

    lastAngle = angle;
}

// Event Listeners for Wheel
wheel.addEventListener('touchstart', (e) => {
    isDragging = true;
    const rect = wheel.getBoundingClientRect();
    lastAngle = getAngle(e.touches[0].clientX, e.touches[0].clientY, rect);
    rotationAccumulator = 0;
}, { passive: false });

wheel.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

window.addEventListener('touchend', () => {
    isDragging = false;
    lastAngle = 0;
});

// Mouse Support
wheel.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = wheel.getBoundingClientRect();
    lastAngle = getAngle(e.clientX, e.clientY, rect);
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) handleMove(e.clientX, e.clientY);
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// 7. Utilities & Updates
player.ontimeupdate = () => {
    const pct = (player.currentTime / player.duration) * 100;
    progress.style.width = (pct || 0) + "%";
};

// UPDATE VIDEO BAR
videoPlayer.ontimeupdate = () => {
    const pct = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    videoFill.style.width = (pct || 0) + "%";
};

document.getElementById('video-seek-bar').onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoPlayer.currentTime = pos * videoPlayer.duration;
};

player.onended = () => nextTrack();

async function updateBattery() {
    if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        const refresh = () => batteryText.innerText = Math.round(battery.level * 100) + "%";
        refresh();
        battery.addEventListener("levelchange", refresh);
    }
}
updateBattery();