/* ============================================
   QR Code Simulator — Interactive Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initScrollAnimations();
    initHeroStats();
    initHeroQR();
    initAnatomy();
    initEncodingModes();
    initPipeline();
    initReedSolomon();
    initMasks();
    initDecodingTimeline();
    initGenerator();
});

/* ============================
   Navigation
   ============================ */
function initNav() {
    const nav = document.getElementById('main-nav');
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);

        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 200) {
                current = s.id;
            }
        });
        links.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + current);
        });
    });
}

/* ============================
   Scroll Animations
   ============================ */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, i * 80);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll(
        '.section-header, .feature-card, .anatomy-btn, .decode-step, .fact-card, .big-stat, .rs-info-card, .penalty-card'
    ).forEach(el => observer.observe(el));
}

/* ============================
   Hero Stats Counter
   ============================ */
function initHeroStats() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroEl = document.getElementById('hero');
    if (heroEl) observer.observe(heroEl);
}

function animateCounters() {
    document.querySelectorAll('.stat-number[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count);
        const duration = 1500;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

/* ============================
   Hero QR Canvas
   ============================ */
function initHeroQR() {
    const canvas = document.getElementById('hero-qr-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 350;
    const modules = 25;
    const cellSize = size / modules;

    // Generate a sample QR-like pattern
    const grid = generateSampleQR(modules);

    // Color map for regions
    const regions = buildRegionMap(modules);

    let hoveredRegion = null;

    function draw() {
        ctx.clearRect(0, 0, size, size);

        // Background
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, size, size);

        for (let r = 0; r < modules; r++) {
            for (let c = 0; c < modules; c++) {
                const region = regions[r][c];
                let color;

                if (grid[r][c]) {
                    if (hoveredRegion && region === hoveredRegion) {
                        color = getRegionColor(region);
                    } else if (hoveredRegion) {
                        color = '#1a1a2e';
                    } else {
                        color = region === 'data' ? '#e8e8f0' : getRegionColor(region);
                    }
                } else {
                    if (hoveredRegion && region === hoveredRegion) {
                        color = getRegionColor(region) + '40';
                    } else {
                        color = 'transparent';
                    }
                }

                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    const padding = 0.5;
                    ctx.beginPath();
                    ctx.roundRect(
                        c * cellSize + padding,
                        r * cellSize + padding,
                        cellSize - padding * 2,
                        cellSize - padding * 2,
                        2
                    );
                    ctx.fill();
                }
            }
        }
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / cellSize);
        const y = Math.floor((e.clientY - rect.top) / cellSize);
        if (x >= 0 && x < modules && y >= 0 && y < modules) {
            const newRegion = regions[y][x];
            if (newRegion !== hoveredRegion) {
                hoveredRegion = newRegion;
                draw();
            }
        }
    });

    canvas.addEventListener('mouseleave', () => {
        hoveredRegion = null;
        draw();
    });

    draw();
}

function generateSampleQR(n) {
    const grid = Array.from({ length: n }, () => Array(n).fill(false));

    // Finder patterns
    drawFinderPattern(grid, 0, 0);
    drawFinderPattern(grid, 0, n - 7);
    drawFinderPattern(grid, n - 7, 0);

    // Timing patterns
    for (let i = 8; i < n - 8; i++) {
        grid[6][i] = i % 2 === 0;
        grid[i][6] = i % 2 === 0;
    }

    // Alignment
    const ac = n - 9;
    for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
            const isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            grid[ac + dr][ac + dc] = isEdge || isCenter;
        }
    }

    // Random data area
    const rng = mulberry32(42);
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (!isStructural(r, c, n) && grid[r][c] === false) {
                grid[r][c] = rng() > 0.5;
            }
        }
    }

    return grid;
}

function drawFinderPattern(grid, startR, startC) {
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            grid[startR + r][startC + c] = isOuter || isInner;
        }
    }
}

function isStructural(r, c, n) {
    // Finder regions (with separator)
    if (r < 8 && c < 8) return true;
    if (r < 8 && c >= n - 8) return true;
    if (r >= n - 8 && c < 8) return true;
    // Timing
    if (r === 6 || c === 6) return true;
    // Alignment
    const ac = n - 9;
    if (Math.abs(r - ac) <= 2 && Math.abs(c - ac) <= 2) return true;
    return false;
}

