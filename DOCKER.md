# Docker Setup for Open Agent Platform

This Docker Compose setup allows you to run all required services locally with a single command.

## Prerequisites

1. Docker and Docker Compose installed
2. All external repositories cloned as siblings to this repo:
   ```
   parent-directory/
   ├── open-agent-platform/     (this repo)
   ├── deep-agent/              (port 2024)
   ├── agent-optimizer/         (port 2025) 
   ├── triggers/                (port 8080)
   ├── langconnect/             (port 8888)
   └── tool-server/             (port 8000)
   ```

## Setup

### 1. Configure External Services

Each external service needs a Dockerfile. Copy the appropriate template:

**For Node.js services:**
```bash
cp docker/Dockerfile.node ../service-name/Dockerfile
```

**For Python services:**
```bash
cp docker/Dockerfile.python ../service-name/Dockerfile
```

### 2. Update Docker Compose

Edit `docker-compose.yml` and:
- Adjust the `context` paths to match your repo locations
- Uncomment Python service commands for Python-based services
- Remove `/app/node_modules` volume mounts for Python services
- Add any service-specific environment variables

### 3. Environment Variables

Copy and configure environment files:
```bash
cp apps/web/.env.example apps/web/.env
```

Update the environment variables in `.env` and `docker-compose.yml` as needed.

## Usage

### Start all services
```bash
docker-compose up
```

### Start with rebuild
```bash
docker-compose up --build
```

### Start in background
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f [service-name]
```

### Stop all services
```bash
docker-compose down
```

## Service Ports

- **web**: http://localhost:3000 (this repo)
- **deep-agent**: http://localhost:2024
- **agent-optimizer**: http://localhost:2025  
- **triggers**: http://localhost:8080
- **langconnect**: http://localhost:8888
- **tool-server**: http://localhost:8000

## Hot Reloading

All services are configured with volume mounts to enable hot reloading:
- Source code changes will automatically trigger rebuilds
- Node modules are cached in anonymous volumes for performance

## Troubleshooting

### Service won't start
1. Check if the external repo path exists
2. Verify the Dockerfile exists in the external repo
3. Check service logs: `docker-compose logs [service-name]`

### Port conflicts
If ports are already in use, update the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "NEW_PORT:ORIGINAL_PORT"
```

### Dependencies not installing
For Node.js services, ensure `package.json` exists in the external repo root.
For Python services, ensure `requirements.txt` exists in the external repo root.

## Customization

### Adding environment variables
Add them to the `environment` section of each service in `docker-compose.yml`.

### Changing start commands
Update the `command` field for each service in `docker-compose.yml`.

### Adding new services
Follow the same pattern as existing services in `docker-compose.yml`.