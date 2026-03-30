const button = document.querySelector('.button-add-task')
const input = document.querySelector('.input-task')
const completeList = document.querySelector('.list-task')
<<<<<<< HEAD
=======


>>>>>>> 7ffc7ceae2c0cc0b17fb297a60ab9d6604aa9243
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
            <li class="task ${tarefa.completed ? 'done' : ''}" data-id="${tarefa.id}" data-completed="${tarefa.completed}">
                <img class="checkmark" src="./img/check-mark.png" alt="check-na-tarefa" data-action="toggle">
                <p>${titulo}</p>
<<<<<<< HEAD
                <img class="delete" src="./img/delete.png" alt="deletar-tarefa" data-action="delete">
=======
                <img src="./img/edit.png" alt="editar-tarefa" data-action="edit">
                <img src="./img/delete.png" alt="deletar-tarefa" data-action="delete">
>>>>>>> 7ffc7ceae2c0cc0b17fb297a60ab9d6604aa9243
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
async function itemFeito(id, concluida) {
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
        await recarregarTarefas()
        // Disparar confete somente se tarefa foi marcada como feita
        if (!concluida) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          })
        }
    } catch (err) {
        console.error('Erro ao atualizar tarefa:', err)
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

completeList.addEventListener('click', (e) => {
    const img = e.target.closest('img[data-action]')
    if (!img) return
    const li = img.closest('li[data-id]')
    if (!li) return
    const id = parseInt(li.dataset.id, 10)
    const action = img.dataset.action
    if (action === 'toggle') {
        const completed = li.dataset.completed === 'true'
        itemFeito(id, completed)
    } else if (action === 'delete') {
        deletarItem(id)
    } 
    else if (action === 'edit') {
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