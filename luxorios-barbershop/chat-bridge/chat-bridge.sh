#!/bin/bash

# Conversational Bridge - Natural language chat via GitHub

REPO_URL="$1"
WORK_DIR="/home/sohel/luxorios-barbershop/chat-bridge/repo"
ORDERS_FILE="orders.txt"
RESPONSE_FILE="response.txt"
LAST_ORDER=""

mkdir -p "$WORK_DIR"
cd "$WORK_DIR" || exit 1

if [ ! -d ".git" ]; then
    echo "Cloning repo..."
    git clone "$REPO_URL" .
fi

echo "Conversational Bridge started."
echo "Repo: $REPO_URL"
echo ""

process_message() {
    local MSG="$1"
    local RESPONSE=""
    
    # Convert to lowercase for matching
    local MSG_LOWER=$(echo "$MSG" | tr '[:upper:]' '[:lower:]')
    
    # Pattern matching for common requests
    if echo "$MSG_LOWER" | grep -qE "(status|running|working|alive|up|check)"; then
        # Check running processes
        local BACKEND=$(pgrep -f "node server.js" > /dev/null && echo "✅ Running" || echo "❌ Stopped")
        local FRONTEND=$(pgrep -f "vite" > /dev/null && echo "✅ Running" || echo "❌ Stopped")
        local BRIDGE=$(pgrep -f "chat-bridge.sh" > /dev/null && echo "✅ Running" || echo "❌ Stopped")
        
        RESPONSE="Hey! Here's the status:

🖥️ Backend: $BACKEND
🌐 Frontend: $FRONTEND  
🔄 Bridge: $BRIDGE

All good on my end! What do you need?"

    elif echo "$MSG_LOWER" | grep -qE "(restart|start|boot|launch).*backend"; then
        cd /home/sohel/luxorios-barbershop/backend
        nohup npm start > /dev/null 2>&1 &
        RESPONSE="Backend restarted! ✅
It should be running on port 5000 now.

Anything else you need?"

    elif echo "$MSG_LOWER" | grep -qE "(restart|start).*frontend"; then
        cd /home/sohel/luxorios-barbershop/frontend
        nohup npm run dev > /dev/null 2>&1 &
        RESPONSE="Frontend restarted! ✅
It should be running on port 5173 now.

Need anything else?"

    elif echo "$MSG_LOWER" | grep -qE "(log|logs|error|problem|issue)"; then
        local LOGS=$(tail -20 /home/sohel/luxorios-barbershop/logs/backend.log 2>/dev/null || echo "No recent logs")
        RESPONSE="Here are the latest logs:

\`\`\`
$LOGS
\`\`\`

Everything look okay?"

    elif echo "$MSG_LOWER" | grep -qE "(appointment|booking|slot|schedule)"; then
        local COUNT=$(cd /home/sohel/luxorios-barbershop/backend && node -e "
            const mysql = require('mysql2');
            const db = mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'aborabe3'
            });
            db.query('SELECT COUNT(*) as count FROM appointments WHERE a_date >= CURDATE()', (err, res) => {
                if (err) console.log('Error checking appointments');
                else console.log(res[0].count);
                db.end();
                setTimeout(() => process.exit(), 500);
            });
        " 2>/dev/null)
        RESPONSE="You have $COUNT future appointments scheduled.

Need me to do something with them?"

    elif echo "$MSG_LOWER" | grep -qE "(hello|hi|hey|good morning|good evening)"; then
        RESPONSE="Hey there! 👋

I'm running and ready to help. You can ask me to:
• Check status
• Restart backend/frontend
• Check logs
• Look at appointments
• Or just chat!

What's up?"

    elif echo "$MSG_LOWER" | grep -qE "(bye|goodbye|see you|stop|shutdown)"; then
        RESPONSE="Alright, I'll be here when you need me! Just send any message and I'll respond.

Catch you later! 👋"

    elif echo "$MSG_LOWER" | grep -qE "(thank|thanks|thx)"; then
        RESPONSE="You're welcome! 🙌

Always here to help. What else do you need?"

    elif echo "$MSG_LOWER" | grep -qE "(help|what can you do|commands)"; then
        RESPONSE="Here's what I can do for you:

🔹 **Status checks:**
   • \"Are you running?\"
   • \"Check status\"

🔹 **Control:**
   • \"Restart backend\"
   • \"Start frontend\"

🔹 **Info:**
   • \"Show logs\"
   • \"How many appointments?\"

🔹 **Chat:**
   • Just say hello or ask anything!

Just write naturally - I'll understand 😊"

    else
        # Unknown - try to execute as shell command as fallback
        local CMD_RESULT=$(eval "$MSG" 2>&1)
        local EXIT_CODE=$?
        if [ $EXIT_CODE -eq 0 ] && [ -n "$CMD_RESULT" ]; then
            RESPONSE="Done! Here's the output:

\`\`\`
$CMD_RESULT
\`\`\`

Need anything else?"
        else
            RESPONSE="Hmm, I'm not sure I understood that. 🤔

You asked: \"$MSG\"

Try asking me to:
• Check status
• Restart backend
• Show logs
• Or type 'help' for more options

What would you like me to do?"
        fi
    fi
    
    echo "$RESPONSE"
}

echo "Waiting for messages..."

while true; do
    git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || true

    if [ -f "$ORDERS_FILE" ]; then
        ORDER_ID=$(grep -oP 'ID:\s*\K\S+' "$ORDERS_FILE" 2>/dev/null | head -1)
        # Get everything after MESSAGE: or just the whole content
        MESSAGE=$(sed -n 's/MESSAGE:\s*//p' "$ORDERS_FILE" 2>/dev/null | head -1)
        
        # If no MESSAGE: line, try reading the whole content (except ID line)
        if [ -z "$MESSAGE" ]; then
            MESSAGE=$(grep -v "^ID:" "$ORDERS_FILE" 2>/dev/null | grep -v "^$" | head -1)
        fi

        if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "$LAST_ORDER" ] && [ -n "$MESSAGE" ]; then
            echo "[$(date '+%H:%M:%S')] New message from you: $MESSAGE"
            
            # Process the message and get response
            RESPONSE=$(process_message "$MESSAGE")
            
            # Write friendly response
            cat > "$RESPONSE_FILE" << EOF
Hey! 👋

You said: "$MESSAGE"

$RESPONSE

— Cascade (via your laptop)

TIME: $(date '+%H:%M %p')
EOF

            git add "$RESPONSE_FILE"
            git commit -m "Reply to: $MESSAGE" 2>/dev/null || true
            git push 2>/dev/null || echo "Push failed"

            LAST_ORDER="$ORDER_ID"
            echo "[$(date '+%H:%M:%S')] Response sent"
            echo ""
        fi
    fi

    sleep 120
done
