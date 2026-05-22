let portfolioData = {};
let localCaptchaAnswer = null;

// Load CAPTCHA
async function loadCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    localCaptchaAnswer = num1 + num2;
    document.getElementById('captchaQuestion').textContent = num1 + ' + ' + num2 + ' = ?';
    // Also set on server
    try { await fetch('/api/captcha'); } catch(e) {}
}
loadCaptcha();

// Check auth on load
async function checkAuth() {
    try {
        const res = await fetch('/api/auth-check');
        const data = await res.json();
        if (data.authenticated) {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('adminDashboard').classList.remove('hidden');
            loadData();
        }
    } catch(e) {}
}
checkAuth();

// Step 1: Verify credentials + captcha, then send OTP
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('loginError').textContent = '';
    
    const captchaInput = parseInt(document.getElementById('captchaInput').value);
    if (captchaInput !== localCaptchaAnswer) {
        document.getElementById('loginError').textContent = 'Incorrect CAPTCHA';
        loadCaptcha();
        return;
    }

    try {
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
    } catch(err) {
        document.getElementById('loginError').textContent = 'Server not reachable. Run: npm start';
    }
});

// Step 2: Verify OTP
document.getElementById('otpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('loginError').textContent = '';
    try {
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
    } catch(err) {
        document.getElementById('loginError').textContent = 'Server error. Try again.';
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
    const g = portfolioData.guidance || {};
    document.getElementById('pName').value = p.name || '';
    document.getElementById('pTitle').value = p.title || '';
    document.getElementById('pDesc').value = p.description || '';
    document.getElementById('pEmail').value = p.email || '';
    document.getElementById('pLocation').value = p.location || '';
    document.getElementById('pOrcid').value = p.orcid || '';
    document.getElementById('pLinkedin').value = p.linkedin || '';
    document.getElementById('pLinkedinName').value = p.linkedinName || '';
    document.getElementById('pScopus').value = p.scopus || '';
    document.getElementById('pScholar').value = p.googleScholar || '';
    document.getElementById('pResearchGate').value = p.researchGate || '';
    document.getElementById('sPhdStudents').value = s.phdStudents || '';
    document.getElementById('sPublications').value = s.publications || '';
    document.getElementById('sExperience').value = s.yearsExperience || '';
    document.getElementById('sHindex').value = s.hIndex || '';
    // About
    document.getElementById('eduEntries').value = (portfolioData.education || []).map(e => e.degree + ' | ' + e.institution).join('\n');
    document.getElementById('phdTitle').value = (portfolioData.phdResearch || {}).title || '';
    document.getElementById('phdDesc').value = (portfolioData.phdResearch || {}).description || '';
    const r = portfolioData.currentRole || {};
    document.getElementById('roleTitle').value = r.title || '';
    document.getElementById('roleDept').value = r.department || '';
    document.getElementById('roleInst').value = r.institution || '';
    document.getElementById('roleResp').value = r.responsibility || '';
    document.getElementById('guidBsc').value = g.bscProjects || '';
    document.getElementById('guidMsc').value = g.mscDissertations || '';
    document.getElementById('guidPhd').value = g.phdStudents || '';
    document.getElementById('guidCollab').value = g.collaborativeProjects || '';
    // Research
    document.getElementById('researchEntries').value = (portfolioData.researchInterests || []).map(r => r.icon + ' | ' + r.title + ' | ' + r.description).join('\n');
    document.getElementById('skillsEntries').value = (portfolioData.skills || []).join(', ');
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

    // Journal Logos
    const logoList = document.getElementById('logoList');
    logoList.innerHTML = (portfolioData.journalLogos || []).map(l => `
        <div class="list-item">
            <div class="list-item-info"><h4>${l.name}</h4><p>${l.path}</p></div>
            <button class="btn-delete" onclick="deleteItem('journalLogos','${l.id}')"><i class="fas fa-trash"></i></button>
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
            linkedin: document.getElementById('pLinkedin').value,
            linkedinName: document.getElementById('pLinkedinName').value,
            scopus: document.getElementById('pScopus').value,
            googleScholar: document.getElementById('pScholar').value,
            researchGate: document.getElementById('pResearchGate').value
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

document.getElementById('logoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('logoName').value);
    formData.append('file', document.getElementById('logoFile').files[0]);
    await fetch('/api/admin/journalLogos', { method: 'POST', body: formData });
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

// About section forms
document.getElementById('educationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const lines = document.getElementById('eduEntries').value.split('\n').filter(l => l.trim());
    const education = lines.map((l, i) => {
        const parts = l.split('|').map(p => p.trim());
        return { id: (i + 1).toString(), degree: parts[0] || '', institution: parts[1] || '' };
    });
    await fetch('/api/admin/education', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ education }) });
    alert('Education saved!');
    loadData();
});

document.getElementById('phdResearchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/admin/phdResearch', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: document.getElementById('phdTitle').value, description: document.getElementById('phdDesc').value }) });
    alert('PhD Research saved!');
    loadData();
});

document.getElementById('currentRoleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/admin/currentRole', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: document.getElementById('roleTitle').value, department: document.getElementById('roleDept').value, institution: document.getElementById('roleInst').value, responsibility: document.getElementById('roleResp').value }) });
    alert('Current Role saved!');
    loadData();
});

document.getElementById('guidanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/admin/guidance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bscProjects: parseInt(document.getElementById('guidBsc').value), mscDissertations: parseInt(document.getElementById('guidMsc').value), phdStudents: parseInt(document.getElementById('guidPhd').value), collaborativeProjects: parseInt(document.getElementById('guidCollab').value) }) });
    alert('Guidance saved!');
    loadData();
});

document.getElementById('researchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const lines = document.getElementById('researchEntries').value.split('\n').filter(l => l.trim());
    const researchInterests = lines.map((l, i) => {
        const parts = l.split('|').map(p => p.trim());
        return { id: (i + 1).toString(), icon: parts[0] || 'fas fa-flask', title: parts[1] || '', description: parts[2] || '' };
    });
    await fetch('/api/admin/researchInterests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ researchInterests }) });
    alert('Research Interests saved!');
    loadData();
});

document.getElementById('skillsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const skills = document.getElementById('skillsEntries').value.split(',').map(s => s.trim()).filter(s => s);
    await fetch('/api/admin/skills', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skills }) });
    alert('Skills saved!');
    loadData();
});
