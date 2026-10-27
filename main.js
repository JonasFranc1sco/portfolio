const glitchChar = document.getElementById('glitch-char');

function toggleCharacter() {
    if (!glitchChar) return;
    if (glitchChar.textContent === '1') {
        glitchChar.textContent = 'i';
        glitchChar.style.color = '#fab387';
    } else {
        glitchChar.textContent = '1';
        glitchChar.style.color = 'inherit';
    }
}

if (glitchChar) {
    setInterval(toggleCharacter, 3000);
}

const asciiAvatar = document.getElementById('ascii-avatar');
if (asciiAvatar) {
    fetch('ascii-art (1).txt')
        .then((res) => (res.ok ? res.text() : Promise.reject()))
        .then((text) => {
            asciiAvatar.textContent = text;
        })
        .catch(() => {
            // Mantém o conteúdo inline caso aberto via file://
        });
}

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle?.querySelector('.theme-icon');
const themeLabel = themeToggle?.querySelector('.theme-label');

function applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light-mode', isLight);
    if (themeIcon && themeLabel) {
        themeIcon.textContent = isLight ? '☾' : '☀';
        themeLabel.textContent = isLight ? 'dark' : 'light';
    }
}

const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
applyTheme(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const nextTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
        applyTheme(nextTheme);
        localStorage.setItem('portfolio-theme', nextTheme);
    });
}




