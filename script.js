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
        li.onclick = (e) => {
            e.stopPropagation();
            loadTrack(index);
            player.play();
        };
        songList.appendChild(li);
    });
}

// 4. Playback Functions
function loadTrack(idx) {
    if (!songs[idx]) return;

    currentIdx = idx;
    localStorage.setItem('lastPlayedIndex', currentIdx);

    if (player.src) URL.revokeObjectURL(player.src);

    const url = URL.createObjectURL(songs[idx]);
    player.src = url;

    const songName = songs[idx].name.split('.')[0];
    title.innerText = songName;
    artist.innerText = `Song ${currentIdx + 1} of ${songs.length}`;

    // Update Playlist UI
    document.querySelectorAll('.song-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.getElementById(`song-${idx}`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Update Media Session (Lock Screen Controls)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: songName,
            artist: "Local Library",
            album: "RetroPod"
        });
        setupMediaActions();
    }

    player.play().catch(() => console.log("User interaction required to play"));
}

function setupMediaActions() {
    navigator.mediaSession.setActionHandler('play', () => player.play());
    navigator.mediaSession.setActionHandler('pause', () => player.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
}

function togglePlay() {
    if (!player.src) return;
    player.paused ? player.play() : player.pause();
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

// 5. Navigation / View Toggling
function showPlaylist() {
    nowPlayingView.style.display = 'none';
    playlistView.style.display = 'block';
    screenMode.innerText = "Playlist";
}

function showNowPlaying() {
    playlistView.style.display = 'none';
    nowPlayingView.style.display = 'flex';
    screenMode.innerText = "Now Playing";
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