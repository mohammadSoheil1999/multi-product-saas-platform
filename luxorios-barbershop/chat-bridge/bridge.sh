#!/bin/bash

# Chat Bridge - Polls GitHub for commands and responds

REPO_URL="$1"  # Pass your repo URL as argument
WORK_DIR="/home/sohel/luxorios-barbershop/chat-bridge/repo"
ORDERS_FILE="orders.txt"
RESPONSE_FILE="response.txt"
LAST_ORDER=""

mkdir -p "$WORK_DIR"
cd "$WORK_DIR" || exit 1

# Clone if not exists
if [ ! -d ".git" ]; then
    git clone "$REPO_URL" .
fi

while true; do
    # Pull latest
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null

    if [ -f "$ORDERS_FILE" ]; then
        # Extract command ID and command
        ORDER_ID=$(grep -oP 'ID:\s*\K\S+' "$ORDERS_FILE" | head -1)
        COMMAND=$(grep -oP 'COMMAND:\s*\K.*' "$ORDERS_FILE" | head -1)

        # Check if new order
        if [ "$ORDER_ID" != "$LAST_ORDER" ] && [ -n "$COMMAND" ]; then
            echo "New command: $COMMAND"

            # Execute command (be careful with security!)
            RESULT=$(eval "$COMMAND" 2>&1)
            EXIT_CODE=$?

            # Write response
            cat > "$RESPONSE_FILE" << EOF
[ID: $ORDER_ID]
STATUS: $([ $EXIT_CODE -eq 0 ] && echo "done" || echo "error")
RESULT: $RESULT
TIME: $(date)
EOF

            # Commit and push
            git add "$RESPONSE_FILE"
            git commit -m "Response to order $ORDER_ID"
            git push

            LAST_ORDER="$ORDER_ID"
        fi
    fi

    # Wait 2 minutes
    sleep 120
done
