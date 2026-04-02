const button = document.querySelector('.button-add-task')
const input = document.querySelector('.input-task')
const completeList = document.querySelector('.list-task')
const API_URL = 'api/tasks.php'

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

        novaLi += `
            <li class="task ${tarefa.completed ? 'done' : ''} ${tarefa.pinned ? 'pinned' : ''}" data-id="${tarefa.id}" data-completed="${tarefa.completed}" data-pinned="${tarefa.pinned}">
                <img class="check" src="./img/check.png" alt="check-na-tarefa" data-action="toggle">
                <p>${titulo}</p>
                <div class="options">
                    <button class="options-btn" type="button" data-action="options" aria-label="Mais opções">⋮</button>
                    <div class="dropdown-menu">
                        <button type="button" class="dropdown-item" data-action="pin">📌 Fixar</button>
                        <button type="button" class="dropdown-item" data-action="edit">✏️ Editar</button>
                        <button type="button" class="dropdown-item" data-action="delete">🗑️ Excluir</button>
                    </div>
                </div>
            </li>
        `
    })
    completeList.innerHTML = novaLi
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

// ── Init ──────────────────────────────────────────────────────────────────────
recarregarTarefas()
button.addEventListener('click', adicionarNovaTarefa)
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') adicionarNovaTarefa() })

document.addEventListener('click', (e) => {
    if (!e.target.closest('.task')) {
        closeAllDropdowns()
    }
})

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu.open').forEach((menu) => {
        menu.classList.remove('open')
    })
}

completeList.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]')
    if (!target) return
    const li = target.closest('li[data-id]')
    if (!li) return
    const id = parseInt(li.dataset.id, 10)
    const action = target.dataset.action

    if (action === 'options') {
        e.stopPropagation()
        closeAllDropdowns()
        const menu = li.querySelector('.dropdown-menu')
        if (menu) {
            menu.classList.toggle('open')
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
        const p = li.querySelector ('p')
        const tituloAtual = p.textContent
        // Substituir o <p> pelo input com o texto atual
        p.innerHTML = `<input type="text" class="edit-input"
        value="${tituloAtual}" />`
        const inputEdit = p.querySelector('input')
        inputEdit.focus()
        inputEdit.select()
        inputEdit.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                const novoTitulo = inputEdit.value.trim()
                if (!novoTitulo) return

                // Enviar atualização para o backend
                try {
                   const resposta = await fetch(`${API_URL}?id=${id}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({title: novoTitulo}) 
                        })
                        if (!resposta.ok){
                        const erro = await resposta.json()
                        console.error('Erro ao atualizar tarefa:',
                    erro.error)
                        return
                    }
                    await recarregarTarefas()
                    } catch(err) {
                     console.error('Erro ao atualizar tarefa:', err)
                }
            }
        })
    }
})