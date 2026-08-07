const $ = (id) => document.getElementById(id);
const canvas = $('preview-canvas');
const ctx = canvas.getContext('2d');
const photoInput = $('photo-input');
const form = $('generator-form');

let photo = null;
let format = 'card';
let cameraStream = null;
let frameStyle = 'arch';
let orientation = 'portrait';
let cardTheme = 'grove';

const cropState = {
    card: { scale: 100, x: 0, y: 0 },
    frame: { scale: 100, x: 0, y: 0 }
};

const colors = {
    green: '#0B6839',
    pink: '#A66A79',
    yellow: '#FEE101',
    cream: '#FFFBE8',
    black: '#000000',
    white: '#FFFFFF'
};

function font(size, weight = '700', family = 'Victor') {
    return `${weight} ${size}px ${family === 'Imbue' ? 'Imbue' : 'Victor'}`;
}

function activeCrop() {
    return cropState[format];
}

function syncCropInputs() {
    const c = activeCrop();
    $('zoom-input').value = c.scale;
    $('x-input').value = c.x;
    $('y-input').value = c.y;
    $('zoom-value').textContent = c.scale + '%' + (c.scale < 100 ? ' · OUT' : '');
}

function cover(img, x, y, w, h, scale = 1, position = true) {
    const ratio = Math.max(w / img.width, h / img.height) * scale;
    const iw = img.width * ratio;
    const ih = img.height * ratio;
    const c = activeCrop();
    const xShift = position ? (c.x / 100) * (Math.abs(iw - w) / 2) : 0;
    const yShift = position ? (c.y / 100) * (Math.abs(ih - h) / 2) : 0;
    ctx.drawImage(img, x + (w - iw) / 2 + xShift, y + (h - ih) / 2 + yShift, iw, ih);
}

function fitText(text, max, initial, family = 'Victor') {
    let size = initial;
    ctx.font = font(size, '700', family);
    while (ctx.measureText(text).width > max && size > 14) {
        size -= 1;
        ctx.font = font(size, '700', family);
    }
    return size;
}

function line(x1, y1, x2, y2, w = 5) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = w;
    ctx.stroke();
}

function text(txt, x, y, size, opts = {}) {
    ctx.font = font(size, opts.weight || '700', opts.family || 'Victor');
    ctx.fillStyle = opts.color || colors.black;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.base || 'alphabetic';
    ctx.fillText(txt, x, y);
}

function drawPattern(x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = colors.yellow;
    ctx.globalAlpha = .45;
    ctx.lineWidth = 3;
    for (let i = -h; i < w + h; i += 36) line(x + i, y, x + i - h, y + h, 3);
    ctx.restore();
}

function drawPhoto(x, y, w, h, shape = 'rect', radius = 0) {
    ctx.save();
    ctx.beginPath();
    if (shape === 'circle') {
        ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    } else if (radius) {
        ctx.roundRect(x, y, w, h, radius);
    } else {
        ctx.rect(x, y, w, h);
    }
    ctx.clip();

    if (photo) {
        const scale = activeCrop().scale / 100;
        if (scale < 1) {
            ctx.save();
            ctx.filter = 'blur(28px) brightness(.62) saturate(.85)';
            cover(photo, x - w * .08, y - h * .08, w * 1.16, h * 1.16, 1.08, false);
            ctx.restore();
            ctx.fillStyle = 'rgba(11,104,57,.12)';
            ctx.fillRect(x, y, w, h);
        }
        cover(photo, x, y, w, h, scale);
    } else {
        ctx.fillStyle = colors.pink;
        ctx.fillRect(x, y, w, h);
        text('YOUR', x + w / 2, y + h / 2 - 22, 40, { color: colors.cream, align: 'center' });
        text('FACE', x + w / 2, y + h / 2 + 28, 40, { color: colors.cream, align: 'center' });
    }
    ctx.restore();
}

function cardPalette() {
    return {
        grove: { top: '#0B6839', bottom: '#A66A79', line: '#FEE101', edge: '#A66A79' },
        dusk: { top: '#173E36', bottom: '#395066', line: '#E4D4AA', edge: '#879FBC' },
        salt: { top: '#527164', bottom: '#7B6758', line: '#FFFBE8', edge: '#E4D4AA' }
    }[cardTheme];
}

