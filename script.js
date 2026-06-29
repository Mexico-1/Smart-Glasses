
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

        const mobBtn = document.getElementById('mob-btn');
        const mobMenu = document.getElementById('mob-menu');
        let menuOpen = false;
        mobBtn.addEventListener('click', () => {
            menuOpen = !menuOpen;
            mobMenu.classList.toggle('hidden', !menuOpen);
            mobBtn.innerHTML = menuOpen ? '<i class="fas fa-times text-xl"></i>' : '<i class="fas fa-bars text-xl"></i>';
        });
        mobMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            menuOpen = false; mobMenu.classList.add('hidden');
            mobBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
        }));

        // ========== Sound System ==========
        let audioCtx = null;
        let soundEnabled = true;
        let buzzerInterval = null;
        let isBeeping = false;

        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        }

        // Auto-init audio on first user interaction (browser requirement)
        function autoInitAudio() {
            initAudio();
            // Play a tiny silent sound to fully unlock the context
            if (audioCtx && audioCtx.state === 'running') {
                try {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(20, audioCtx.currentTime);
                    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.01);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(audioCtx.currentTime);
                    osc.stop(audioCtx.currentTime + 0.02);
                } catch(e) {}
            }
        }

        // Listen for first interaction to unlock audio
        const initEvents = ['click', 'touchstart', 'pointerdown', 'keydown'];
        let audioUnlocked = false;
        function onFirstInteraction() {
            if (audioUnlocked) return;
            audioUnlocked = true;
            autoInitAudio();
            // Re-trigger current simulation state so sound starts immediately
            updateDemo(parseInt(document.getElementById('dist-slider').value));
            initEvents.forEach(evt => document.removeEventListener(evt, onFirstInteraction));
        }
        initEvents.forEach(evt => document.addEventListener(evt, onFirstInteraction, { once: false, passive: true }));

        function playBeep(frequency, duration) {
            if (!audioCtx || !soundEnabled) return;
            try {
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
                gain.gain.setValueAtTime(0, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.005);
                gain.gain.setValueAtTime(0.25, audioCtx.currentTime + duration * 0.001 * 0.7);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration * 0.001);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + duration * 0.001 + 0.01);
            } catch(e) {}
        }

        function playTransitionTone(type) {
            if (!audioCtx || !soundEnabled) return;
            try {
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                if (type === 'danger') {
                    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                    osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
                    osc.connect(gain); gain.connect(audioCtx.destination);
                    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.35);
                } else if (type === 'safe') {
                    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                    osc.frequency.linearRampToValueAtTime(300, audioCtx.currentTime + 0.25);
                    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
                    osc.connect(gain); gain.connect(audioCtx.destination);
                    osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.35);
                }
            } catch(e) {}
        }

        function stopBuzzerLoop() {
            if (buzzerInterval) { clearInterval(buzzerInterval); buzzerInterval = null; }
            isBeeping = false;
        }

        function startBuzzerLoop(zone) {
            stopBuzzerLoop();
            isBeeping = true;
            let onTime, offTime, freq;
            if (zone === 'danger') { onTime = 50; offTime = 50; freq = 2500; }
            else if (zone === 'warning') { onTime = 150; offTime = 150; freq = 2000; }
            else if (zone === 'caution') { onTime = 300; offTime = 300; freq = 1500; }
            else return;
            playBeep(freq, onTime);
            buzzerInterval = setInterval(() => {
                if (!soundEnabled || !isBeeping) { stopBuzzerLoop(); return; }
                playBeep(freq, onTime);
            }, onTime + offTime);
        }

        // Sound toggle button — starts ON
        const soundBtn = document.getElementById('sound-btn');
        const soundIcon = document.getElementById('sound-icon');
        const soundLabel = document.getElementById('sound-label');

        soundBtn.addEventListener('click', () => {
            initAudio();
            soundEnabled = !soundEnabled;
            soundBtn.classList.toggle('active', soundEnabled);
            if (soundEnabled) {
                soundIcon.className = 'fas fa-volume-high';
                soundLabel.textContent = 'Sound On';
                soundBtn.classList.add('active');
                soundBtn.style.borderColor = 'rgba(245,158,11,0.4)';
                soundBtn.style.background = 'rgba(245,158,11,0.15)';
                soundBtn.style.color = '#fbbf24';
                showToast('Sound enabled');
                playBeep(1200, 80);
                setTimeout(() => playBeep(1600, 80), 120);
            } else {
                soundIcon.className = 'fas fa-volume-xmark';
                soundLabel.textContent = 'Sound Off';
                soundBtn.classList.remove('active');
                soundBtn.style.borderColor = 'rgba(255,255,255,0.1)';
                soundBtn.style.background = 'rgba(255,255,255,0.03)';
                soundBtn.style.color = '#9ca3af';
                stopBuzzerLoop();
                showToast('Sound disabled');
            }
            updateDemo(parseInt(document.getElementById('dist-slider').value));
        });

        // ========== Simulation ==========
        const slider = document.getElementById('dist-slider');
        const distVal = document.getElementById('dist-val');
        const obstacle = document.getElementById('obstacle');
        const buzInd = document.getElementById('buz-ind');
        const buzStat = document.getElementById('buz-status');
        const buzFreq = document.getElementById('buz-freq');
        const badge = document.getElementById('status-badge');
        const waveBox = document.getElementById('wave-box');

        let currentZone = 'safe';

        const activeWaves = [];
        const sensorX = 40;

        function spawnWave() {
            const wave = document.createElement('div');
            wave.className = 'wave-css';
            wave.style.width = '20px'; wave.style.height = '20px';
            wave.style.top = '50%'; wave.style.left = sensorX + 'px';
            wave.style.transform = 'translate(-50%, -50%)';
            wave.style.opacity = '0.8';
            waveBox.appendChild(wave);
            activeWaves.push({ el: wave, x: sensorX, size: 20, opacity: 0.8 });
            if (activeWaves.length > 14) {
                const old = activeWaves.shift();
                if (old.el.parentNode) old.el.parentNode.removeChild(old.el);
            }
        }

        function animateWaves() {
            for (let i = activeWaves.length - 1; i >= 0; i--) {
                const w = activeWaves[i];
                w.x += 1.8; w.size += 0.8; w.opacity -= 0.012;
                w.el.style.left = w.x + 'px';
                w.el.style.width = w.size + 'px';
                w.el.style.height = w.size + 'px';
                w.el.style.opacity = Math.max(0, w.opacity);
                if (w.opacity <= 0) {
                    if (w.el.parentNode) w.el.parentNode.removeChild(w.el);
                    activeWaves.splice(i, 1);
                }
            }
            requestAnimationFrame(animateWaves);
        }
        animateWaves();

        let waveSpawnInterval = null;
        function setWaveSpeed(zone) {
            if (waveSpawnInterval) clearInterval(waveSpawnInterval);
            if (zone === 'danger') waveSpawnInterval = setInterval(spawnWave, 200);
            else if (zone === 'warning') waveSpawnInterval = setInterval(spawnWave, 400);
            else if (zone === 'caution') waveSpawnInterval = setInterval(spawnWave, 700);
        }

        function updateDemo(d) {
            distVal.textContent = d;
            const pct = 12 + ((d - 2) / 398) * 78;
            obstacle.style.left = pct + '%';

            buzInd.classList.remove('bp-fast', 'bp-mid', 'bp-slow');
            buzInd.style.background = '';
            const icon = buzInd.querySelector('i');
            icon.style.color = '';

            let newZone = 'safe';

            if (d < 20) {
                newZone = 'danger';
                buzInd.classList.add('bp-fast');
                buzInd.style.background = 'rgba(239,68,68,0.15)';
                icon.style.color = '#EF4444';
                buzStat.textContent = 'Urgent Alert!'; buzStat.style.color = '#EF4444';
                buzFreq.textContent = '50ms interval — Danger!'; buzFreq.style.color = '#EF4444';
                badge.textContent = 'Danger Zone';
                badge.className = 'px-5 py-2.5 rounded-full bg-red-500/10 text-red-400 text-sm font-bold';
                distVal.style.color = '#EF4444';
                if (soundEnabled) startBuzzerLoop('danger');
            } else if (d < 50) {
                newZone = 'warning';
                buzInd.classList.add('bp-mid');
                buzInd.style.background = 'rgba(245,158,11,0.12)';
                icon.style.color = '#F59E0B';
                buzStat.textContent = 'Medium Alert'; buzStat.style.color = '#F59E0B';
                buzFreq.textContent = '150ms interval — Warning'; buzFreq.style.color = '#F59E0B';
                badge.textContent = 'Warning Zone';
                badge.className = 'px-5 py-2.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-bold';
                distVal.style.color = '#F59E0B';
                if (soundEnabled) startBuzzerLoop('warning');
            } else if (d < 100) {
                newZone = 'caution';
                buzInd.classList.add('bp-slow');
                buzInd.style.background = 'rgba(234,179,8,0.1)';
                icon.style.color = '#EAB308';
                buzStat.textContent = 'Slow Alert'; buzStat.style.color = '#EAB308';
                buzFreq.textContent = '300ms interval — Caution'; buzFreq.style.color = '#EAB308';
                badge.textContent = 'Caution Zone';
                badge.className = 'px-5 py-2.5 rounded-full bg-yellow-500/10 text-yellow-400 text-sm font-bold';
                distVal.style.color = '#EAB308';
                if (soundEnabled) startBuzzerLoop('caution');
            } else {
                buzInd.style.background = 'rgba(34,197,94,0.08)';
                icon.style.color = '#4b5563';
                buzStat.textContent = 'Silent'; buzStat.style.color = '#4b5563';
                buzFreq.textContent = 'No alert'; buzFreq.style.color = '#374151';
                badge.textContent = 'Safe Zone';
                badge.className = 'px-5 py-2.5 rounded-full bg-green-500/10 text-green-400 text-sm font-bold';
                distVal.style.color = '#F59E0B';
                stopBuzzerLoop();
            }

            if (soundEnabled && newZone !== currentZone) {
                if (newZone === 'danger') playTransitionTone('danger');
                else if (newZone === 'safe' && currentZone !== 'safe') playTransitionTone('safe');
            }
            currentZone = newZone;
            setWaveSpeed(newZone);
        }

        slider.addEventListener('input', e => updateDemo(parseInt(e.target.value)));
        updateDemo(200);

        document.getElementById('copy-btn').addEventListener('click', function () {
            const text = document.getElementById('code-text').innerText;
            navigator.clipboard.writeText(text).then(() => {
                showToast('Code copied successfully');
                this.innerHTML = '<i class="fas fa-check"></i><span>Copied</span>';
                setTimeout(() => { this.innerHTML = '<i class="fas fa-copy"></i><span>Copy</span>'; }, 2500);
            }).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = text; document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); document.body.removeChild(ta);
                showToast('Code copied successfully');
            });
        });

        function showToast(msg) {
            const t = document.getElementById('toast');
            t.textContent = msg; t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        }

        const nav = document.querySelector('nav');
        window.addEventListener('scroll', () => {
            nav.style.background = window.scrollY > 60 ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)';
        }, { passive: true });

        window.addEventListener('beforeunload', () => {
            stopBuzzerLoop();
            if (waveSpawnInterval) clearInterval(waveSpawnInterval);
        });
