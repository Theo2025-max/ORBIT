# ORBIT

ORBIT is a responsive NASA image-discovery website developed for the University of the Witwatersrand Interactive Media 3B final exam.

The project builds on an approved UX/UI design process and technical specification. It provides a focused, image-based experience for discovering, searching, viewing and saving NASA imagery.

## Project Status

Implementation complete. Final deployment and submission verification in progress.

## Core Experience

ORBIT contains three main pages:

- **Discover** — introduces the experience, presents featured discoveries and provides entry points into NASA imagery.
- **Explore** — allows users to search real NASA imagery using the NASA Image and Video Library API, view image details and save selected results.
- **Saved** — displays imagery saved in the current browser/device using `localStorage` and allows users to revisit or remove saved items.

## Key Features

- Real NASA Image and Video Library API integration
- Dynamic image search and result rendering
- Loading, success, empty and error states
- Retry and recovery behaviour
- Image details with NASA metadata and source information
- Browser-based saved-image persistence using `localStorage`
- URL-based search queries
- Responsive layouts for desktop, tablet and mobile
- Keyboard-accessible navigation and controls
- Visible focus states
- Reduced-motion support
- Image-loading fallbacks
- Progressive enhancement and graceful GSAP failure handling

## GSAP Motion

ORBIT uses GSAP to support meaningful interface motion while preserving full functionality when animation is unavailable or reduced.

The main motion interactions include:

- A GSAP Timeline for the Discover hero introduction
- ScrollTrigger-based reveals for featured content and NASA search results
- A user-triggered GSAP Timeline for the Explore image-details experience
- An additional reveal animation for the ORBIT hero visual

Users who prefer reduced motion receive the complete experience without these motion sequences.

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- NASA Image and Video Library API
- GSAP
- ScrollTrigger
- `localStorage`
- Git
- GitHub
- GitHub Pages

## Accessibility and Responsive Design

The project includes:

- Semantic HTML structure
- Skip navigation
- Keyboard-accessible controls
- Visible keyboard focus
- ARIA live regions for dynamic search feedback
- Accessible loading, error and status messaging
- Reduced-motion support
- Responsive layouts tested across mobile, tablet and desktop sizes
- Reflow support at narrow viewport widths and increased zoom levels

## Project Structure

The project is organised into three main HTML pages:

- `index.html` — Discover page
- `explore.html` — Explore and search page
- `saved.html` — Saved images page

The `assets` folder contains the images used in the website.

The `css` folder contains the styling files:

- `reset.css`
- `tokens.css`
- `base.css`
- `components.css`
- `pages.css`
- `responsive.css`
- `explore.css`
- `saved.css`

The `js` folder contains the JavaScript files:

- `api.js`
- `storage.js`
- `discover.js`
- `explore.js`
- `explore-loading.js`
- `saved.js`
- `motion.js`

## Author

Thendo Madzunye  
University of the Witwatersrand  
Interactive Media 3B  
2026