function buildRegionMap(n) {
    const map = Array.from({ length: n }, () => Array(n).fill('data'));

    // Finders
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) map[r][c] = 'finder';
    for (let r = 0; r < 8; r++) for (let c = n - 8; c < n; c++) map[r][c] = 'finder';
    for (let r = n - 8; r < n; r++) for (let c = 0; c < 8; c++) map[r][c] = 'finder';

    // Timing
    for (let i = 8; i < n - 8; i++) {
        map[6][i] = 'timing';
        map[i][6] = 'timing';
    }

    // Alignment
    const ac = n - 9;
    for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
            map[ac + dr][ac + dc] = 'alignment';
        }
    }

    // Format info (simplified)
    for (let i = 0; i < 9; i++) {
        if (i < n) map[8][i] = 'format';
        if (i < n) map[i][8] = 'format';
    }

    return map;
}

function getRegionColor(region) {
    const colors = {
        finder: '#FF6B6B',
        timing: '#4ECDC4',
        alignment: '#45B7D1',
        format: '#F7DC6F',
        data: '#BB8FCE'
    };
    return colors[region] || '#e8e8f0';
}

function mulberry32(a) {
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/* ============================
   Anatomy Interactive Canvas
   ============================ */
function initAnatomy() {
    const canvas = document.getElementById('anatomy-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 450;
    const modules = 25;
    const cellSize = size / modules;
    const grid = generateSampleQR(modules);
    const regions = buildRegionMap(modules);
    let activePart = 'finder';

    const buttons = document.querySelectorAll('.anatomy-btn');

    function draw() {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, size, size);

        for (let r = 0; r < modules; r++) {
            for (let c = 0; c < modules; c++) {
                const region = regions[r][c];
                const isActive = region === activePart;
                let color;

                if (grid[r][c]) {
                    color = isActive ? getRegionColor(region) : '#1e1e3a';
                } else {
                    color = isActive ? getRegionColor(region) + '30' : 'transparent';
                }

                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.roundRect(
                        c * cellSize + 0.5,
                        r * cellSize + 0.5,
                        cellSize - 1,
                        cellSize - 1,
                        2
                    );
                    ctx.fill();
                }
            }
        }

        // Labels
        if (activePart === 'finder') {
            drawLabel(ctx, 'Finder', 3.5 * cellSize, 3.5 * cellSize);
        } else if (activePart === 'timing') {
            drawLabel(ctx, 'Timing', 12 * cellSize, 6 * cellSize);
        } else if (activePart === 'alignment') {
            drawLabel(ctx, 'Alignment', (modules - 9) * cellSize, (modules - 9) * cellSize);
        } else if (activePart === 'format') {
            drawLabel(ctx, 'Format', 8 * cellSize, 4 * cellSize);
        } else if (activePart === 'data') {
            drawLabel(ctx, 'Data + ECC', 14 * cellSize, 14 * cellSize);
        }
    }

    function drawLabel(ctx, text, x, y) {
        ctx.font = '600 12px Inter';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(text);
        const pad = 6;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(x - metrics.width / 2 - pad, y - 8 - pad, metrics.width + pad * 2, 16 + pad * 2, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, y);
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activePart = btn.dataset.part;
            draw();
        });
    });

    draw();
}

/* ============================
   Encoding Modes Detector
   ============================ */
function initEncodingModes() {
    const input = document.getElementById('mode-input');
    const modeDisplay = document.getElementById('detected-mode');
    const bitsDisplay = document.getElementById('detected-bits');
    if (!input) return;

    input.addEventListener('input', () => {
        const val = input.value;
        if (!val) {
            modeDisplay.textContent = '—';
            bitsDisplay.textContent = 'Enter text above';
            document.querySelectorAll('.mode-row').forEach(r => r.classList.remove('highlighted'));
            return;
        }

        const mode = detectMode(val);
        modeDisplay.textContent = mode.name;
        bitsDisplay.textContent = `${mode.totalBits} bits total (${mode.bitsPerChar} bits/char × ${val.length})`;

        document.querySelectorAll('.mode-row').forEach(r => r.classList.remove('highlighted'));
        document.getElementById('mode-' + mode.id)?.classList.add('highlighted');
    });
}

