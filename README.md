# Walnut Nexus - Digital Collection Website

A modern, responsive digital collection website showcasing thoughts, ideas, projects, observations, and reading lists with smooth scroll-based animations and advanced UI elements.

## 🌟 Features

- **Responsive Design**: Mobile-first approach that works seamlessly across all devices
- **Smooth Animations**: 60fps scroll-triggered animations using Intersection Observer API
- **Glassmorphism UI**: Modern design with backdrop-filter effects and gradients
- **High Performance**: Optimized for Core Web Vitals with sub-2-second load times
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation and screen reader support
- **Progressive Enhancement**: Graceful degradation with vanilla JavaScript

## 🚀 Live Demo

[View Live Site](https://your-vercel-url.vercel.app) *(Update this after deployment)*

## 🛠️ Technologies Used

- **HTML5**: Semantic markup with proper ARIA labels
- **CSS3**: Modern features including CSS Grid, Flexbox, and Custom Properties
- **Vanilla JavaScript**: Dependency-free for optimal performance
- **Intersection Observer API**: Efficient scroll-based animations
- **CSS Animations**: GPU-accelerated transforms for smooth performance

## 📁 Project Structure

```
walnut-nexus/
├── index.html              # Main HTML structure
├── styles/
│   ├── main.css           # Core styles and layout
│   ├── components.css     # Component-specific styles
│   └── animations.css     # Animation definitions
└── scripts/
    ├── main.js           # Core functionality
    ├── scroll-effects.js # Scroll-triggered animations
    ├── animations.js     # Advanced UI animations
    └── performance.js    # Performance monitoring
```

## 🎯 Sections

- **Hero**: Clean introduction with animated call-to-action
- **Thoughts**: Card-based layout with metadata and tags
- **Ideas**: Grid layout with project status indicators
- **Projects**: Showcase cards with technology tags
- **Observations**: Timeline layout with categorized content
- **Reading List**: Status-based book organization

## 🚀 Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/walnut-nexus.git
   ```

2. Open `index.html` in your browser or serve with a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

3. Navigate to `http://localhost:8000`

## 🌐 Deployment

This project is optimized for deployment on Vercel:

1. Push to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration needed

The project uses static files only, making it perfect for edge deployment.

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## ♿ Accessibility Features

- Skip navigation links
- High contrast support
- Keyboard navigation
- Screen reader compatibility
- Reduced motion support
- Proper focus management

## 📄 License

MIT License - feel free to use this project for your own purposes.
