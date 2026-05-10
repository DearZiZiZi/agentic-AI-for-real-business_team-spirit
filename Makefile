.PHONY: setup start stop start-api start-bot start-web start-tunnel register-webhooks demo demo-trace test test-assistant test-e2e health

setup:
	python3 -m venv .venv
	.venv/bin/pip install -r requirements.txt
	cd web && npm install

start-api:
	uvicorn api.main:app --host 0.0.0.0 --port 8080 --reload

start-bot:
	.venv/bin/python -m bot.owner_bot

start-web:
	cd web && npm run dev

start-tunnel:
	cloudflared tunnel --url http://localhost:8080

start:
	@echo "Starting all services..."
	@echo "Run these in separate terminals:"
	@echo "  make start-api"
	@echo "  make start-bot"
	@echo "  make start-web"
	@echo "  make start-tunnel"

register-webhooks:
	bash scripts/register_webhooks.sh

demo:
	bash scripts/demo.sh

demo-trace:
	.venv/bin/python scripts/demo_trace.py

test:
	.venv/bin/python -m pytest tests/ -v

test-assistant:
	.venv/bin/python tests/test_assistant_scenarios.py

test-e2e:
	bash scripts/demo.sh

health:
	curl -s http://localhost:8080/health | python3 -m json.tool
