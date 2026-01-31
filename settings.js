/**
 * STRIDE Settings Engine
 * Manages UI personalization and state persistence.
 */

const DEFAULT_PREFERENCES = {
    taskFont: "'Figtree', sans-serif",
    subtaskFont: "'Figtree', sans-serif",
    density: 1.0,
    contrast: 'Medium',
    animSpeed: 1.0,
    reducedMotion: false,
    stealthMode: false,
};
// Initialize preferences with robustness
let userPreferences = JSON.parse(localStorage.getItem('stride_preferences'));
if (!userPreferences || typeof userPreferences !== 'object') {
    userPreferences = { ...DEFAULT_PREFERENCES };
}
window.userPreferences = userPreferences;
console.log('STRIDE Settings: Preferences initialized', userPreferences);

/**
 * Curated Font Pairings
 */
const FONT_OPTIONS = [
    { name: 'Standard Stride', value: "'Figtree', sans-serif" },
    { name: 'Modern Professional', value: "'Inter', sans-serif" },
    { name: 'Artistic Elegant', value: "'Playfair Display', serif" },
    { name: 'Technical Clean', value: "'Space Grotesk', sans-serif" },
    { name: 'Minimalist Airy', value: "'Outfit', sans-serif" }
];

/**
 * Contrast Saturation Levels
 */
const CONTRAST_LEVELS = {
    'Low': { saturation: '60%', brightness: '90%' },
    'Medium': { saturation: '85%', brightness: '100%' },
    'High': { saturation: '100%', brightness: '110%' }
};

function applyPreferences() {
    const root = document.documentElement;

    // Apply Fonts
    root.style.setProperty('--font-main', "'Poppins', sans-serif"); // Stabilize global UI
    root.style.setProperty('--font-task', userPreferences.taskFont);
    root.style.setProperty('--font-subtask', userPreferences.subtaskFont);
    console.log(`STRIDE Typography: Task[${userPreferences.taskFont}] Subtask[${userPreferences.subtaskFont}]`);

    // Apply Density
    root.style.setProperty('--density-multiplier', userPreferences.density);

    // Apply Animation Controller
    root.style.setProperty('--stride-speed', userPreferences.animSpeed);
    document.body.classList.toggle('reduced-motion', userPreferences.reducedMotion);

    // Apply Stealth Mode
    document.body.classList.toggle('stealth-mode', userPreferences.stealthMode);

    // Apply Contrast (via attribute for CSS hooks)
    document.body.setAttribute('data-contrast', userPreferences.contrast.toLowerCase());

    // Save to storage
    localStorage.setItem('stride_preferences', JSON.stringify(userPreferences));
    console.log('STRIDE Settings: Applied', userPreferences);
}

function updatePreference(key, value) {
    userPreferences[key] = value;
    applyPreferences();

    // If density changed, we might need a small broadcast for specific layout fixes
    if (key === 'density') {
        window.dispatchEvent(new Event('resize'));
    }
}

function resetPreferences() {
    userPreferences = { ...DEFAULT_PREFERENCES };
    applyPreferences();
    localStorage.removeItem('stride_preferences');
    // Reload for a clean slate as requested
    window.location.reload();
}

// Initial application
document.addEventListener('DOMContentLoaded', () => {
    applyPreferences();
});