function detectMode(str) {
    if (/^\d+$/.test(str)) {
        return { name: 'Numeric', id: 'numeric', bitsPerChar: '3.33', totalBits: Math.ceil(str.length * 3.33) };
    }
    if (/^[0-9A-Z $%*+\-./:]+$/.test(str)) {
        return { name: 'Alphanumeric', id: 'alphanumeric', bitsPerChar: '5.5', totalBits: Math.ceil(str.length * 5.5) };
    }
    // Check for Kanji (simplified)
    if (/[\u3000-\u9FFF]/.test(str)) {
        return { name: 'Kanji', id: 'kanji', bitsPerChar: '13', totalBits: str.length * 13 };
    }
    return { name: 'Byte', id: 'byte', bitsPerChar: '8', totalBits: str.length * 8 };
}

/* ============================
   Encoding Pipeline Simulation
   ============================ */
function initPipeline() {
    const input = document.getElementById('pipeline-input');
    const startBtn = document.getElementById('pipeline-start');
    const prevBtn = document.getElementById('pipeline-prev');
    const nextBtn = document.getElementById('pipeline-next');
    const autoBtn = document.getElementById('pipeline-auto');
    const stepLabel = document.getElementById('pipeline-step-label');
    const detailPanel = document.getElementById('pipeline-detail');
    const stepEls = document.querySelectorAll('.pipeline-step');
    if (!input) return;

    let currentStep = 0;
    let pipelineData = null;
    let autoInterval = null;

    function resetPipeline() {
        currentStep = 0;
        clearInterval(autoInterval);
        autoInterval = null;
        stepEls.forEach(s => {
            s.classList.remove('active', 'completed');
        });
        updateControls();
        detailPanel.innerHTML = `<div class="pipeline-placeholder"><div class="placeholder-icon">⚡</div><p>Press <strong>Start Pipeline</strong> to begin encoding</p></div>`;
    }

    function updateControls() {
        stepLabel.textContent = `Step ${currentStep} / 7`;
        prevBtn.disabled = currentStep <= 0;
        nextBtn.disabled = currentStep >= 7 || currentStep === 0;
    }

    function goToStep(step) {
        currentStep = step;
        stepEls.forEach((s, i) => {
            const sNum = i + 1;
            s.classList.remove('active', 'completed');
            if (sNum < currentStep) s.classList.add('completed');
            else if (sNum === currentStep) s.classList.add('active');
        });
        updateControls();
        renderStepDetail(currentStep);
    }

    startBtn.addEventListener('click', () => {
        const text = input.value.trim() || 'HELLO';
        pipelineData = runPipelineSimulation(text);
        goToStep(1);
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) goToStep(currentStep - 1);
    });

    nextBtn.addEventListener('click', () => {
        if (currentStep < 7) goToStep(currentStep + 1);
    });

    autoBtn.addEventListener('click', () => {
        if (autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
            autoBtn.textContent = '⏩ Auto Play';
            return;
        }
        if (currentStep === 0) {
            const text = input.value.trim() || 'HELLO';
            pipelineData = runPipelineSimulation(text);
        }
        if (currentStep >= 7) currentStep = 0;
        autoBtn.textContent = '⏸ Pause';
        autoInterval = setInterval(() => {
            if (currentStep >= 7) {
                clearInterval(autoInterval);
                autoInterval = null;
                autoBtn.textContent = '⏩ Auto Play';
                return;
            }
            goToStep(currentStep + 1);
        }, 2000);
    });

    function renderStepDetail(step) {
        if (!pipelineData) return;
        const d = pipelineData;
        let html = '';

        switch (step) {
            case 1:
                html = `<div class="pipeline-detail-content">
                    <h3>Step 1: Content Analysis</h3>
                    <p class="detail-desc">The encoder scans the input "<strong>${d.input}</strong>" to determine the optimal encoding mode.</p>
                    <div class="detail-box">
Input Text:  "${d.input}"
Characters:  ${d.input.length}
Detected:    <span class="highlight">${d.mode.name} Mode</span>
Indicator:   <span class="header-bits">${d.modeIndicator}</span>
Efficiency:  ${d.mode.bitsPerChar} bits per character</div>
                </div>`;
                break;
            case 2:
                html = `<div class="pipeline-detail-content">
                    <h3>Step 2: Data Encoding</h3>
                    <p class="detail-desc">Each character is converted to its binary representation using ${d.mode.name} encoding rules.</p>
                    <div class="detail-box">${d.charBreakdown.map(c =>
                    `'${c.char}' → ${c.code} → <span class="data-bits">${c.binary}</span>`
                ).join('\n')}

Complete Data Bitstream:
<span class="data-bits">${d.dataBits}</span>
(${d.dataBits.length} bits)</div>
                </div>`;
                break;
            case 3:
                html = `<div class="pipeline-detail-content">
                    <h3>Step 3: Header Addition</h3>
                    <p class="detail-desc">Mode indicator and character count prefix are prepended to the data bitstream.</p>
                    <div class="detail-box">Mode Indicator:    <span class="header-bits">${d.modeIndicator}</span>  (${d.mode.name})
Character Count:   <span class="header-bits">${d.countBits}</span>  (${d.input.length} chars)
Data Bits:         <span class="data-bits">${d.dataBits}</span>
Terminator:        <span class="header-bits">0000</span>

Complete Stream:
<span class="header-bits">${d.modeIndicator}</span><span class="header-bits">${d.countBits}</span><span class="data-bits">${d.dataBits}</span><span class="header-bits">0000</span>

Total: ${d.fullBitstream.length} bits</div>
                </div>`;
                break;
            case 4:
                html = `<div class="pipeline-detail-content">
                    <h3>Step 4: ECC Calculation (Reed-Solomon)</h3>
                    <p class="detail-desc">Error correction codewords are computed using polynomial division over GF(256).</p>
                    <div class="detail-box">Data Codewords:  ${d.dataCodewords.join(' ')}
                    
ECC Level:       M (15% recovery)
Generator Poly:  α⁰ + α⁸⁷x + α²²⁹x² + ...

<span class="ecc-bits">ECC Codewords:   ${d.eccCodewords.join(' ')}</span>

Reed-Solomon encodes ${d.dataCodewords.length} data words
with ${d.eccCodewords.length} error correction words.</div>
                </div>`;
                break;
            case 5:
                html = `<div class="pipeline-detail-content">
                    <h3>Step 5: Interleaving</h3>
                    <p class="detail-desc">Data and ECC blocks are interleaved column-wise for maximum robustness against burst errors.</p>
                    <div class="detail-box">Data Blocks:
  Block 1: <span class="data-bits">[${d.dataCodewords.slice(0, Math.ceil(d.dataCodewords.length / 2)).join(', ')}]</span>
  Block 2: <span class="data-bits">[${d.dataCodewords.slice(Math.ceil(d.dataCodewords.length / 2)).join(', ')}]</span>

ECC Blocks:
  Block 1: <span class="ecc-bits">[${d.eccCodewords.slice(0, Math.ceil(d.eccCodewords.length / 2)).join(', ')}]</span>
  Block 2: <span class="ecc-bits">[${d.eccCodewords.slice(Math.ceil(d.eccCodewords.length / 2)).join(', ')}]</span>

Interleaved: Data blocks shuffled then ECC appended
→ Localized damage spread across blocks for recovery</div>
                </div>`;
                break;
            case 6:
                html = `<div class="pipeline-detail-content">
                    <h3>Step 6: Mask Application</h3>
                    <p class="detail-desc">Eight mask patterns are evaluated. The one with the lowest penalty score is applied via XOR.</p>
                    <div class="detail-box">Evaluating all 8 mask patterns...

Mask 0: (r+c) mod 2 == 0          → Penalty: ${300 + Math.floor(Math.random() * 200)}
Mask 1: r mod 2 == 0               → Penalty: ${350 + Math.floor(Math.random() * 200)}
Mask 2: c mod 3 == 0               → Penalty: ${280 + Math.floor(Math.random() * 200)}
Mask 3: (r+c) mod 3 == 0           → Penalty: ${310 + Math.floor(Math.random() * 200)}
Mask 4: (r/2+c/3) mod 2 == 0       → Penalty: ${290 + Math.floor(Math.random() * 200)}
Mask 5: (rc)mod2+(rc)mod3 == 0      → Penalty: ${270 + Math.floor(Math.random() * 200)}
Mask 6: ((rc)mod2+(rc)mod3)mod2==0  → Penalty: ${260 + Math.floor(Math.random() * 200)}
Mask 7: ((r+c)mod2+(rc)mod3)mod2==0 → Penalty: ${340 + Math.floor(Math.random() * 200)}

<span class="highlight">✓ Best: Mask ${d.bestMask} selected (lowest penalty)</span></div>
                </div>`;
                break;
            case 7:
                html = `<div class="pipeline-detail-content">
                    <h3>Step 7: Matrix Finalization</h3>
                    <p class="detail-desc">Fixed patterns (finders, timing, alignment) are overlaid, format info encoded. QR code complete!</p>
                    <div class="detail-canvas-row">
                        <canvas id="pipeline-final-qr" width="250" height="250"></canvas>
                        <div class="detail-box" style="flex:1">Assembly complete:
✓ Finder patterns placed
✓ Timing patterns added
✓ Alignment patterns set
✓ Format information encoded
✓ Mask ${d.bestMask} applied
✓ Data + ECC modules filled

<span class="highlight">Version ${d.version} (${d.gridSize}×${d.gridSize})</span>
Mode: ${d.mode.name}
ECC Level: M

QR Code is ready to scan! →</div>
                    </div>
                </div>`;
                setTimeout(() => {
                    drawPipelineFinalQR(d.input);
                }, 100);
                break;
        }
        detailPanel.innerHTML = html;
    }
}

