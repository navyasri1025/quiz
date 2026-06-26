import requests

headers = {"Authorization": "Bearer OPENROUTER_API_KEY"}
# Test the chat completions endpoint directly
payload = {
    "model": "deepseek/deepseek-chat-v3-0324:free",
    "messages": [
        {"role": "user", "content": "Say 'hello' and nothing else"}
    ],
    "max_tokens": 10
}

r = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers=headers,
    json=payload
)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:500]}")

if r.status_code == 404:
    # Try /v1/chat/completions
    r2 = requests.post(
        "https://openrouter.ai/v1/chat/completions",
        headers=headers,
        json=payload
    )
    print(f"\nWithout /api/: {r2.status_code} {r2.text[:300]}")