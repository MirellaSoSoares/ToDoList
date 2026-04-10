const button = document.querySelector('.button-add-task')
const input = document.querySelector('.input-task')
const completeList = document.querySelector('.list-task')
const API_URL = 'api/tasks.php'

// Mapa de intervals ativos: id -> intervalId
const activeTimerIntervals = new Map()

// ── Helpers Gerais ───────────────────────────────────────────────────────────
function formatDuration(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    const pad = (n) => String(n).padStart(2, '0')
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
}

function getTaskTimerDisplay(li) {
    return li.querySelector('.task-timer-display')
}
function showTaskTimerDisplay(li, visible) {
    const container = li.querySelector('.task-timer')
    if (!container) return
    if (visible) {
        container.classList.add('visible')
        container.setAttribute('aria-hidden', 'false')
    } else {
        container.classList.remove('visible')
        container.setAttribute('aria-hidden', 'true')
    }
}

function stopLocalInterval(id) {
    if (activeTimerIntervals.has(id)) {
        clearInterval(activeTimerIntervals.get(id))
        activeTimerIntervals.delete(id)
    }
}
function clearAllTimerIntervals() {
    activeTimerIntervals.forEach((intervalId) => clearInterval(intervalId))
    activeTimerIntervals.clear()
}

// ── Ajusta displays depois de renderizar o DOM (mostra tempo só se rodando) ──
function adjustDisplaysFromDOM() {
    document.querySelectorAll('li[data-id]').forEach((li) => {
        const timeSpent = parseInt(li.getAttribute('data-time-spent') || '0', 10) || 0
        const timerRunning = li.getAttribute('data-timer-running') === 'true'
        const timerStartedAt = li.getAttribute('data-timer-started') || null
        const display = getTaskTimerDisplay(li)
        if (!display) return
        if (timerRunning && timerStartedAt) {
            const id = parseInt(li.getAttribute('data-id'), 10)
            const startedAtMS = new Date(timerStartedAt).getTime()
            const elapsed = Math.max(0, Math.floor((Date.now() - startedAtMS) / 1000))
            display.textContent = formatDuration(timeSpent + elapsed)
            showTaskTimerDisplay(li, true)
            // REINICIALIZAR o interval para este timer que está rodando
            startLocalInterval(id, li, timeSpent, startedAtMS)
        } else {
            display.textContent = ''
            showTaskTimerDisplay(li, false)
        }
    })
}

// ── startLocalInterval atualiza o display na linha da tarefa (lado direito) ───
function startLocalInterval(id, li, baseTimeSeconds, startedAtMS) {
    stopLocalInterval(id)
    const display = getTaskTimerDisplay(li)
    if (!display) return
    // mostrar container do lado direito
    showTaskTimerDisplay(li, true)
    const intervalId = setInterval(() => {
        const elapsed = Math.max(0, Math.floor((Date.now() - startedAtMS) / 1000))
        display.textContent = formatDuration(baseTimeSeconds + elapsed)
    }, 1000)
    activeTimerIntervals.set(id, intervalId)
    // atualizar imediatamente
    const elapsedNow = Math.max(0, Math.floor((Date.now() - startedAtMS) / 1000))
    display.textContent = formatDuration(baseTimeSeconds + elapsedNow)
}

