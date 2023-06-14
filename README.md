# PomoSync

PomoSync é um projeto que facilita o gerenciamento do seu tempo utilizando a técnica de Pomodoro de forma sincronizada. O backend é escrito em Go e o frontend é construído usando NextJs.

## Requisitos
1. Golang (versão 1.16 ou superior)
2. Node.js (versão 14.0.0 ou superior)
3. npm (versão 6.14.0 ou superior)

## Configuração do projeto

Para começar a usar o Pomosync, você precisa configurar tanto o backend quanto o frontend localmente.

### Configuração do Backend

1. Navegue até o diretório do backend:

    ```bash
    cd pomodoro-backend
    ```

2. Instale as dependências do Golang. Se você estiver usando o go modules (que é o padrão para novos projetos desde a versão Go 1.16), as dependências serão baixadas automaticamente quando você rodar ou testar seu código. No entanto, se você quiser baixar as dependências manualmente, você pode usar o comando a seguir:

    ```bash
    go mod download
    ```

3. Inicie o servidor backend:

    ```bash
    go run ./cmd/web/main.go
    ```

Agora, o servidor backend deve estar rodando e ouvindo as requisições na porta definida no seu arquivo de configuração.

### Configuração do Frontend

1. Navegue até o diretório do frontend:

    ```bash
    cd ../pomodoro-frontend
    ```

2. Instale as dependências do projeto:

    ```bash
    npm install
    ```

3. Inicie o servidor de desenvolvimento:

    ```bash
    npm run dev
    ```

Agora, você deve ser capaz de abrir o app no seu navegador, acessando `http://localhost:3000` (ou a porta que foi definida nas configurações do projeto).

## Contribuindo

Para contribuir é só criar uma Issue ou um Pull Request.

## Licença

Pomosync está licenciado sob a [MIT License](LICENSE).
