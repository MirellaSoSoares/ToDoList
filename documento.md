# Projeto ToDoList
App de lista de tarefas com CRUD completo (criar, listar, marcar concluído, deletar).

---
## Requisitos

- Adição de tarefas
- Opção de marcar a tarefa como concluída
- Deletar tarefa
- Edição da tarefa
- Dar prioridade a aquelas que são mais importantes
---

---
## Arquitetura

**Frontend:** HTML + CSS + JavaScript (Fetch/AJAX)  
**Backend:** PHP 8.4 + Apache (API REST)  
**Banco:** MySQL 8 com tabela `tasks`
---

### Resumo das etapas executadas

1. Montagem do ambiente Docker:
   - Dockerfile com Apache + PHP 8.4 em `/var/www/html`

2. Acesso ao container:
   - `docker exec -it todolist_db mysql -u todouser -p todolist`
   - Verificação `docker ps` e status de containers

3. Banco de dados:
   - `database.sql` cria DB `todolist` e tabela `tasks` (id, title, completed, timestamps)
   - Teste de consulta: `docker exec -it todolist_db mysql -u todouser -p todolist "todopass" "SELECT * FROM tasks"`

4. Confirmação final:
   - Aplicação acessível em `http://localhost:8080`
   - Dados enviados da web ficam persistidos no MySQL

---

## Tarefas a implementar

- **Confetes ao completar tarefa** - Exibir animação de confetes quando tarefa é marcada como concluída
- **Marcar prioridade** - Adicionar opção de marcar com um pin tarefas que devem ser priorizadas, assim as deixando no topo da tabela
- **Editar tarefa** - Permitir editar texto de tarefas já criadas