// ── Render ────────────────────────────────────────────────────────────────────
function mostrarTarefas(tarefas) {
    let novaLi = ''
    tarefas.forEach((tarefa) => {
        const titulo = tarefa.title
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
        const timeSpent = tarefa.time_spent || 0
        const timerRunning = tarefa.timer_running ? 'true' : 'false'
        const timerStarted = tarefa.timer_started_at ? tarefa.timer_started_at : ''
        novaLi += `
            <li class="task ${tarefa.completed ? 'done' : ''} ${tarefa.pinned ? 'pinned' : ''}" 
                data-id="${tarefa.id}" 
                data-completed="${tarefa.completed}" 
                data-pinned="${tarefa.pinned}"
                data-time-spent="${timeSpent}"
                data-timer-running="${timerRunning}"
                data-timer-started="${timerStarted}">
                <img class="check" src="./img/check.png" alt="check-na-tarefa" data-action="toggle">
                <p>${titulo}</p>

                <!-- container do timer que fica na linha da tarefa (lado direito) -->
                <div class="task-timer" aria-hidden="true">
                    <span class="task-timer-display"></span>
                </div>

                <div class="options">
                    <button class="options-btn" type="button" data-action="options" aria-label="Mais opções">⋮</button>
                </div>

                <div class="dropdown-menu">
                    <button type="button" class="dropdown-item" data-action="pin">📌 Fixar</button>
                    <button type="button" class="dropdown-item" data-action="edit">✏️ Editar</button>
                    <button type="button" class="dropdown-item" data-action="delete">🗑️ Excluir</button>

                    <!-- Timer com submenu: botão play/pause + botão que abre submenu; submenu contém reiniciar -->
                    <div class="dropdown-timer-vertical">
                      <div class="dropdown-timer-row" style="display:flex; align-items:center; gap:6px; position:relative;">
                        <!-- botão principal: play/pause (usa mesma classe dropdown-item) -->
                        <button type="button" class="dropdown-item" data-action="timer-toggle" title="Iniciar / Pausar">
                          ${tarefa.timer_running ? '⏸️ Pausar timer' : '▶️ Iniciar timer'}
                        </button>

                        <!-- toggle do submenu (pequeno botão ao lado) -->
                        <button type="button" class="dropdown-item submenu-toggle" data-action="timer-submenu" aria-expanded="false" title="Mais opções do timer">
                          ▾
                        </button>

                        <!-- submenu (inicialmente escondido) -->
                        <div class="dropdown-submenu" role="menu" aria-hidden="true">
                          <button type="button" class="dropdown-item" data-action="timer-reset" title="Reiniciar">
                            🔁 Reiniciar timer
                          </button>
                        </div>
                      </div>
                    </div>

                </div>
            </li>
        `
    })
    // limpa intervals existentes, substitui DOM e ajusta displays
    clearAllTimerIntervals()
    completeList.innerHTML = novaLi
    adjustDisplaysFromDOM()
}

// ── API calls ─────────────────────────────────────────────────────────────────
async function recarregarTarefas() {
    try {
        const resposta = await fetch(API_URL)
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        const tarefas = await resposta.json()
        mostrarTarefas(tarefas)
    } catch (err) {
        console.error('Erro ao carregar tarefas:', err)
    }
}

async function adicionarNovaTarefa() {
    const titulo = input.value.trim()
    if (!titulo) return
    input.value = ''
    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: titulo })
        })
        if (!resposta.ok) {
            const erro = await resposta.json()
            console.error('Erro ao criar tarefa:', erro.error)
            return
        }
        await recarregarTarefas()
    } catch (err) {
        console.error('Erro ao criar tarefa:', err)
    }
}

// Função para marcar/desmarcar tarefa e disparar confete se marcada como feita
async function itemFeito(id, concluida, li) {
    try {
        const resposta = await fetch(`${API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !concluida })
        })
        if (!resposta.ok) {
            const erro = await resposta.json()
            console.error('Erro ao atualizar tarefa:', erro.error)
            return
        }
        if (!concluida && li) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            })
            li.classList.add('move-to-end')
            await new Promise((resolve) => setTimeout(resolve, 500))
        }
        await recarregarTarefas()
    } catch (err) {
        console.error('Erro ao atualizar tarefa:', err)
    }
}

async function toggleFixar(id, fixada) {
    try {
        const resposta = await fetch(`${API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinned: !fixada })
        })
        if (!resposta.ok) {
            const erro = await resposta.json()
            console.error('Erro ao atualizar preferência de prioridade:', erro.error)
            return
        }
        await recarregarTarefas()
    } catch (err) {
        console.error('Erro ao atualizar preferência de prioridade:', err)
    }
}

async function deletarItem(id) {
    try {
        const resposta = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' })
        if (!resposta.ok) {
            const erro = await resposta.json()
            console.error('Erro ao deletar tarefa:', erro.error)
            return
        }
        await recarregarTarefas()
    } catch (err) {
        console.error('Erro ao deletar tarefa:', err)
    }
}

// ── Timer actions (start/stop/reset) ──────────────────────────────────────────

