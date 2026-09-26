#!/bin/bash

# Full Control Bridge - Execute any command from GitHub
# WARNING: This is powerful but dangerous. Keep repo private!

REPO_URL="$1"
WORK_DIR="/home/sohel/luxorios-barbershop/chat-bridge/repo"
ORDERS_FILE="orders.txt"
RESPONSE_FILE="response.txt"
LAST_ORDER=""

mkdir -p "$WORK_DIR"
cd "$WORK_DIR" || exit 1

# Clone if not exists
if [ ! -d ".git" ]; then
    echo "Cloning repo..."
    git clone "$REPO_URL" .
fi

echo "Full Control Bridge started."
echo "Repo: $REPO_URL"
echo ""
echo "WARNING: This bridge executes ANY command you send!"
echo "Keep your GitHub repo PRIVATE and secure your token."
echo ""

while true; do
    # Pull latest
    git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || true

    if [ -f "$ORDERS_FILE" ]; then
        # Extract order details
        ORDER_ID=$(grep -oP 'ID:\s*\K\S+' "$ORDERS_FILE" 2>/dev/null | head -1)
        COMMAND=$(sed -n 's/COMMAND:\s*//p' "$ORDERS_FILE" 2>/dev/null | head -1)
        CWD=$(sed -n 's/CWD:\s*//p' "$ORDERS_FILE" 2>/dev/null | head -1)

        # Check if new order
        if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "$LAST_ORDER" ] && [ -n "$COMMAND" ]; then
            echo "[$(date '+%H:%M:%S')] New order: $ORDER_ID"
            echo "[$(date '+%H:%M:%S')] Command: $COMMAND"
            [ -n "$CWD" ] && echo "[$(date '+%H:%M:%S')] Working dir: $CWD"

            # Execute command
            if [ -n "$CWD" ] && [ -d "$CWD" ]; then
                RESULT=$(cd "$CWD" && eval "$COMMAND" 2>&1)
            else
                RESULT=$(eval "$COMMAND" 2>&1)
            fi
            EXIT_CODE=$?

            echo "[$(date '+%H:%M:%S')] Exit code: $EXIT_CODE"

            # Write response
            cat > "$RESPONSE_FILE" << EOF
[ID: $ORDER_ID]
COMMAND: $COMMAND
CWD: ${CWD:-/home/sohel/luxorios-barbershop}
STATUS: $([ $EXIT_CODE -eq 0 ] && echo "✅ success" || echo "❌ error (code: $EXIT_CODE)")

OUTPUT:
$RESULT

TIME: $(date)
EOF

            # Commit and push
            git add "$RESPONSE_FILE"
            git commit -m "Response to $ORDER_ID" 2>/dev/null || true
            git push 2>/dev/null || echo "Push failed"

            LAST_ORDER="$ORDER_ID"
            echo "[$(date '+%H:%M:%S')] Response sent for $ORDER_ID"
            echo ""
        fi
    fi

    # Wait 2 minutes
    sleep 120
done
