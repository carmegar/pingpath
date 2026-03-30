# PingPath - Guia de Deploy

## Requisitos

- 2x CubePath VPS Nano (1vCPU, 2GB RAM, 40GB SSD)
- Node.js 20+
- pnpm 9+

## VPS 1: PingPath (API + Web + Ollama)

### 1. Clonar y construir

```bash
git clone https://github.com/carmegar/pingpath.git
cd pingpath
pnpm install
pnpm build
```

### 2. Configurar variables de entorno

```bash
# /root/pingpath/.env
PORT=3001
HOST=0.0.0.0
```

```bash
# /root/pingpath/apps/web/.env
PUBLIC_API_URL=http://TU_IP_VPS1:3001/api
PUBLIC_WS_URL=ws://TU_IP_VPS1:3001/ws
```

### 3. Instalar Ollama y modelo

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2:0.5b
```

Configurar para uso minimo de RAM:

```bash
# /etc/systemd/system/ollama.service.d/override.conf
[Service]
Environment="OLLAMA_KEEP_ALIVE=0"
Environment="OLLAMA_NUM_PARALLEL=1"
Environment="OLLAMA_MAX_LOADED_MODELS=1"
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

### 4. Iniciar API

```bash
cd /root/pingpath
pnpm --filter @pingpath/api start
```

Para ejecutar como servicio con systemd:

```ini
# /etc/systemd/system/pingpath-api.service
[Unit]
Description=PingPath API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/pingpath/apps/api
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=PORT=3001
Environment=HOST=0.0.0.0
Environment=OLLAMA_URL=http://localhost:11434
Environment=OLLAMA_MODEL=qwen2:0.5b

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable pingpath-api
sudo systemctl start pingpath-api
```

### 5. Servir Web con Nginx

```bash
apt install nginx -y
```

```nginx
# /etc/nginx/sites-available/pingpath
server {
    listen 80;
    server_name TU_DOMINIO;

    # Web estático (Astro build)
    root /root/pingpath/apps/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/pingpath /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

## VPS 2: Demo Services

### 1. Clonar y construir

```bash
git clone https://github.com/carmegar/pingpath.git
cd pingpath
pnpm install
cd apps/demo-services
pnpm build
```

### 2. Iniciar

```bash
PORT=3002 node dist/index.js
```

O como servicio systemd:

```ini
# /etc/systemd/system/demo-services.service
[Unit]
Description=PingPath Demo Services
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/pingpath/apps/demo-services
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=PORT=3002
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
```

### 3. Configurar monitores en PingPath

Una vez ambos VPS estan corriendo, crear monitores desde el dashboard (/app) apuntando a:

| Monitor | URL | Intervalo |
|---------|-----|-----------|
| Demo API | `http://IP_VPS2:3002/api/health` | 60s |
| Demo Web | `http://IP_VPS2:3002/web/health` | 60s |
| Demo Slow API | `http://IP_VPS2:3002/slow/health` | 60s |

Marcarlos como publicos para que aparezcan en la status page.

## Verificacion

1. Abrir `http://IP_VPS1/` - Landing page
2. Abrir `http://IP_VPS1/app` - Dashboard (deberian verse los 3 monitores)
3. Abrir `http://IP_VPS1/status` - Status page publica
4. Esperar 10-20 min - El chaos engine tumbara un servicio
5. Verificar que se crea un incidente y se envia notificacion
6. Cuando se recupere, verificar que se genera resumen IA
