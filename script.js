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

// 2. State Variables
let songs = [];
let currentIdx = parseInt(localStorage.getItem('lastPlayedIndex')) || 0;
let isDragging = false;
let lastAngle = 0;
let rotationAccumulator = 0;

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
    const isVideo = file.type.startsWith('video');

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
        videoPlayer.src = url;
        
        // Only show video if we aren't currently looking at the playlist
        videoPlayer.style.display = (playlistView.style.display === 'none') ? 'block' : 'none';
        nowPlayingView.style.display = 'none';
    } else {
        activeMedia = player;
        videoPlayer.pause();
        videoPlayer.style.display = 'none';
        player.src = url;
        
        if (playlistView.style.display === 'none') {
            nowPlayingView.style.display = 'flex';
        }
        
        title.innerText = file.name.split('.')[0];
        artist.innerText = `Song ${currentIdx + 1} of ${songs.length}`;
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
    navigator.mediaSession.setActionHandler('play', () => player.play());
    navigator.mediaSession.setActionHandler('pause', () => player.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
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
    player.play();
}

function prevTrack() {
    if (songs.length === 0) return;
    currentIdx = (currentIdx - 1 + songs.length) % songs.length;
    loadTrack(currentIdx);
    player.play();
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
    nowPlayingView.style.display = 'none';
    playlistView.style.display = 'block';
    videoPlayer.style.display = 'none';
    screenMode.innerText = "Playlist";
}

function showNowPlaying() {
    playlistView.style.display = 'none';
    screenMode.innerText = "Now Playing";
    
    // Check if what's playing is actually a video
    if (activeMedia === videoPlayer) {
        videoPlayer.style.display = 'block';
    } else {
        nowPlayingView.style.display = 'flex';
    }
}

menuLabel.addEventListener('click', (e) => {
    e.stopPropagation();
    if (playlistView.style.display === 'none') showPlaylist();
    else showNowPlaying();
});

centerBtn.onclick = (e) => {
    e.stopPropagation();
    togglePlay();
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

    if (rotationAccumulator > 40) { // Slightly less sensitive for better control
        nextTrack();
        rotationAccumulator = 0;
    } else if (rotationAccumulator < -40) {
        prevTrack();
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