# NestJS + Fastify + Prisma + Cloudflare R2 Template

Um template completo e pronto para produção com NestJS, Fastify, Prisma ORM, PostgreSQL e integração com Cloudflare R2 para upload de arquivos.

## 🚀 Features

- **NestJS** com **Fastify** (mais performático que Express)
- **Prisma ORM** com PostgreSQL
- **Cloudflare R2** para armazenamento de arquivos (compatível com S3)
- **Docker** e **Docker Compose** para desenvolvimento e produção
- **Swagger/OpenAPI** para documentação da API
- **Health checks** para monitoramento
- **Validação** de dados com class-validator
- **Configuração centralizada** com validação de ambiente
- **Tratamento de erros** global
- **Logging** interceptor
- Pronto para deploy em **qualquer cloud**

## 📋 Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Conta na Cloudflare com R2 habilitado

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd nestjs-template
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestjs_db?schema=public"

# Cloudflare R2
R2_ACCOUNT_ID=seu_account_id
R2_ACCESS_KEY_ID=sua_access_key
R2_SECRET_ACCESS_KEY=sua_secret_key
R2_BUCKET_NAME=seu_bucket
R2_PUBLIC_URL=https://seu-bucket.r2.cloudflarestorage.com
```

### 3. Inicie o ambiente de desenvolvimento

```bash
# Com Docker (recomendado)
make dev

# Ou sem Docker
npm install
npm run start:dev
```

## 📁 Estrutura do Projeto

```
├── src/
│   ├── config/              # Configurações
│   │   ├── configuration.ts
│   │   └── validation.schema.ts
│   ├── modules/
│   │   ├── common/          # Filters, interceptors, decorators
│   │   ├── health/          # Health checks
│   │   └── upload/          # Upload de arquivos
│   ├── prisma/              # Prisma service
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma        # Schema do banco
│   └── seed.ts              # Seed data
├── docker/
│   └── init.sql             # SQL inicial
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
└── Makefile
```

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
make dev              # Inicia ambiente Docker
make dev-local        # Inicia localmente
make stop             # Para containers
make logs             # Ver logs
make clean            # Remove containers e volumes

# Database
make migrate          # Roda migrations
make seed             # Popula banco
make studio           # Abre Prisma Studio

# Produção
make build            # Build para produção
make prod             # Inicia em produção
make deploy           # Build e deploy
```

## 📤 API de Upload

### Upload direto (multipart)

```bash
# Upload de arquivo único
curl -X POST http://localhost:3000/api/v1/upload \
  -F "file=@/path/to/file.jpg" \
  -F "folder=images"

# Upload de múltiplos arquivos
curl -X POST http://localhost:3000/api/v1/upload/multiple \
  -F "files=@/path/to/file1.jpg" \
  -F "files=@/path/to/file2.jpg"
```

### Upload via URL pré-assinada (recomendado para arquivos grandes)

```bash
# 1. Obter URL pré-assinada
curl -X POST http://localhost:3000/api/v1/upload/presigned \
  -H "Content-Type: application/json" \
  -d '{"filename": "photo.jpg", "mimeType": "image/jpeg"}'

# Resposta:
# {
#   "url": "https://...",
#   "key": "uploads/uuid.jpg",
#   "expiresIn": 3600
# }

# 2. Fazer upload diretamente para R2
curl -X PUT "<url_presigned>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/photo.jpg

# 3. Confirmar upload
curl -X POST http://localhost:3000/api/v1/upload/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "key": "uploads/uuid.jpg",
    "originalName": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 12345
  }'
```

## 🏥 Health Checks

```bash
# Health check completo
curl http://localhost:3000/api/v1/health

# Liveness probe (Kubernetes)
curl http://localhost:3000/api/v1/health/liveness

# Readiness probe (Kubernetes)
curl http://localhost:3000/api/v1/health/readiness
```

## 📚 Documentação da API

Acesse a documentação Swagger em: `http://localhost:3000/api/docs`

## 🐳 Deploy em Cloud

### Docker Build

```bash
# Build da imagem de produção
docker build --target production -t nestjs-app .

# Run
docker run -p 3000:3000 --env-file .env nestjs-app
```

### Kubernetes

O template inclui health checks compatíveis com Kubernetes:
- Liveness: `/api/v1/health/liveness`
- Readiness: `/api/v1/health/readiness`

### AWS ECS / Google Cloud Run / Azure Container Apps

1. Faça push da imagem para seu registry
2. Configure as variáveis de ambiente
3. Exponha a porta 3000

### Railway / Render / Fly.io

1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. O Dockerfile será detectado automaticamente

## ☁️ Configuração do Cloudflare R2

1. Acesse o dashboard da Cloudflare
2. Vá em **R2 Object Storage**
3. Crie um novo bucket
4. Vá em **Manage R2 API Tokens**
5. Crie um token com permissões de leitura/escrita
6. Copie as credenciais para seu `.env`

### Configurar domínio público (opcional)

1. No bucket, vá em **Settings > Public access**
2. Habilite o acesso público
3. Configure um domínio customizado se desejar

## 🔒 Segurança

- Validação de tipos MIME para uploads
- Limite de tamanho de arquivo configurável
- Health checks sem autenticação
- CORS configurável
- Tratamento de erros centralizado

## 📊 Monitoramento

O template inclui:
- Logging de requisições HTTP
- Métricas de memória e disco nos health checks
- Logs estruturados para integração com observability tools

## 🧪 Testes

```bash
# Unit tests
npm run test

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 📝 Licença

MIT

---

Feito com ❤️ para acelerar seu desenvolvimento
# performatik-back