function runPipelineSimulation(text) {
    const mode = detectMode(text.toUpperCase());
    const modeIndicators = { Numeric: '0001', Alphanumeric: '0010', Byte: '0100', Kanji: '1000' };
    const modeIndicator = modeIndicators[mode.name] || '0100';

    let charBreakdown = [];
    let dataBits = '';

    if (mode.name === 'Alphanumeric') {
        const alphaTable = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
        const upper = text.toUpperCase();
        for (let i = 0; i < upper.length; i += 2) {
            if (i + 1 < upper.length) {
                const val = alphaTable.indexOf(upper[i]) * 45 + alphaTable.indexOf(upper[i + 1]);
                const bin = val.toString(2).padStart(11, '0');
                charBreakdown.push({ char: upper[i] + upper[i + 1], code: val, binary: bin });
                dataBits += bin;
            } else {
                const val = alphaTable.indexOf(upper[i]);
                const bin = val.toString(2).padStart(6, '0');
                charBreakdown.push({ char: upper[i], code: val, binary: bin });
                dataBits += bin;
            }
        }
    } else if (mode.name === 'Numeric') {
        for (let i = 0; i < text.length; i += 3) {
            const group = text.substring(i, Math.min(i + 3, text.length));
            const val = parseInt(group);
            const bits = group.length === 3 ? 10 : group.length === 2 ? 7 : 4;
            const bin = val.toString(2).padStart(bits, '0');
            charBreakdown.push({ char: group, code: val, binary: bin });
            dataBits += bin;
        }
    } else {
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            const bin = code.toString(2).padStart(8, '0');
            charBreakdown.push({ char: text[i], code: code, binary: bin });
            dataBits += bin;
        }
    }

    const countBits = text.length.toString(2).padStart(mode.name === 'Byte' ? 8 : 9, '0');
    const fullBitstream = modeIndicator + countBits + dataBits + '0000';

    // Generate pseudo codewords
    const dataCodewords = [];
    for (let i = 0; i < fullBitstream.length; i += 8) {
        const byte = fullBitstream.substring(i, i + 8).padEnd(8, '0');
        dataCodewords.push(parseInt(byte, 2));
    }

    // Pseudo ECC
    const rng = mulberry32(text.length * 7 + 13);
    const eccCodewords = Array.from({ length: 10 }, () => Math.floor(rng() * 256));

    // Version estimation
    const totalBits = fullBitstream.length + eccCodewords.length * 8;
    let version = 1;
    const capacities = [0, 41, 77, 127, 187, 255, 322, 370, 461, 552, 652];
    for (let v = 1; v < capacities.length; v++) {
        if (text.length <= capacities[v]) { version = v; break; }
    }
    const gridSize = 17 + version * 4;

    return {
        input: text,
        mode,
        modeIndicator,
        charBreakdown,
        dataBits,
        countBits,
        fullBitstream,
        dataCodewords,
        eccCodewords,
        bestMask: Math.floor(rng() * 8),
        version,
        gridSize
    };
}

