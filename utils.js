/**
 * Utility Functions for STRIDE
 * Includes NLP parsing for smart task creation.
 */

const Utils = {
    /**
     * Parses the task input text to extract metadata like urgency and tags.
     * @param {string} text - The raw input text from the user.
     * @returns {object} - { cleanText: string, urgency: string | null, tags: string[] }
     */
    parseTaskInput(text) {
        const result = {
            cleanText: text,
            urgency: null,
            tags: []
        };

        const lowerText = text.toLowerCase();

        // 1. Detect Urgency Keywords
        // We look for exact matches or matches surrounded by spaces to avoid partial words.
        if (/\b(urgent|high priority|high)\b/i.test(text)) {
            result.urgency = 'high';
        } else if (/\b(medium priority|medium)\b/i.test(text)) {
            result.urgency = 'medium';
        } else if (/\b(low priority|low)\b/i.test(text)) {
            result.urgency = 'low';
        }

        // 2. Detect Temporal Keywords (Today, Tomorrow)
        // We add them as tags since a full date picker wasn't requested yet.
        const timeKeywords = ['today', 'tomorrow', 'tonight'];
        timeKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(text)) {
                result.tags.push(keyword);
            }
        });

        // 3. Clean the text (Optional: remove the detected keywords? 
        // For now, let's keep the text natural but maybe remove explicit " - high" if at end?
        // Let's stick to keeping the text as is for simplicity, or just simple cleanup if desired.
        // User request: "automatic set the urgency dropdown" -> implies we should probably strip it if it's meant as a command.
        // Let's strip only if it's strictly "High", "Medium", "Low" at the very end of the string used as a flag.
        // E.g. "Buy milk high" -> "Buy milk" (High urgency)

        // Simple Cleanup Strategy: Remove distinct functionality keywords from the end.
        let clean = text;
        const urgencyFlags = ['high', 'medium', 'low', 'urgent'];
        for (const flag of urgencyFlags) {
            const regex = new RegExp(`\\s+${flag}$`, 'i');
            if (regex.test(clean)) {
                clean = clean.replace(regex, '');
                // Ensure result.urgency is synchronized if strictly flags were used
                if (flag === 'urgent') result.urgency = 'high';
                else result.urgency = flag;
                break; // Only remove one flag
            }
        }
        result.cleanText = clean;

        return result;
    }
};

// Expose to global scope if not using modules (simplest for this architecture)
window.Utils = Utils;
