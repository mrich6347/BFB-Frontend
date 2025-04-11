import { ref, onMounted, watch } from 'vue'

// Create a global state that persists across components
const isDark = ref(false)

export function useTheme() {
    // Initialize theme
    const initializeTheme = () => {
        // Check if theme was previously stored
        const storedTheme = localStorage.getItem('theme')
        if (storedTheme) {
            isDark.value = storedTheme === 'dark'
        } else {
            // Check system preference
            isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        applyTheme(isDark.value)
    }

    // Apply theme to document
    const applyTheme = (dark: boolean) => {
        if (dark) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    // Toggle theme
    const toggleTheme = () => {
        isDark.value = !isDark.value
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }

    // Watch for changes and apply them
    watch(isDark, (newValue) => {
        applyTheme(newValue)
    })

    // Listen for system theme changes
    const listenForSystemThemeChanges = () => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQuery.addEventListener('change', (e) => {
            // Only update if user hasn't set a preference
            if (!localStorage.getItem('theme')) {
                isDark.value = e.matches
            }
        })
    }

    onMounted(() => {
        initializeTheme()
        listenForSystemThemeChanges()
    })

    return {
        isDark,
        toggleTheme
    }
} 