function drawPipelineFinalQR(text) {
    const canvas = document.getElementById('pipeline-final-qr');
    if (!canvas) return;
    try {
        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        const ctx = canvas.getContext('2d');
        const count = qr.getModuleCount();
        const cellSize = 250 / count;

        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, 250, 250);

        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                if (qr.isDark(r, c)) {
                    ctx.fillStyle = '#a78bfa';
                    ctx.beginPath();
                    ctx.roundRect(c * cellSize + 0.5, r * cellSize + 0.5, cellSize - 1, cellSize - 1, 1);
                    ctx.fill();
                }
            }
        }
    } catch (e) {
        console.warn('QR generation failed', e);
    }
}

/* ============================
   Reed-Solomon Demo
   ============================ */
function initReedSolomon() {
    const canvas = document.getElementById('rs-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 300;
    const modules = 21;
    const cellSize = size / modules;

    // Generate QR
    let grid;
    let damaged;
    try {
        const qr = qrcode(0, 'H');
        qr.addData('REED-SOLOMON');
        qr.make();
        const count = qr.getModuleCount();
        grid = Array.from({ length: count }, (_, r) =>
            Array.from({ length: count }, (_, c) => qr.isDark(r, c))
        );
    } catch (e) {
        grid = generateSampleQR(modules);
    }

    damaged = grid.map(row => [...row]);
    let damageMap = grid.map(row => row.map(() => false));
    let recovered = false;

    function draw() {
        const count = damaged.length;
        const cs = size / count;
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, size, size);

        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                let color;
                if (damageMap[r][c]) {
                    color = recovered ? '#22c55e' : '#ef4444';
                } else if (damaged[r][c]) {
                    color = '#e8e8f0';
                } else {
                    color = 'transparent';
                }
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.roundRect(c * cs + 0.5, r * cs + 0.5, cs - 1, cs - 1, 1);
                    ctx.fill();
                }
            }
        }

        // Update meter
        let totalModules = 0, damagedModules = 0;
        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                totalModules++;
                if (damageMap[r][c]) damagedModules++;
            }
        }
        const pct = Math.round((damagedModules / totalModules) * 100);
        document.getElementById('rs-meter-fill').style.width = pct + '%';
        document.getElementById('rs-meter-pct').textContent = pct + '%';
    }

    document.getElementById('rs-damage-btn').addEventListener('click', () => {
        recovered = false;
        const count = damaged.length;
        const cr = Math.floor(Math.random() * (count - 4)) + 2;
        const cc = Math.floor(Math.random() * (count - 4)) + 2;
        const radius = 2 + Math.floor(Math.random() * 2);

        for (let r = cr - radius; r <= cr + radius; r++) {
            for (let c = cc - radius; c <= cc + radius; c++) {
                if (r >= 0 && r < count && c >= 0 && c < count) {
                    if (Math.random() > 0.3) {
                        damaged[r][c] = !grid[r][c]; // flip
                        damageMap[r][c] = true;
                    }
                }
            }
        }
        draw();
    });

    document.getElementById('rs-recover-btn').addEventListener('click', () => {
        recovered = true;
        // Animate recovery
        const count = damaged.length;
        let cells = [];
        for (let r = 0; r < count; r++) {
            for (let c = 0; c < count; c++) {
                if (damageMap[r][c]) cells.push([r, c]);
            }
        }
        let i = 0;
        function recoverNext() {
            if (i >= cells.length) return;
            const batch = Math.min(3, cells.length - i);
            for (let b = 0; b < batch; b++) {
                const [r, c] = cells[i + b];
                damaged[r][c] = grid[r][c];
            }
            i += batch;
            draw();
            requestAnimationFrame(recoverNext);
        }
        recoverNext();
    });

    document.getElementById('rs-reset-btn').addEventListener('click', () => {
        damaged = grid.map(row => [...row]);
        damageMap = grid.map(row => row.map(() => false));
        recovered = false;
        draw();
    });

    // Click to damage
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const count = damaged.length;
        const cs = size / count;
        const c = Math.floor((e.clientX - rect.left) / cs);
        const r = Math.floor((e.clientY - rect.top) / cs);
        if (r >= 0 && r < count && c >= 0 && c < count) {
            recovered = false;
            damaged[r][c] = !damaged[r][c];
            damageMap[r][c] = true;
            draw();
        }
    });

    draw();
}