// Inicia o timer (otimista + PUT)
async function startTimerAction(id, li) {
    const nowISO = new Date().toISOString()
    li.setAttribute('data-timer-running', 'true')
    li.setAttribute('data-timer-started', nowISO)
    const btn = li.querySelector('[data-action="timer-toggle"]')
    if (btn) btn.textContent = '⏸️ Pausar timer'
    const baseTime = parseInt(li.getAttribute('data-time-spent') || '0', 10) || 0
    startLocalInterval(id, li, baseTime, new Date(nowISO).getTime())

    try {
        const resposta = await fetch(`${API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timer_running: true, timer_started_at: nowISO })
        })
        if (!resposta.ok) {
            const erro = await resposta.json()
            console.error('Erro ao iniciar timer:', erro.error)
            await recarregarTarefas()
        }
    } catch (err) {
        console.error('Erro ao iniciar timer:', err)
        await recarregarTarefas()
    }
}

// Para o timer (calcula adição, atualiza servidor e esconde display)
async function stopTimerAction(id, li) {
    const startedAt = li.getAttribute('data-timer-started')
    const baseTime = parseInt(li.getAttribute('data-time-spent') || '0', 10) || 0
    let added = 0
    if (startedAt) {
        const startedAtMS = new Date(startedAt).getTime()
        added = Math.max(0, Math.floor((Date.now() - startedAtMS) / 1000))
    }
    const newTotal = baseTime + added

    li.setAttribute('data-time-spent', String(newTotal))
    li.setAttribute('data-timer-running', 'false')
    li.setAttribute('data-timer-started', '')
    const btn = li.querySelector('[data-action="timer-toggle"]')
    if (btn) btn.textContent = '▶️ Iniciar timer'
    stopLocalInterval(parseInt(li.getAttribute('data-id'), 10))
    // esconder display
    showTaskTimerDisplay(li, false)

    try {
        const resposta = await fetch(`${API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timer_running: false, timer_started_at: null, time_spent: newTotal })
        })
        if (!resposta.ok) {
            const erro = await resposta.json()
            console.error('Erro ao parar timer:', erro.error)
            await recarregarTarefas()
        }
    } catch (err) {
        console.error('Erro ao parar timer:', err)
        await recarregarTarefas()
    }
}

