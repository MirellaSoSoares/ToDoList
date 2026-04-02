# Projeto ToDoList
App de lista de tarefas com CRUD completo (criar, listar, marcar concluído, deletar).

---
## Requisitos

- Adição de tarefas
- Opção de marcar a tarefa como concluída
- Deletar tarefa
- Edição da tarefa
---

---
## Arquitetura

**Frontend:** HTML + CSS + JavaScript (Fetch/AJAX)  
**Backend:** PHP 8.4 + Apache (API REST)  
**Banco:** MySQL 8 com tabela `tasks`
---

---
### Resumo das etapas executadas

1. Montagem do ambiente Docker:
   - Dockerfile com Apache + PHP 8.4 em `/var/www/html`

2. Criação dos scripts PHP para se conectar com o MySQL:
- Definir `host`, `porta`, `nome`, `usuário` e `senha`.
- Criação da função que monta a string de conexão (`DSN`) para o `PDO`. Essa função retorna um objeto PDO configurado para se conectar ao MySQL

3. Operações CRUD:

- `listTasks:` Lista todas as tarefas no banco, ordenadas pela data de criação, e envia a resposta formatada em JSON.

- `createTask` Recebe o título de uma tarefa via JSON, valida os dados, insere uma nova tarefa no banco, e retorna a tarefa criada.

- `updateTask` Atualiza uma tarefa existente pelo `id`, permitindo modificar o título e/ou o status de `completed`. Valida entradas e retorna a tarefa atualizada.

- `deleteTask` Remove a tarefa correspondente ao `id` informado. Retorna uma mensagem de sucesso ou erro caso a tarefa não exista.
---

---
## Como deve funcionar os elementos

1. `Lista de Tarefas`
- Exibe todas as tarefas cadastradas, ordenadas das mais recente para a mais antiga. 

2. `Campo de Criação de Tarefa`
- Usuário insere o título da nova tarefa.
- O sistema valida que o título não está vazio e não ultrapassa 255 caracteres.
- Ao enviar, a tarefa é adicionada à lista imediatamente.

3. `Botão de Conclusão de Tarefa`
- Permite marcar uma tarefa como concluída ou, se já estiver concluída, desmarcá-la.
- Ao clicar, o sistema atualiza o status da tarefa no banco de dados
- A interface deve refletir essa mudança imediatamente, alterando a aparência da tarefa (o texto riscado, ícone de check marcado).

4. `Botão de Edição`
- Permite alterar o título de uma tarefa já existente.
- Atualiza a tarefa e reflete as mudanças na lista.

5. `Botão de Deletar`
- Remove a tarefa selecionada após confirmação do usuário.
- Atualiza a lista para não mostrar mais a tarefa removida.
---