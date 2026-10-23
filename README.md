# ORBIT

ORBIT is a responsive NASA image-discovery website developed for the University of the Witwatersrand Interactive Media 3B final exam.

The website allows users to discover, search, view and save NASA imagery through a simple image-focused experience. It was developed from the approved ORBIT design document and UX/UI design process.

## Main Pages

ORBIT has three main pages:

- **Discover** — introduces the website and highlights featured space imagery.
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
- Saved images using `localStorage`
- Responsive layouts for desktop, tablet and mobile
- Keyboard-accessible navigation and controls
- Visible focus states
- Reduced-motion support
- Image fallbacks when an image cannot load
- GSAP animations and ScrollTrigger effects
- Graceful fallback if GSAP is unavailable

## GSAP Motion

GSAP is used to add motion without making animation necessary for using the website.

The main GSAP interactions are:

- A GSAP Timeline for the Discover hero content
- ScrollTrigger animations for featured content and NASA search results
- A GSAP Timeline when opening image details on the Explore page
- A subtle reveal animation for the ORBIT visual on the Discover page

Reduced-motion preferences are respected so that the website remains fully usable without these animations.

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