// Reinicia o tempo acumulado (mostra 00:00:00)
async function resetTimerAction(id, li) {
    li.setAttribute('data-time-spent', '0')
    li.setAttribute('data-timer-running', 'false')
    li.setAttribute('data-timer-started', '')
    stopLocalInterval(parseInt(li.getAttribute('data-id'), 10))
    // garantir emoji do play após reset
    const btn = li.querySelector('[data-action="timer-toggle"]')
    if (btn) btn.textContent = '▶️ Iniciar timer'
    // mostrar tempo zerado
    const display = getTaskTimerDisplay(li)
    if (display) display.textContent = '00:00:00'
    showTaskTimerDisplay(li, true)
    try {
        const resposta = await fetch(`${API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timer_running: false, timer_started_at: null, time_spent: 0 })
        })
        if (!resposta.ok) {
            const erro = await resposta.json()
            console.error('Erro ao resetar timer:', erro.error)
            await recarregarTarefas()
        }
    } catch (err) {
        console.error('Erro ao resetar timer:', err)
        await recarregarTarefas()
    }
}

// Inicializa timer apenas para o dropdown daquele li (quando abrir)
function initializeTimersForDropdown(li) {
    const id = parseInt(li.getAttribute('data-id'), 10)
    const timeSpent = parseInt(li.getAttribute('data-time-spent') || '0', 10) || 0
    const timerRunning = li.getAttribute('data-timer-running') === 'true'
    const timerStartedAt = li.getAttribute('data-timer-started') || null

    const btn = li.querySelector('[data-action="timer-toggle"]')
    if (timerRunning) {
        if (btn) btn.textContent = '⏸️ Pausar timer'
    } else {
        if (btn) btn.textContent = '▶️ Iniciar timer'
    }

    if (timerRunning && timerStartedAt) {
        const startedAtMS = new Date(timerStartedAt).getTime()
        startLocalInterval(id, li, timeSpent, startedAtMS)
    } else {
        // garantir que se não estiver rodando, o display fique escondido
        showTaskTimerDisplay(li, false)
    }
}

// ── Init e Event Listeners ───────────────────────────────────────────────────
recarregarTarefas()
button.addEventListener('click', adicionarNovaTarefa)
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') adicionarNovaTarefa() })

// Fecha dropdowns ao clicar fora (e limpa intervals dos dropdowns fechados)
document.addEventListener('click', (e) => {
    if (!e.target.closest('.task')) {
        closeAllDropdowns()
    }
})

function closeAllDropdowns() {
    // fechar menus principais (mas NÃO para timers que estão rodando)
    document.querySelectorAll('.dropdown-menu.open').forEach((menu) => {
        menu.classList.remove('open')
    })
    // fechar submenus abertos
    document.querySelectorAll('.dropdown-submenu.open').forEach((sm) => {
        sm.classList.remove('open')
        sm.setAttribute('aria-hidden', 'true')
        const toggle = sm.parentElement.querySelector('[data-action="timer-submenu"]')
        if (toggle) toggle.setAttribute('aria-expanded', 'false')
    })
}

completeList.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]')
    if (!target) return
    const li = target.closest('li[data-id]')
    if (!li) return
    const id = parseInt(li.getAttribute('data-id'), 10)
    const action = target.dataset.action

    if (action === 'options') {
        e.stopPropagation()
        closeAllDropdowns()
        const menu = li.querySelector('.dropdown-menu')
        if (menu) {
            menu.classList.toggle('open')
            if (menu.classList.contains('open')) {
                initializeTimersForDropdown(li)
            }
        }
        return
    }

    if (action === 'timer-submenu') {
        // Abrir/fechar submenu do timer sem fechar o dropdown principal
        e.stopPropagation()
        const submenu = li.querySelector('.dropdown-submenu')
        const toggle = target
        if (!submenu) return
        const isOpen = submenu.classList.contains('open')
        // fecha outros submenus antes (opcional)
        document.querySelectorAll('.dropdown-submenu.open').forEach((sm) => {
            if (sm !== submenu) {
                sm.classList.remove('open')
                sm.setAttribute('aria-hidden', 'true')
                const otherToggle = sm.parentElement.querySelector('[data-action="timer-submenu"]')
                if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false')
            }
        })
        if (isOpen) {
            submenu.classList.remove('open')
            submenu.setAttribute('aria-hidden', 'true')
            toggle.setAttribute('aria-expanded', 'false')
        } else {
            submenu.classList.add('open')
            submenu.setAttribute('aria-hidden', 'false')
            toggle.setAttribute('aria-expanded', 'true')
        }
        return
    }

    if (action === 'toggle') {
        const completed = li.dataset.completed === 'true'
        itemFeito(id, completed, li)
    } else if (action === 'delete') {
        deletarItem(id)
    } else if (action === 'pin') {
        const pinned = li.dataset.pinned === 'true'
        toggleFixar(id, pinned)
    } else if (action === 'edit') {
        const p = li.querySelector('p')
        const tituloAtual = p.textContent
        p.innerHTML = `<input type="text" class="edit-input" value="${tituloAtual}" />`
        const inputEdit = p.querySelector('input')
        inputEdit.focus()
        inputEdit.select()
        inputEdit.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                const novoTitulo = inputEdit.value.trim()
                if (!novoTitulo) return
                try {
                    const resposta = await fetch(`${API_URL}?id=${id}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({title: novoTitulo})
                    })
                    if (!resposta.ok) {
                        const erro = await resposta.json()
                        console.error('Erro ao atualizar tarefa:', erro.error)
                        return
                    }
                    await recarregarTarefas()
                } catch (err) {
                    console.error('Erro ao atualizar tarefa:', err)
                }
            }
        })
    } else if (action === 'timer-toggle') {
        // Iniciar / pausar timer
        const running = li.getAttribute('data-timer-running') === 'true'
        if (running) {
            stopTimerAction(id, li)
        } else {
            startTimerAction(id, li)
        }
    } else if (action === 'timer-reset') {
        // Reinicia contador
        resetTimerAction(id, li)
        // opcional: fechar submenu após ação
        const submenu = li.querySelector('.dropdown-submenu')
        if (submenu) {
            submenu.classList.remove('open')
            submenu.setAttribute('aria-hidden', 'true')
            const toggle = li.querySelector('[data-action="timer-submenu"]')
            if (toggle) toggle.setAttribute('aria-expanded', 'false')
        }
    }
})