import { ref, watch } from 'vue'
import { Theme } from '@/types/DTO/budget.dto'

// Create a global state that persists across components
const currentTheme = ref<Theme>(Theme.DARK)

export function useTheme() {
    // Apply theme to document
    const applyTheme = (theme: Theme) => {
        // Remove all theme classes first
        document.documentElement.classList.remove('dark', 'amber')

        // Add the appropriate theme class
        if (theme === Theme.DARK) {
            document.documentElement.classList.add('dark')
        } else if (theme === Theme.AMBER) {
            document.documentElement.classList.add('amber')
        }
        // LIGHT theme has no class (uses :root styles)
    }

    // Set theme (called when budget is loaded or theme is changed)
    const setTheme = (theme: Theme) => {
        currentTheme.value = theme
        applyTheme(theme)
    }

    // Watch for changes and apply them
    watch(currentTheme, (newValue) => {
        applyTheme(newValue)
    })

    return {
        currentTheme,
        setTheme,
        applyTheme
    }
}