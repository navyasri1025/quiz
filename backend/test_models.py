import requests
import json

headers = {"Authorization": "Bearer OPENROUTER_API_KEY"}

r = requests.get("https://openrouter.ai/api/v1/models", headers=headers)
models = r.json().get("data", [])

free_models = [m for m in models if m.get("id", "").endswith(":free")]
print(f"Total models: {len(models)}")
print(f"Free models: {len(free_models)}")
for m in free_models:
    mid = m["id"]
    try:
        prompt_price = m.get("pricing", {}).get("prompt", "?")
        print(f"  {mid} (prompt price: {prompt_price})")
    except:
        print(f"  {mid}")

# Also try the original model to see the error
print("\n--- Testing deepseek free model ---")
payload = {
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "messages": [{"role": "user", "content": "hi"}],
    "max_tokens": 5
}
r2 = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
print(f"Status: {r2.status_code}")
print(f"Response: {r2.text[:300]}")