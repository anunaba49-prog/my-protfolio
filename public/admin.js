let portfolioData = {};

// Load CAPTCHA on page load
async function loadCaptcha() {
    const res = await fetch('/api/captcha');
    const data = await res.json();
    document.getElementById('captchaQuestion').textContent = data.question;
}
loadCaptcha();

// Check auth on load
async function checkAuth() {
    const res = await fetch('/api/auth-check');
    const data = await res.json();
    if (data.authenticated) {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        loadData();
    }
}
checkAuth();

// Step 1: Send OTP (verify credentials + captcha)
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('loginError').textContent = '';
    const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
            captcha: document.getElementById('captchaInput').value
        })
    });
    const data = await res.json();
    if (res.ok) {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('otpForm').classList.remove('hidden');
        document.getElementById('otpMsg').textContent = data.message;
    } else {
        document.getElementById('loginError').textContent = data.error;
        loadCaptcha();
    }
});

// Step 2: Verify OTP
document.getElementById('otpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('loginError').textContent = '';
    const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: document.getElementById('otpInput').value })
    });
    const data = await res.json();
    if (res.ok) {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        loadData();
    } else {
        document.getElementById('loginError').textContent = data.error;
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    location.reload();
});

// Tab navigation
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.panel).classList.add('active');
    });
});

// Load data
async function loadData() {
    const res = await fetch('/api/portfolio');
    portfolioData = await res.json();
    populateFields();
    renderLists();
}

function populateFields() {
    const p = portfolioData.profile || {};
    const s = portfolioData.stats || {};
    document.getElementById('pName').value = p.name || '';
    document.getElementById('pTitle').value = p.title || '';
    document.getElementById('pDesc').value = p.description || '';
    document.getElementById('pEmail').value = p.email || '';
    document.getElementById('pLocation').value = p.location || '';
    document.getElementById('pOrcid').value = p.orcid || '';
    document.getElementById('pLinkedin').value = p.linkedin || '';
    document.getElementById('sPhdStudents').value = s.phdStudents || '';
    document.getElementById('sPublications').value = s.publications || '';
    document.getElementById('sExperience').value = s.yearsExperience || '';
    document.getElementById('sHindex').value = s.hIndex || '';
}

function renderLists() {
    // Publications
    const pubList = document.getElementById('pubList');
    pubList.innerHTML = (portfolioData.publications || []).map(p => `
        <div class="list-item">
            <div class="list-item-info"><h4>${p.title}</h4><p>${p.authors} - ${p.journal} (${p.year})</p></div>
            <button class="btn-delete" onclick="deleteItem('publications','${p.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    // Students
    const stuList = document.getElementById('studentList');
    stuList.innerHTML = (portfolioData.students || []).map(s => `
        <div class="list-item">
            <div class="list-item-info"><h4>${s.name}</h4><p>${s.degree} - ${s.topic} (${s.status})</p></div>
            <button class="btn-delete" onclick="deleteItem('students','${s.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    // Photos
    const photoList = document.getElementById('photoList');
    photoList.innerHTML = (portfolioData.photos || []).map(p => `
        <div class="list-item">
            <div class="list-item-info"><h4>${p.caption || 'Photo'}</h4><p>${p.path}</p></div>
            <button class="btn-delete" onclick="deleteItem('photos','${p.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    // Videos
    const videoList = document.getElementById('videoList');
    videoList.innerHTML = (portfolioData.videos || []).map(v => `
        <div class="list-item">
            <div class="list-item-info"><h4>${v.title}</h4><p>${v.url}</p></div>
            <button class="btn-delete" onclick="deleteItem('videos','${v.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    // Certificates
    const certList = document.getElementById('certList');
    certList.innerHTML = (portfolioData.certificates || []).map(c => `
        <div class="list-item">
            <div class="list-item-info"><h4>${c.title || 'Certificate'}</h4><p>${c.path}</p></div>
            <button class="btn-delete" onclick="deleteItem('certificates','${c.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    // Feedback
    const fbList = document.getElementById('feedbackList');
    fbList.innerHTML = (portfolioData.feedback || []).map(f => `
        <div class="list-item">
            <div class="list-item-info"><h4>${f.name} (${f.type})</h4><p>${f.message.substring(0, 60)}...</p></div>
            <button class="btn-delete" onclick="deleteItem('feedback','${f.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    // Collaborators
    const collabList = document.getElementById('collabList');
    collabList.innerHTML = (portfolioData.collaborators || []).map(c => `
        <div class="list-item">
            <div class="list-item-info"><h4>${c.name}</h4><p>${c.designation} - ${c.institution}</p></div>
            <button class="btn-delete" onclick="deleteItem('collaborators','${c.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    // Experience
    const expList = document.getElementById('expList');
    expList.innerHTML = (portfolioData.experience || []).map(e => `
        <div class="list-item">
            <div class="list-item-info"><h4>${e.title}</h4><p>${e.position} - ${e.date}</p></div>
            <button class="btn-delete" onclick="deleteItem('experience','${e.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

async function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this?')) return;
    await fetch(`/api/admin/${type}/${id}`, { method: 'DELETE' });
    loadData();
}

// Form submissions
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('pName').value,
            title: document.getElementById('pTitle').value,
            description: document.getElementById('pDesc').value,
            email: document.getElementById('pEmail').value,
            location: document.getElementById('pLocation').value,
            orcid: document.getElementById('pOrcid').value,
            linkedin: document.getElementById('pLinkedin').value
        })
    });
    alert('Profile saved!');
    loadData();
});