function drawCard() {
    const p = cardPalette();
    canvas.width = 1080;
    canvas.height = 1350;

    ctx.fillStyle = colors.cream;
    ctx.fillRect(0, 0, 1080, 1350);

    ctx.fillStyle = p.top;
    ctx.fillRect(0, 0, 1080, 236);
    drawPattern(0, 0, 1080, 236);

    text('HH GOA', 70, 86, 42, { color: colors.cream });
    text('HACKER HOUSE 2026', 70, 130, 20, { color: p.line });
    text('BUILDER ID // 001', 1010, 86, 17, { color: colors.cream, align: 'right' });

    ctx.fillStyle = p.line;
    ctx.fillRect(70, 185, 940, 9);

    const px = 70, py = 285, pw = 940, ph = 565;
    ctx.fillStyle = colors.black;
    ctx.fillRect(px - 10, py - 10, pw + 20, ph + 20);
    drawPhoto(px, py, pw, ph);
    ctx.strokeStyle = p.edge;
    ctx.lineWidth = 14;
    ctx.strokeRect(px, py, pw, ph);

    ctx.fillStyle = p.bottom;
    ctx.fillRect(0, 922, 1080, 428);

    const name = $('name-input').value.trim() || 'YOUR NAME';
    const role = $('role-input').value.trim() || 'BUILDER · INTERNET PERSON';
    const title = $('title-input').value;

    const nameSize = fitText(name, 910, 102, 'Imbue');
    text(name, 70, 1035, nameSize, { family: 'Imbue', color: colors.cream });
    text('THEY / THEM / LET THEM COOK', 70, 1088, 17, { color: p.line });

    ctx.fillStyle = colors.cream;
    ctx.fillRect(70, 1135, 940, 2);

    text('STACK / ROLE', 70, 1186, 15, { color: p.line });
    text(role.toUpperCase(), 70, 1230, 27, { color: colors.cream });
    text('CURRENTLY:', 70, 1274, 15, { color: p.line });
    text(title.toUpperCase(), 70, 1318, 23, { color: colors.cream });
    text('#FRAMEINGOA', 1010, 1318, 16, { color: colors.cream, align: 'right' });
}

function framePalette() {
    return {
        arch: { bg: '#0B6839', outer: '#FEE101', inner: '#A66A79' },
        halo: { bg: '#102C20', outer: '#E4D4AA', inner: '#839A78' },
        veranda: { bg: '#31584A', outer: '#FFFBE8', inner: '#A66A79' },
        horizon: { bg: '#0E4935', outer: '#FEE101', inner: '#A66A79' },
        coastline: { bg: '#1D3B38', outer: '#B8C9AC', inner: '#8AA2B8' },
        tile: { bg: '#57473B', outer: '#E4D4AA', inner: '#A66A79' }
    }[frameStyle];
}

