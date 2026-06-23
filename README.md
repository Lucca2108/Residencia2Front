# BB Fraud Detection - Frontend

## 📌 Sobre o Projeto

O **BB Fraud Detection Frontend** é a interface web desenvolvida para o projeto **API de Detecção de Anomalias em Transações Financeiras**, realizado na disciplina **Residência em Software II** da **Universidade Tiradentes (UNIT)** em parceria com o **Banco do Brasil**.

A aplicação tem como objetivo fornecer uma experiência intuitiva para clientes e analistas, permitindo o monitoramento de transações financeiras, análise de risco e visualização de informações geradas pelo modelo de Inteligência Artificial responsável pela detecção de possíveis fraudes.

---

## 🎯 Objetivos

* Monitorar transações financeiras em tempo real.
* Exibir resultados de análise de risco.
* Auxiliar na investigação de possíveis fraudes.
* Melhorar a experiência do usuário reduzindo falsos positivos.
* Integrar frontend e backend através de APIs REST.

---

## 🖥️ Funcionalidades

### Dashboard Administrativo

* Visualização de transações cadastradas.
* Consulta de histórico.
* Análise de risco de transações.
* Exclusão de registros.
* Monitoramento de indicadores financeiros.
* Visualização de transações suspeitas.

### Portal do Cliente

* Consulta de informações financeiras.
* Visualização de saldo e movimentações.
* Cadastro de viagens programadas.
* Recebimento de notificações.
* Redução de bloqueios indevidos durante viagens.

---

## 🧠 Inteligência Artificial

O frontend consome uma API de Machine Learning responsável por:

* Receber transações financeiras.
* Processar dados utilizando o algoritmo Isolation Forest.
* Detectar comportamentos anômalos.
* Gerar scores de risco.
* Classificar possíveis fraudes.

O objetivo é apoiar a tomada de decisão e aumentar a eficiência dos processos de monitoramento financeiro.

---

## 🛠️ Tecnologias Utilizadas

### Frontend

* Next.js
* React
* TypeScript
* CSS Modules
* HTML5
* JavaScript

### Backend Integrado

* Python
* FastAPI
* MySQL
* Scikit-Learn
* Swagger / OpenAPI

### Ferramentas

* Git
* GitHub
* VS Code

---

## 🚀 Como Executar o Projeto

### Clonar o repositório

```bash
git clone <url-do-repositorio>
```

### Entrar na pasta do projeto

```bash
cd frontend
```

### Instalar dependências

```bash
npm install
```

ou

```bash
yarn install
```

---

### Executar em ambiente de desenvolvimento

```bash
npm run dev
```

ou

```bash
yarn dev
```

---

### Abrir no navegador

```text
http://localhost:3000
```

---

## 📂 Estrutura do Projeto

```text
src/
│
├── app/
├── components/
├── hooks/
├── services/
├── styles/
├── utils/
│
public/
│
package.json
README.md
```

---

## 🔒 Diferencial do Projeto

Um dos diferenciais implementados foi o recurso de **Programação de Viagem**.

O cliente pode informar previamente viagens nacionais ou internacionais. Com isso, o sistema reduz a sensibilidade da análise para transações realizadas na região cadastrada durante o período informado.

Esse mecanismo contribui para:

* Redução de falsos positivos.
* Melhor experiência do usuário.
* Menor ocorrência de bloqueios indevidos.

---

## 📈 Resultados Obtidos

Durante os testes realizados:

* Aproximadamente 30.000 transações simuladas foram processadas.
* O sistema identificou padrões suspeitos relacionados a localização e comportamento.
* Aproximadamente 8% das transações foram classificadas como potencialmente fraudulentas.
* A solução demonstrou viabilidade técnica para evolução em ambientes corporativos.

---

## 👥 Equipe

### Squad 06

* Bruna Lorena Santos Aragão
* Davi Carvalho Leal Nascimento
* Gabriel de Oliveira Alves
* João Miguel Santos Silva
* Lucca Amaral Menendez
* Murilo Souza de Barros
* Pedro Henrique Andrade Costa
* Thiago Vinicius do Nascimento Marques
* Vitor Mendonça Maciel

---

## 🎓 Projeto Acadêmico

Projeto desenvolvido na disciplina **Residência em Software II** da **Universidade Tiradentes (UNIT)** em parceria com o **Banco do Brasil**.

**Mentora:** Marilia Campos

---

## 📄 Licença

Este projeto foi desenvolvido exclusivamente para fins acadêmicos e educacionais.