/* ============================
   Mask Patterns
   ============================ */
function initMasks() {
    const canvas = document.getElementById('mask-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 350;
    const modules = 21;
    const cellSize = size / modules;

    const maskFormulas = [
        { fn: (r, c) => (r + c) % 2 === 0, text: '(row + col) mod 2 == 0' },
        { fn: (r, c) => r % 2 === 0, text: 'row mod 2 == 0' },
        { fn: (r, c) => c % 3 === 0, text: 'col mod 3 == 0' },
        { fn: (r, c) => (r + c) % 3 === 0, text: '(row + col) mod 3 == 0' },
        { fn: (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, text: '(⌊row/2⌋ + ⌊col/3⌋) mod 2 == 0' },
        { fn: (r, c) => (r * c) % 2 + (r * c) % 3 === 0, text: '(rc) mod 2 + (rc) mod 3 == 0' },
        { fn: (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0, text: '((rc) mod 2 + (rc) mod 3) mod 2 == 0' },
        { fn: (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0, text: '((r+c) mod 2 + (rc) mod 3) mod 2 == 0' },
    ];

    let currentMask = 0;

    function drawMask(maskIndex) {
        const mask = maskFormulas[maskIndex];
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, size, size);

        // Penalty calculations
        let penalty1 = 0, penalty2 = 0, penalty3 = 0, penalty4 = 0;
        let blackCount = 0;

        for (let r = 0; r < modules; r++) {
            for (let c = 0; c < modules; c++) {
                const isBlack = mask.fn(r, c);
                if (isBlack) blackCount++;

                const hue = isBlack ? 250 : 0;
                const lightness = isBlack ? 30 : 85;
                ctx.fillStyle = `hsl(${hue}, 60%, ${lightness}%)`;
                ctx.beginPath();
                ctx.roundRect(c * cellSize + 0.5, r * cellSize + 0.5, cellSize - 1, cellSize - 1, 2);
                ctx.fill();
            }
        }

        // Simplified penalty scoring
        // Rule 1: consecutive same color
        for (let r = 0; r < modules; r++) {
            let run = 1;
            for (let c = 1; c < modules; c++) {
                if (mask.fn(r, c) === mask.fn(r, c - 1)) { run++; }
                else { if (run >= 5) penalty1 += 3 + (run - 5); run = 1; }
            }
            if (run >= 5) penalty1 += 3 + (run - 5);
        }

        // Rule 2: 2x2 blocks
        for (let r = 0; r < modules - 1; r++) {
            for (let c = 0; c < modules - 1; c++) {
                const v = mask.fn(r, c);
                if (v === mask.fn(r, c + 1) && v === mask.fn(r + 1, c) && v === mask.fn(r + 1, c + 1)) {
                    penalty2 += 3;
                }
            }
        }

        // Rule 3: finder-like (simplified)
        penalty3 = 40 + maskIndex * 10;

        // Rule 4: ratio imbalance
        const total = modules * modules;
        const ratio = blackCount / total;
        penalty4 = Math.floor(Math.abs(ratio - 0.5) * 200);

        const totalPenalty = penalty1 + penalty2 + penalty3 + penalty4;

        document.getElementById('penalty-1').textContent = `Score: ${penalty1}`;
        document.getElementById('penalty-2').textContent = `Score: ${penalty2}`;
        document.getElementById('penalty-3').textContent = `Score: ${penalty3}`;
        document.getElementById('penalty-4').textContent = `Score: ${penalty4}`;
        document.getElementById('penalty-total').textContent = totalPenalty;
        document.getElementById('mask-formula').textContent = `Formula: ${mask.text}`;
    }

    document.querySelectorAll('.mask-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mask-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMask = parseInt(btn.dataset.mask);
            drawMask(currentMask);
        });
    });

    drawMask(0);
}

