# PROJECT-y-26
### A Time-Locked Digital Editorial Experience

A high-fidelity, interactive web experience designed for the 05.25 anniversary. This project blends "Off-White" inspired brutalist aesthetics with precise frontend architecture to create a sequential narrative journey.

## 🌑 Aesthetic Direction
* **Brutalist Minimalism:** Heavy focus on typography and modular grid layouts.
* **Tactile UI:** Integrated SVG noise/grain filters for a premium paper-like texture.
* **High-Contrast:** Custom dark-mode dashboard with glow-effect UI elements.

## ⚙️ Technical Features
* **Time-Lock Engine:** Native JavaScript logic that validates the client-side date to unlock "Letters" sequentially starting from May 25th.
* **Dynamic Media:** Custom-rendered audio-visual layers using YouTube API and CSS animations.
* **Hidden Admin Layer:** Coordinate-based tap-trigger interface for real-time "Live Message" updates.
* **Mobile Optimized:** Built with a "mobile-first" editorial approach for seamless interaction on iOS/Android.

## 🛠️ Stack
* **Language:** Vanilla JavaScript (ES6+)
* **Styling:** Custom CSS3 Properties & SVG Filters
* **Platform:** Hosted via Replit / Version controlled on GitHub

---
Developed by **Sylens Technologies**.

## Post-deploy admin tasks (run after v3.0 is live)
### 1. Update birthday dates
Go to /admin → Site Config → update:
- startDate: 2026-05-25T00:00:00.000Z
- birthdayDate: 2026-05-29T00:00:00.000Z

### 2. Update day Igbo titles (if not auto-seeded)
Go to /admin → Days → edit each day:
- day-1 igboTitle: Ụtọ
- day-2 igboTitle: Echiche
- day-3 igboTitle: Obi m
- day-4 igboTitle: Ifunanya
- day-5 igboTitle: Ndụ m

### 3. Update day display titles
Go to /admin → Days → edit each day's title field:
- day-1 title: Ụtọ
- day-2 title: Echiche
- day-3 title: Obi m
- day-4 title: Ifunanya
- day-5 title: Ndụ m

### 4. Upload photos
Go to /admin → Days → Day 5 → gallery slots
Upload each photo using the new upload component.
Cloudinary credentials must be set in Vercel env vars first.

### 5. Set day music
Go to /admin → Days → each day → youtubeId field
Replace placeholder IDs with actual YouTube video IDs.
The ID is the 11-character string after v= in the YouTube URL.

### 6. Add voice note audio (Day 3)
Go to /admin → Days → Day 3 → Voice Note
Upload the audio file or paste the Cloudinary URL.
