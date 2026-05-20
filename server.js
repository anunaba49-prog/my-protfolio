const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
    secret: 'portfolio-admin-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Ensure directories exist
const dirs = ['uploads', 'uploads/photos', 'uploads/videos', 'uploads/certificates', 'uploads/documents', 'uploads/profile', 'data'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.params.type || 'documents';
        const dir = path.join(__dirname, 'uploads', type);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
        cb(null, uniqueName);
    }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Helper functions
function getData() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'data/portfolio.json'), 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(path.join(__dirname, 'data/portfolio.json'), JSON.stringify(data, null, 2));
}

function getAdmin() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'data/admin.json'), 'utf8'));
}

function saveAdmin(data) {
    fs.writeFileSync(path.join(__dirname, 'data/admin.json'), JSON.stringify(data, null, 2));
}

// Auth middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

// Initialize admin password
async function initAdmin() {
    const admin = getAdmin();
    if (admin.password.startsWith('$2a$10$default')) {
        admin.password = await bcrypt.hash('2Anu@1234', 10);
        admin.username = 'Nabaanu';
        saveAdmin(admin);
        console.log('Admin initialized - Username: Nabaanu');
    }
}
initAdmin();

// ===== AUTH ROUTES =====
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const admin = getAdmin();
    if (username === admin.username && await bcrypt.compare(password, admin.password)) {
        req.session.isAdmin = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth-check', (req, res) => {
    res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

app.post('/api/change-password', requireAuth, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const admin = getAdmin();
    admin.password = await bcrypt.hash(newPassword, 10);
    saveAdmin(admin);
    res.json({ success: true });
});

// ===== PUBLIC API ROUTES =====
app.get('/api/portfolio', (req, res) => {
    res.json(getData());
});

// ===== ADMIN API ROUTES =====
app.put('/api/admin/profile', requireAuth, (req, res) => {
    const data = getData();
    data.profile = { ...data.profile, ...req.body };
    saveData(data);
    res.json({ success: true, profile: data.profile });
});

app.put('/api/admin/stats', requireAuth, (req, res) => {
    const data = getData();
    data.stats = { ...data.stats, ...req.body };
    saveData(data);
    res.json({ success: true, stats: data.stats });
});

// Profile picture upload
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads/profile');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});
const profileUpload = multer({ storage: profileStorage });

app.post('/api/admin/upload/profile', requireAuth, profileUpload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const data = getData();
    data.profile.picture = '/uploads/profile/' + req.file.filename;
    saveData(data);
    res.json({ success: true, path: data.profile.picture });
});

// Publications CRUD
app.post('/api/admin/publications', requireAuth, upload.single('file'), (req, res) => {
    const data = getData();
    const pub = {
        id: Date.now().toString(),
        title: req.body.title,
        authors: req.body.authors,
        journal: req.body.journal,
        year: req.body.year,
        doi: req.body.doi || '',
        abstract: req.body.abstract || '',
        file: req.file ? '/uploads/documents/' + req.file.filename : ''
    };
    data.publications.push(pub);
    saveData(data);
    res.json({ success: true, publication: pub });
});

app.delete('/api/admin/publications/:id', requireAuth, (req, res) => {
    const data = getData();
    data.publications = data.publications.filter(p => p.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// Students CRUD
app.post('/api/admin/students', requireAuth, (req, res) => {
    const data = getData();
    const student = {
        id: Date.now().toString(),
        name: req.body.name,
        degree: req.body.degree,
        topic: req.body.topic,
        year: req.body.year,
        status: req.body.status || 'ongoing'
    };
    data.students.push(student);
    saveData(data);
    res.json({ success: true, student });
});

app.delete('/api/admin/students/:id', requireAuth, (req, res) => {
    const data = getData();
    data.students = data.students.filter(s => s.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// Photos upload
app.post('/api/admin/photos', requireAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const data = getData();
    const photo = {
        id: Date.now().toString(),
        caption: req.body.caption || '',
        path: '/uploads/photos/' + req.file.filename
    };
    data.photos.push(photo);
    saveData(data);
    res.json({ success: true, photo });
});

app.delete('/api/admin/photos/:id', requireAuth, (req, res) => {
    const data = getData();
    data.photos = data.photos.filter(p => p.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// Videos
app.post('/api/admin/videos', requireAuth, (req, res) => {
    const data = getData();
    const video = {
        id: Date.now().toString(),
        title: req.body.title,
        url: req.body.url,
        description: req.body.description || ''
    };
    data.videos.push(video);
    saveData(data);
    res.json({ success: true, video });
});

app.delete('/api/admin/videos/:id', requireAuth, (req, res) => {
    const data = getData();
    data.videos = data.videos.filter(v => v.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// Certificates upload
app.post('/api/admin/certificates', requireAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const data = getData();
    const cert = {
        id: Date.now().toString(),
        title: req.body.title || '',
        path: '/uploads/certificates/' + req.file.filename
    };
    data.certificates.push(cert);
    saveData(data);
    res.json({ success: true, certificate: cert });
});

app.delete('/api/admin/certificates/:id', requireAuth, (req, res) => {
    const data = getData();
    data.certificates = data.certificates.filter(c => c.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// Collaborators CRUD
app.post('/api/admin/collaborators', requireAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
    const data = getData();
    if (!data.collaborators) data.collaborators = [];
    const collab = {
        id: Date.now().toString(),
        name: req.body.name,
        designation: req.body.designation,
        institution: req.body.institution,
        expertise: req.body.expertise || '',
        email: req.body.email || '',
        website: req.body.website || '',
        photo: '/uploads/photos/' + req.file.filename
    };
    data.collaborators.push(collab);
    saveData(data);
    res.json({ success: true, collaborator: collab });
});

app.delete('/api/admin/collaborators/:id', requireAuth, (req, res) => {
    const data = getData();
    data.collaborators = (data.collaborators || []).filter(c => c.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// Feedback CRUD
app.post('/api/admin/feedback', requireAuth, (req, res) => {
    const data = getData();
    const fb = {
        id: Date.now().toString(),
        name: req.body.name,
        role: req.body.role,
        type: req.body.type,
        message: req.body.message
    };
    data.feedback.push(fb);
    saveData(data);
    res.json({ success: true, feedback: fb });
});

app.delete('/api/admin/feedback/:id', requireAuth, (req, res) => {
    const data = getData();
    data.feedback = data.feedback.filter(f => f.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// Experience CRUD
app.post('/api/admin/experience', requireAuth, (req, res) => {
    const data = getData();
    const exp = {
        id: Date.now().toString(),
        title: req.body.title,
        position: req.body.position,
        date: req.body.date,
        duties: req.body.duties || []
    };
    data.experience.push(exp);
    saveData(data);
    res.json({ success: true, experience: exp });
});

app.delete('/api/admin/experience/:id', requireAuth, (req, res) => {
    const data = getData();
    data.experience = data.experience.filter(e => e.id !== req.params.id);
    saveData(data);
    res.json({ success: true });
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin portal at http://localhost:${PORT}/admin`);
});
