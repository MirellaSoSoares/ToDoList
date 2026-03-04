const button = document.querySelector('.button-add-task')
const input = document.querySelector('.input-task')
const completeList = document.querySelector('.list-task')


let minhaListadeItens = []

function adicionarNovaTarefa() {
    minhaListadeItens.push({
        tarefa: input.value,
        concluida: false
    })

    input.value = ''

    mostrarTarefas()
}

function mostrarTarefas() {

    let novaLi = ''
    minhaListadeItens.forEach((tarefa, posicao) => {
        novaLi = novaLi + `

            <li class="task ${tarefa.concluida && "done"}">
                <img src="./img/check-mark.png" alt="check-na-tarefa" onclick="itemFeito(${posicao})">
                <p>${tarefa.tarefa}</p>
                <img src="./img/delete.png" alt="deletar-tarefa" onclick="deletarItem(${posicao})">
            </li>

            `
    })

    completeList.innerHTML = novaLi

    localStorage.setItem('lista', JSON.stringify(minhaListadeItens))

}

function itemFeito(posicao) {
    minhaListadeItens[posicao].concluida = !minhaListadeItens[posicao].concluida
    mostrarTarefas()
}




function deletarItem(posicao) {
    minhaListadeItens.splice(posicao, 1)
    mostrarTarefas()
}

function recarregarTarefas() {
    const tarefasDoLocalStorage = localStorage.getItem('lista')

    if (tarefasDoLocalStorage) {
        minhaListadeItens = JSON.parse(tarefasDoLocalStorage)
    }

    mostrarTarefas()
}

recarregarTarefas()
button.addEventListener('click', adicionarNovaTarefa)