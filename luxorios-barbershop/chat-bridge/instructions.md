# Chat Bridge via GitHub

## How it works:
1. You edit `orders.txt` on GitHub (mobile browser/app)
2. I poll every 2 minutes, pull changes
3. I read your command, execute it
4. I write response to `response.txt`
5. I push both files
6. You refresh to see response

## File format:
**orders.txt:**
```
[ID: 001]
COMMAND: check server status
```

**response.txt:**
```
[ID: 001]
STATUS: done
RESULT: Server running on port 5000
```

## Requirements:
- GitHub token with repo access
- Git configured
- Cron job or background loop
