# API Consumo de água e gás

## Descrição

Este é o backend de uma aplicação para gerenciamento de leituras de consumo de água e gás utilizando processamento de imagens via API. A aplicação foi desenvolvida para receber imagens em formato base64, processá-las através da API Google Gemini para extrair valores de medições, e armazenar os dados em um banco de dados. Além disso, a API oferece endpoints para listar, confirmar e corrigir leituras.

## Tecnologias Utilizadas

### Backend
- **Node.js**: Plataforma JavaScript utilizada para desenvolvimento do servidor backend.
- **Express**: Framework web utilizado para gerenciar rotas, middlewares, e facilitar o desenvolvimento da API.
- **TypeScript**: Superset do JavaScript que adiciona tipagem estática ao código, tornando o desenvolvimento mais seguro e organizado.
- **Prisma**: ORM utilizado para gerenciar o banco de dados relacional, fornecendo uma interface de alto nível para interagir com o banco de dados e executar consultas.
- **Axios**: Biblioteca utilizada para realizar requisições HTTP para a API Google Gemini.
- **Sharp**: Biblioteca para manipulação de imagens, utilizada para processar e otimizar as imagens recebidas.
- **Swagger**: Utilizado para documentação da API, facilitando a interação e o entendimento dos endpoints disponíveis.

### Banco de Dados
- **SQLite**: Banco de dados utilizado para armazenamento local dos dados da aplicação, facilitando a integração e configuração do ambiente de desenvolvimento.

### Infraestrutura
- **Docker**: Utilizado para containerizar a aplicação e garantir que ela rode de forma consistente em diferentes ambientes.
- **Docker Compose**: Ferramenta para definir e gerenciar os contêineres Docker, permitindo subir a aplicação e todos os seus serviços com um único comando.

### Testes
- **Jest**: Framework de testes utilizado para garantir a qualidade do código, com suporte para testes unitários e mocks.
- **Supertest**: Utilizado para realizar testes de integração nos endpoints da API, garantindo que a aplicação funcione conforme esperado.

## Endpoints da API

### POST /upload
Responsável por receber uma imagem em base64, consultar o Google Gemini para extrair o valor de medição e armazenar o resultado.

**Corpo da Requisição:**
```json
{
  "image": "base64",
  "customer_code": "string",
  "measure_datetime": "datetime",
  "measure_type": "WATER" ou "GAS"
}
```
**Resposta de Sucesso (200):**
```json
{
  "image_url": "string",
  "measure_value": "integer",
  "measure_uuid": "string"
}
```


### PATCH /confirm/
Confirma ou corrige o valor lido pelo Google Gemini.

**Corpo da Requisição:**
```json
{
  "confirmed_value": "integer"
}
```
**Resposta de Sucesso (200):**
```json
{
  "success": true
}
```


### GET /list ou  /list?measure_type=GAS
Lista as leituras realizadas por um determinado cliente e podendo filtrar para trazer leituras do tipo "WATER" ou "GAS" do cliente.

**Resposta de Sucesso (200):**
```json
{
  "customer_code": "string",
  "measures": [
    {
      "measure_uuid": "string",
      "measure_datetime": "datetime",
      "measure_type": "string",
      "has_confirmed": "boolean",
      "image_url": "string"
    }
  ]
}
```


## Como Rodar o Projeto Localmente
### Pré-requisitos
- **Node.js (v18 ou superior)**: Utilizado para containerizar a aplicação e garantir que ela rode de forma consistente em diferentes ambientes.
- **Docker e Docker Compose**: Ferramenta para definir e gerenciar os contêineres Docker, permitindo subir a aplicação e todos os seus serviços com um único comando.


### Passos para Executar
1. **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```
2. **Crie um arquivo .env** com as variáveis de ambiente necessárias (exemplo: **GEMINI_API_KEY)**.
3. **Suba os serviços utilizando o Docker Compose:**
    ```bash
    docker-compose up --build
    ```
4. **Acesse a documentação da API:**
    ```bash
    http://localhost:80/api-docs
    ```


## Como Rodar os Testes
Execute os testes unitários e de integração utilizando o Jest:
```bash
npm run test
```
