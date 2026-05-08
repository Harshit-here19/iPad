# RetroPod 🎧

RetroPod is a web-based, mobile-friendly multimedia player that replicates the iconic "Classic" iPod experience. It allows users to load their local music and video libraries and navigate them using a functional digital click-wheel.

**🔗 [Live Demo: Experience RetroPod here](https://harshit-here19.github.io/iPad/)**

## ✨ Features

-   **Authentic Click-Wheel Navigation:** Use touch or mouse rotation to scroll through playlists or skip tracks.
    
-   **Audio & Video Support:** Automatically detects file types. Videos are "forced" into the LCD for an iPod Video experience, while audio displays track metadata.
    
-   **Dual View System:** Toggle between a "Now Playing" screen and a scrollable "Playlist" menu.
    
-   **Dynamic UI Animations:** Minimalist LCD fade animations and smooth-scrolling active track highlights.
    
-   **Smart Seek Bars:**
    
    -   An internal seek bar for audio tracks.
        
    -   A dedicated, larger seek bar at the bottom for precision video seeking.
        
-   **PWA Ready:** Manifest and Service Worker integration for offline use and "Add to Home Screen" support on iOS and Android.
    
-   **Lock Screen Integration:** Full support for `MediaSession` API—view song titles, artist info, and control playback from your device's lock screen.
    
-   **Memory Management:** Automatically saves your last played track index using `localStorage`.
    

## 🚀 Getting Started

### Prerequisites

A modern web browser (Chrome, Safari, or Firefox).

### Installation

1.  Clone the repository:
    
    Bash
    
    ```
    git clone https://github.com/yourusername/retropod.git
    
    ```
    
2.  Open `index.html` in your browser.
    
3.  To use as a PWA:
    
    -   Host the files on a secure server (HTTPS).
        
    -   On iPhone: Tap **Share** -> **Add to Home Screen**.
        
    -   On Android: Tap the **three dots** -> **Install App**.
        

## 🛠️ Usage

1.  **Load Library:** Click the "LOAD LIBRARY" button (or the **UPLOAD** label on the wheel) to select folder/files.
    
2.  **Navigation:**
    
    -   **Rotate Wheel:** Skip tracks or scroll through your library.
        
    -   **Center Button:** Play or Pause the current media.
        
    -   **MENU Label:** Toggle between the Playlist and the Now Playing screen.
        
3.  **Seeking:** Tap the progress bars to jump to specific parts of a song or video.
    

## 📂 Project Structure

-   `index.html` - The structural layout of the iPod body, LCD, and wheel.
    
-   `style.css` - Custom styling including the RetroPod's green LCD theme and animations.
    
-   `script.js` - The logic core handling file processing, click-wheel math, and MediaSession updates.
    
-   `sw.js` - Service Worker for caching and offline performance.
    
-   `manifest.json` - PWA configuration for mobile installation.
    

## 📱 Mobile Optimization

This project is specifically optimized for mobile devices:

-   `user-scalable=no` meta tags to prevent accidental zooming during wheel rotation.
    
-   `touch-action: none` to ensure the click-wheel captures all scroll gestures.
    
-   Battery status API integration to show your real device battery on the iPod screen.
    

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

----------

_Enjoy the nostalgia! If you like this project, feel free to give it a ⭐ on GitHub._
