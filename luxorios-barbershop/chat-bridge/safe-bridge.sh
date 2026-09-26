#!/bin/bash

# Safe Chat Bridge - Only predefined commands allowed

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

# Function to execute safe commands
execute_command() {
    local CMD="$1"
    local RESULT=""
    local STATUS="done"

    case "$CMD" in
        "status")
            RESULT=$(cd /home/sohel/luxorios-barbershop/backend && pm2 status 2>/dev/null || echo "Backend: $(pgrep -f 'node server.js' && echo 'running' || echo 'stopped')")
            RESULT="$RESULT
Frontend: $(pgrep -f 'vite' && echo 'running' || echo 'stopped')"
            ;;
        "restart-backend")
            RESULT=$(cd /home/sohel/luxorios-barbershop/backend && npm start 2>&1 &)
            RESULT="Backend restarted"
            ;;
        "check-appointments")
            RESULT=$(cd /home/sohel/luxorios-barbershop/backend && node -e "
                const mysql = require('mysql2');
                const db = mysql.createConnection({
                    host: process.env.DB_HOST || 'localhost',
                    user: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD || '',
                    database: process.env.DB_NAME || 'aborabe3'
                });
                db.query('SELECT COUNT(*) as count FROM appointments WHERE a_date >= CURDATE()', (err, res) => {
                    if (err) console.log('Error:', err.message);
                    else console.log('Future appointments:', res[0].count);
                    db.end();
                });
                setTimeout(() => process.exit(), 2000);
            " 2>&1)
            ;;
        "tail-logs")
            RESULT=$(tail -20 /home/sohel/luxorios-barbershop/logs/backend.log 2>&1)
            ;;
        "disk-space")
            RESULT=$(df -h /home 2>&1)
            ;;
        "uptime")
            RESULT=$(uptime 2>&1)
            ;;
        "help")
            RESULT="Available commands:
status - Check backend/frontend status
restart-backend - Restart backend server
check-appointments - Count future appointments
tail-logs - Show last 20 log lines
disk-space - Check disk usage
uptime - System uptime
help - Show this list"
            ;;
        *)
            RESULT="Unknown command: $CMD
Type 'help' for available commands."
            STATUS="error"
            ;;
    esac

    echo "$RESULT"
    return $([ "$STATUS" = "done" ] && echo 0 || echo 1)
}

echo "Bridge started. Polling every 2 minutes..."
echo "Repo: $REPO_URL"

while true; do
    # Pull latest
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true

    if [ -f "$ORDERS_FILE" ]; then
        # Extract command
        ORDER_ID=$(grep -oP 'ID:\s*\K\S+' "$ORDERS_FILE" 2>/dev/null | head -1)
        COMMAND=$(grep -oP 'COMMAND:\s*\K.*' "$ORDERS_FILE" 2>/dev/null | head -1)

        # Check if new order
        if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "$LAST_ORDER" ] && [ -n "$COMMAND" ]; then
            echo "[$$(date)] New order: $ORDER_ID - Command: $COMMAND"

            # Execute safe command
            RESULT=$(execute_command "$COMMAND" 2>&1)
            EXIT_CODE=$?

            # Write response
            cat > "$RESPONSE_FILE" << EOF
[ID: $ORDER_ID]
COMMAND: $COMMAND
STATUS: $([ $EXIT_CODE -eq 0 ] && echo "done" || echo "error")
RESULT:
$RESULT

TIME: $(date)
EOF

            # Commit and push
            git add "$RESPONSE_FILE"
            git commit -m "Response to $ORDER_ID: $COMMAND" 2>/dev/null || true
            git push 2>/dev/null || echo "Push failed, will retry..."

            LAST_ORDER="$ORDER_ID"
            echo "[$$(date)] Response sent for $ORDER_ID"
        fi
    fi

    # Wait 2 minutes
    sleep 120
done