function strokeShape(x, y, w, h, shape, radius, color, width) {
    ctx.save();
    ctx.beginPath();
    if (shape === 'circle') {
        ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    } else if (radius) {
        ctx.roundRect(x, y, w, h, radius);
    } else {
        ctx.rect(x, y, w, h);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
}

function drawFrame() {
    const p = framePalette();
    const portrait = orientation === 'portrait';
    canvas.width = portrait ? 1080 : 1350;
    canvas.height = portrait ? 1350 : 1080;
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);
    drawPattern(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = .35;
    ctx.fillStyle = p.outer;
    ctx.beginPath();
    ctx.arc(portrait ? W * .84 : W * .1, portrait ? H * .12 : H * .84, portrait ? 190 : 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const specs = {
        arch: { x: 145, y: 165, w: 790, h: 1020, shape: 'round', radius: 150 },
        halo: { x: 160, y: 255, w: 760, h: 760, shape: 'circle', radius: 0 },
        veranda: { x: 205, y: 135, w: 670, h: 1080, shape: 'round', radius: 62 },
        horizon: { x: 105, y: 160, w: 1140, h: 760, shape: 'round', radius: 92 },
        coastline: { x: 130, y: 205, w: 1090, h: 670, shape: 'round', radius: 260 },
        tile: { x: 115, y: 150, w: 1120, h: 780, shape: 'round', radius: 24 }
    };
    const s = specs[frameStyle];

    ctx.fillStyle = p.outer;
    ctx.beginPath();
    if (s.shape === 'circle') {
        ctx.arc(s.x + s.w / 2, s.y + s.h / 2, Math.min(s.w, s.h) / 2 + 34, 0, Math.PI * 2);
    } else {
        ctx.roundRect(s.x - 34, s.y - 34, s.w + 68, s.h + 68, s.radius + 32);
    }
    ctx.fill();

    drawPhoto(s.x, s.y, s.w, s.h, s.shape, s.radius);
    strokeShape(s.x, s.y, s.w, s.h, s.shape, s.radius, p.inner, 15);
    strokeShape(s.x - 18, s.y - 18, s.w + 36, s.h + 36, s.shape, s.radius + 17, p.bg, 7);

    ctx.strokeStyle = p.inner;
    ctx.lineWidth = 7;
    for (let i = 0; i < 4; i++) {
        const offset = portrait ? 145 + i * 240 : 150 + i * 330;
        line(portrait ? 95 : offset, portrait ? H - 82 : 998, portrait ? 145 : offset + 105, portrait ? H - 82 : 998, 7);
    }
    ctx.restore();
}

function draw() {
    format === 'card' ? drawCard() : drawFrame();
}

function setFormat(next) {
    format = next;

    document.querySelectorAll('.format').forEach(b => {
        const active = b.dataset.format === next;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active);
    });

    document.querySelectorAll('.card-only').forEach(el => el.style.display = next === 'card' ? 'flex' : 'none');
    document.querySelectorAll('.frame-only').forEach(el => el.style.display = next === 'frame' ? 'flex' : 'none');

    syncCropInputs();
    $('output-size').textContent = next === 'card'
        ? '1080 × 1350'
        : orientation === 'portrait' ? '1080 × 1350' : '1350 × 1080';
    draw();
}

function setPhoto(source) {
    const img = new Image();
    img.onload = () => {
        photo = img;
        $('upload-label').textContent = 'PHOTO READY ☼';
        $('drop-zone').classList.add('loaded');
        draw();
        $('share-note').textContent = 'Photo loaded — position it exactly how you want.';
        $('share-note').classList.remove('error');
    };
    img.onerror = () => {
        showError('This HEIC could not be read here — try a JPG or PNG.');
    };
    img.src = source;
}

function showError(message) {
    $('share-note').textContent = message;
    $('share-note').classList.add('error');
}

function loadFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/') && !/\.heic$/i.test(file.name)) {
        showError('Please choose an image file.');
        return;
    }
    const url = URL.createObjectURL(file);
    setPhoto(url);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function filename() {
    return format === 'card' ? 'hh-goa-builder-id.png' : 'hh-goa-pfp-frame.png';
}

function blob() {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    $('camera-video').srcObject = null;
    $('camera-modal').classList.remove('open');
    $('camera-modal').setAttribute('aria-hidden', 'true');
}

async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
        showError('Camera access needs a secure browser. Try uploading a photo instead.');
        return;
    }
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'user' }, width: { ideal: 1080 }, height: { ideal: 1080 } },
            audio: false
        });
        $('camera-video').srcObject = cameraStream;
        $('camera-modal').classList.add('open');
        $('camera-modal').setAttribute('aria-hidden', 'false');
    } catch (err) {
        showError(
            err.name === 'NotAllowedError'
                ? 'Camera permission was declined. You can still upload a photo.'
                : 'Could not open the camera — try uploading a photo.'
        );
    }
}

function capturePhoto() {
    const video = $('camera-video');
    if (!video.videoWidth) return;

    const snap = document.createElement('canvas');
    snap.width = video.videoWidth;
    snap.height = video.videoHeight;

    const snapCtx = snap.getContext('2d');
    snapCtx.translate(snap.width, 0);
    snapCtx.scale(-1, 1);
    snapCtx.drawImage(video, 0, 0, snap.width, snap.height);

    setPhoto(snap.toDataURL('image/jpeg', .94));
    stopCamera();
}

