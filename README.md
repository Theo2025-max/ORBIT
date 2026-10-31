# ORBIT

ORBIT is a responsive NASA image-discovery website developed for the University of the Witwatersrand Interactive Media 3B final exam.

The website allows users to discover, search, view and save NASA imagery through a focused image-based experience.

## Live Website

[View the live ORBIT website](https://theo2025-max.github.io/ORBIT/)

## Main Pages

ORBIT has three main pages:

- **Discover** — introduces the website, presents a featured NASA discovery and highlights selected space imagery.
- **Explore** — allows users to search NASA imagery, view search results and open more information about an image.
- **Saved** — displays images that the user has saved in their current browser.

## Features

- NASA Image and Video Library API integration
- Image search using keywords
- Popular topic suggestions
- Loading, success, empty and error states
- Retry behaviour when a search fails
- NASA image details and metadata
- Source and provenance information
- Featured NASA discovery on the Discover page
- Saved images using `localStorage`
- Responsive layouts for desktop, tablet and mobile
- Keyboard-accessible navigation and controls
- Visible focus states
- Reduced-motion support
- Image fallbacks when an image cannot load
- GSAP animations and ScrollTrigger effects
- Graceful fallback if GSAP is unavailable

## GSAP Motion

GSAP is used to support motion and transitions while keeping the website fully usable without animation.

The main GSAP interactions are:

- A GSAP Timeline for the Discover hero content
- ScrollTrigger animations for featured content and NASA search results
- A GSAP Timeline when opening image details on the Explore page
- A subtle reveal animation for the ORBIT hero visual

Reduced-motion preferences are respected so that the complete website remains available without these animations.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- NASA Image and Video Library API
- GSAP
- ScrollTrigger
- localStorage
- Git
- GitHub
- GitHub Pages

## Project Structure

The project contains three main HTML files:

- `index.html` — Discover page
- `explore.html` — Explore and search page
- `saved.html` — Saved images page

The `assets` folder contains the images used by the website.

The `css` folder contains the styling files:

- `reset.css`
- `tokens.css`
- `base.css`
- `components.css`
- `pages.css`
- `responsive.css`
- `explore.css`
- `saved.css`
- `discover-feature.css`

The `js` folder contains the JavaScript files:

- `api.js`
- `storage.js`
- `discover.js`
- `explore.js`
- `explore-loading.js`
- `saved.js`
- `motion.js`

## Accessibility

The website includes:

- Semantic HTML
- Skip navigation
- Keyboard-accessible controls
- Visible keyboard focus
- ARIA live regions for search feedback
- Accessible loading and error messages
- Reduced-motion support
- Responsive reflow for smaller screens
- Alternative text for important imagery

## Author

Thendo Madzunye  
University of the Witwatersrand  
Interactive Media 3B  
2026