/* ============================
   Decoding Timeline
   ============================ */
function initDecodingTimeline() {
    // Animate decode steps on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.decode-step').forEach(s => observer.observe(s));

    // Draw mini visuals
    drawDecodeVisual1();
    drawDecodeVisual2();
}

function drawDecodeVisual1() {
    const container = document.getElementById('decode-vis-1');
    if (!container) return;
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 200, 200);

    // Simulated camera view with finder detection
    const cs = 8;
    const off = 10;

    // Draw mini QR
    const pattern = generateSampleQR(21);
    for (let r = 0; r < 21; r++) {
        for (let c = 0; c < 21; c++) {
            if (pattern[r][c]) {
                ctx.fillStyle = '#555';
                ctx.fillRect(off + c * cs, off + r * cs, cs - 1, cs - 1);
            }
        }
    }

    // Highlight finders
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.strokeRect(off - 2, off - 2, 7 * cs + 4, 7 * cs + 4);
    ctx.strokeRect(off + 14 * cs - 2, off - 2, 7 * cs + 4, 7 * cs + 4);
    ctx.strokeRect(off - 2, off + 14 * cs - 2, 7 * cs + 4, 7 * cs + 4);
    ctx.setLineDash([]);

    // Labels
    ctx.font = '600 10px Inter';
    ctx.fillStyle = '#FF6B6B';
    ctx.fillText('Found!', off + 10, off + 7 * cs + 14);
}