photoInput.addEventListener('change', e => loadFile(e.target.files[0]));

['name-input', 'role-input', 'title-input'].forEach(id => $(id).addEventListener('input', draw));

['zoom-input', 'x-input', 'y-input'].forEach(id => $(id).addEventListener('input', e => {
    const c = activeCrop();
    if (id === 'zoom-input') c.scale = +e.target.value;
    if (id === 'x-input') c.x = +e.target.value;
    if (id === 'y-input') c.y = +e.target.value;
    $('zoom-value').textContent = c.scale + '%' + (c.scale < 100 ? ' · OUT' : '');
    draw();
}));

document.querySelectorAll('.format').forEach(b => b.addEventListener('click', () => setFormat(b.dataset.format)));

function setOrientation(next) {
    orientation = next;
    frameStyle = next === 'portrait' ? 'arch' : 'horizon';

    document.querySelectorAll('.orientation-option').forEach(option => {
        const active = option.dataset.orientation === next;
        option.classList.toggle('active', active);
        option.setAttribute('aria-checked', active);
    });

    document.querySelectorAll('.frame-option').forEach(option => {
        const visible = option.dataset.orientation === next;
        option.hidden = !visible;
        const active = visible && option.dataset.frame === frameStyle;
        option.classList.toggle('active', active);
        option.setAttribute('aria-checked', active);
    });

    if (format === 'frame') {
        $('output-size').textContent = next === 'portrait' ? '1080 × 1350' : '1350 × 1080';
    }
    draw();
}

document.querySelectorAll('.orientation-option').forEach(b => b.addEventListener('click', () => setOrientation(b.dataset.orientation)));

document.querySelectorAll('.frame-option').forEach(b => b.addEventListener('click', () => {
    frameStyle = b.dataset.frame;
    document.querySelectorAll('.frame-option').forEach(option => {
        const active = option === b;
        option.classList.toggle('active', active);
        option.setAttribute('aria-checked', active);
    });
    draw();
}));

document.querySelectorAll('.card-option').forEach(b => b.addEventListener('click', () => {
    cardTheme = b.dataset.card;
    document.querySelectorAll('.card-option').forEach(option => {
        const active = option === b;
        option.classList.toggle('active', active);
        option.setAttribute('aria-checked', active);
    });
    draw();
}));

$('camera-trigger').addEventListener('click', openCamera);
$('camera-close').addEventListener('click', stopCamera);
$('camera-cancel').addEventListener('click', stopCamera);
$('capture-btn').addEventListener('click', capturePhoto);

$('theme-toggle').addEventListener('click', () => {
    const light = document.documentElement.dataset.theme === 'light';
    if (light) {
        delete document.documentElement.dataset.theme;
        $('theme-toggle').setAttribute('aria-label', 'Switch to light mode');
    } else {
        document.documentElement.dataset.theme = 'light';
        $('theme-toggle').setAttribute('aria-label', 'Switch to dark mode');
    }
});

form.addEventListener('submit', e => {
    e.preventDefault();
    if (!photo) {
        photoInput.click();
        $('share-note').textContent = 'First, drop in a photo or take one ☼';
        return;
    }
    draw();
    $('download-btn').disabled = false;
    $('share-btn').disabled = false;
    $('share-note').textContent = 'Ready to make your timeline tropical.';
    $('share-note').classList.remove('error');
});

$('download-btn').addEventListener('click', async () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(await blob());
    a.download = filename();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
});

$('share-btn').addEventListener('click', async () => {
    const caption = 'I’m framing in Goa for HH Goa 2026 ☼ #FrameInGoa';
    const file = new File([await blob()], filename(), { type: 'image/png' });

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        try {
            await navigator.share({ files: [file], text: caption, title: 'HH Goa 2026' });
            return;
        } catch (e) {
            if (e.name === 'AbortError') return;
        }
    }

    window.open('https://x.com/intent/post?text=' + encodeURIComponent(caption), '_blank', 'noopener');
    $('share-note').textContent = 'Your image is ready — download it, then attach it to your pre-filled X post.';
});

document.fonts.ready.then(() => {
    syncCropInputs();
    setOrientation('portrait');
    draw();
});