document.getElementById('profilePicForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', document.getElementById('profilePic').files[0]);
    await fetch('/api/admin/upload/profile', { method: 'POST', body: formData });
    alert('Profile picture uploaded!');
    loadData();
});

document.getElementById('statsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/admin/stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phdStudents: parseInt(document.getElementById('sPhdStudents').value),
            publications: document.getElementById('sPublications').value,
            yearsExperience: document.getElementById('sExperience').value,
            hIndex: parseInt(document.getElementById('sHindex').value)
        })
    });
    alert('Stats saved!');
    loadData();
});

document.getElementById('pubForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('pubTitle').value);
    formData.append('authors', document.getElementById('pubAuthors').value);
    formData.append('journal', document.getElementById('pubJournal').value);
    formData.append('year', document.getElementById('pubYear').value);
    formData.append('doi', document.getElementById('pubDoi').value);
    formData.append('abstract', document.getElementById('pubAbstract').value);
    if (document.getElementById('pubFile').files[0]) {
        formData.append('file', document.getElementById('pubFile').files[0]);
    }
    await fetch('/api/admin/publications', { method: 'POST', body: formData });
    e.target.reset();
    loadData();
});

document.getElementById('studentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('stuName').value,
            degree: document.getElementById('stuDegree').value,
            topic: document.getElementById('stuTopic').value,
            year: document.getElementById('stuYear').value,
            status: document.getElementById('stuStatus').value
        })
    });
    e.target.reset();
    loadData();
});

document.getElementById('photoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('caption', document.getElementById('photoCaption').value);
    formData.append('file', document.getElementById('photoFile').files[0]);
    await fetch('/api/admin/photos', { method: 'POST', body: formData });
    e.target.reset();
    loadData();
});

document.getElementById('videoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: document.getElementById('videoTitle').value,
            url: document.getElementById('videoUrl').value,
            description: document.getElementById('videoDesc').value
        })
    });
    e.target.reset();
    loadData();
});

document.getElementById('certForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('certTitle').value);
    formData.append('file', document.getElementById('certFile').files[0]);
    await fetch('/api/admin/certificates', { method: 'POST', body: formData });
    e.target.reset();
    loadData();
});

document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('fbName').value,
            role: document.getElementById('fbRole').value,
            type: document.getElementById('fbType').value,
            message: document.getElementById('fbMessage').value
        })
    });
    e.target.reset();
    loadData();
});

document.getElementById('collabForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('collabName').value);
    formData.append('designation', document.getElementById('collabDesignation').value);
    formData.append('institution', document.getElementById('collabInstitution').value);
    formData.append('expertise', document.getElementById('collabExpertise').value);
    formData.append('email', document.getElementById('collabEmail').value);
    formData.append('website', document.getElementById('collabWebsite').value);
    formData.append('file', document.getElementById('collabPhoto').files[0]);
    await fetch('/api/admin/collaborators', { method: 'POST', body: formData });
    e.target.reset();
    loadData();
});

document.getElementById('expForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/admin/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: document.getElementById('expTitle').value,
            position: document.getElementById('expPosition').value,
            date: document.getElementById('expDate').value,
            duties: document.getElementById('expDuties').value.split('\n').filter(d => d.trim())
        })
    });
    e.target.reset();
    loadData();
});