function drawDecodeVisual2() {
    const container = document.getElementById('decode-vis-2');
    if (!container) return;
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 200, 200);

    // Draw skewed grid
    ctx.save();
    ctx.setTransform(1, 0.1, -0.1, 1, 30, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 15; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 10, 0);
        ctx.lineTo(i * 10, 150);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 10);
        ctx.lineTo(150, i * 10);
        ctx.stroke();
    }
    ctx.restore();

    // Arrow
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, 90);
    ctx.lineTo(120, 90);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(115, 85);
    ctx.lineTo(120, 90);
    ctx.lineTo(115, 95);
    ctx.stroke();

    // Corrected grid
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(130 + i * 8, 50);
        ctx.lineTo(130 + i * 8, 114);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(130, 50 + i * 8);
        ctx.lineTo(194, 50 + i * 8);
        ctx.stroke();
    }

    ctx.font = '600 9px Inter';
    ctx.fillStyle = '#4ECDC4';
    ctx.fillText('Corrected', 138, 135);
}

/* ============================
   QR Code Generator
   ============================ */
function initGenerator() {
    const input = document.getElementById('gen-input');
    const canvas = document.getElementById('gen-qr-canvas');
    const charCount = document.getElementById('gen-char-count');
    const downloadBtn = document.getElementById('gen-download');
    if (!input || !canvas) return;

    const ctx = canvas.getContext('2d');
    let currentECC = 'M';

    function generate() {
        const text = input.value || 'Hello';
        charCount.textContent = text.length;

        try {
            const eccMap = { L: 1, M: 0, Q: 3, H: 2 };
            const qr = qrcode(0, currentECC);
            qr.addData(text);
            qr.make();

            const count = qr.getModuleCount();
            const cellSize = 380 / count;
            const offset = 10;

            ctx.clearRect(0, 0, 400, 400);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 400, 400);

            for (let r = 0; r < count; r++) {
                for (let c = 0; c < count; c++) {
                    if (qr.isDark(r, c)) {
                        ctx.fillStyle = '#1a1a2e';
                        ctx.beginPath();
                        ctx.roundRect(
                            offset + c * cellSize + 0.5,
                            offset + r * cellSize + 0.5,
                            cellSize - 1,
                            cellSize - 1,
                            Math.max(1, cellSize / 5)
                        );
                        ctx.fill();
                    }
                }
            }

            // Update info
            const version = Math.ceil((count - 17) / 4);
            document.getElementById('gen-version').textContent = version;
            document.getElementById('gen-size').textContent = `${count}×${count}`;
            document.getElementById('gen-mode').textContent = detectMode(text).name;
            document.getElementById('gen-modules').textContent = (count * count).toLocaleString();

        } catch (e) {
            ctx.clearRect(0, 0, 400, 400);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 400, 400);
            ctx.font = '500 14px Inter';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('Text too long for QR code', 200, 200);
        }
    }

    input.addEventListener('input', generate);

    document.querySelectorAll('.ecc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ecc-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentECC = btn.dataset.ecc;
            generate();
        });
    });

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    generate();
}
