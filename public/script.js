// Load portfolio data from API
async function loadPortfolioData() {
    try {
        const res = await fetch('/api/portfolio');
        const data = await res.json();

        // Update stats
        if (data.stats) {
            const el = (id) => document.getElementById(id);
            if (el('statStudents')) el('statStudents').textContent = data.stats.phdStudents;
            if (el('statPubs')) el('statPubs').textContent = data.stats.publications;
            if (el('statExp')) el('statExp').textContent = data.stats.yearsExperience;
            if (el('statHindex')) el('statHindex').textContent = data.stats.hIndex;
        }

        // Update profile
        if (data.profile) {
            if (data.profile.picture) {
                const img = document.getElementById('profileImg');
                if (img) img.src = data.profile.picture;
            }
            if (data.profile.name) {
                const name = document.getElementById('heroName');
                if (name) name.textContent = data.profile.name;
            }
            if (data.profile.title) {
                const title = document.getElementById('heroTitle');
                if (title) title.textContent = data.profile.title;
            }
            if (data.profile.description) {
                const desc = document.getElementById('heroDesc');
                if (desc) desc.textContent = data.profile.description;
            }
        }

        // Render experience
        if (data.experience && data.experience.length > 0) {
            const timeline = document.getElementById('experienceTimeline');
            if (timeline) {
                timeline.innerHTML = data.experience.map(exp => `
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h3>${exp.title}</h3>
                            <p class="position">${exp.position}</p>
                            <p class="date">${exp.date}</p>
                            <ul>${exp.duties.map(d => `<li>${d}</li>`).join('')}</ul>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Render publications
        if (data.publications && data.publications.length > 0) {
            const pubList = document.getElementById('publicationList');
            if (pubList) {
                pubList.innerHTML = '<h3 class="pub-list-title">Published Papers</h3>' + data.publications.map(pub => `
                    <div class="publication-item">
                        <h4>${pub.title}</h4>
                        <p class="pub-authors">${pub.authors}</p>
                        <p class="pub-journal">${pub.journal} (${pub.year})</p>
                        ${pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank" class="pub-doi">DOI: ${pub.doi}</a>` : ''}
                        ${pub.file ? `<a href="${pub.file}" target="_blank" class="pub-download"><i class="fas fa-download"></i> Download</a>` : ''}
                    </div>
                `).join('');
            }
        }

        // Render students
        if (data.students && data.students.length > 0) {
            const grid = document.getElementById('studentsGrid');
            if (grid) {
                grid.innerHTML = data.students.map(s => `
                    <div class="student-card">
                        <div class="student-icon"><i class="fas fa-user-graduate"></i></div>
                        <h4>${s.name}</h4>
                        <p class="student-degree">${s.degree}</p>
                        <p class="student-topic">${s.topic}</p>
                        <span class="student-status ${s.status}">${s.status}</span>
                    </div>
                `).join('');
            }
        }

        // Render photos
        if (data.photos && data.photos.length > 0) {
            const grid = document.getElementById('photosGrid');
            if (grid) {
                grid.innerHTML = data.photos.map(p => `
                    <div class="gallery-item">
                        <img src="${p.path}" alt="${p.caption}" loading="lazy">
                        ${p.caption ? `<p class="gallery-caption">${p.caption}</p>` : ''}
                    </div>
                `).join('');
            }
        }

        // Render videos
        if (data.videos && data.videos.length > 0) {
            const grid = document.getElementById('videosGrid');
            if (grid) {
                grid.innerHTML = data.videos.map(v => `
                    <div class="gallery-item video-item">
                        <iframe src="${v.url}" frameborder="0" allowfullscreen></iframe>
                        <p class="gallery-caption">${v.title}</p>
                    </div>
                `).join('');
            }
        }

        // Render certificates
        if (data.certificates && data.certificates.length > 0) {
            const grid = document.getElementById('certificatesGrid');
            if (grid) {
                grid.innerHTML = data.certificates.map(c => `
                    <div class="gallery-item">
                        <img src="${c.path}" alt="${c.title}" loading="lazy">
                        ${c.title ? `<p class="gallery-caption">${c.title}</p>` : ''}
                    </div>
                `).join('');
            }
        }

        // Render feedback
        if (data.feedback && data.feedback.length > 0) {
            const grid = document.getElementById('feedbackGrid');
            if (grid) {
                grid.innerHTML = data.feedback.map(f => `
                    <div class="feedback-card">
                        <div class="feedback-quote"><i class="fas fa-quote-left"></i></div>
                        <p class="feedback-message">${f.message}</p>
                        <div class="feedback-author">
                            <strong>${f.name}</strong>
                            <span>${f.role} - ${f.type}</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        console.log('Using static content');
    }
}

// Gallery tabs
document.querySelectorAll('.gallery-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.querySelectorAll('.gallery-grid').forEach(g => g.classList.add('hidden'));
        document.getElementById(target + 'Grid').classList.remove('hidden');
    });
});

// Sidebar Navigation Active State
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

function updateActiveNav() {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === current) link.classList.add('active');
    });
}
window.addEventListener('scroll', updateActiveNav);

// Smooth Scroll
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.getAttribute('data-section'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        updateThemeIcon(true);
    } else {
        body.classList.remove('dark-theme');
        updateThemeIcon(false);
    }
}

function updateThemeIcon(isDark) {
    if (themeToggle) themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    });
}
initTheme();

// Scroll to Top
const scrollToTopBtn = document.getElementById('scrollToTop');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) scrollToTopBtn.classList.add('show');
    else scrollToTopBtn.classList.remove('show');
});
scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.about-card, .research-card, .pub-card, .contact-item, .guidance-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Load data on page load
loadPortfolioData();
console.log('Portfolio loaded');
