#!/bin/bash

# Cascade Bridge - Brings GitHub messages to Windsurf for Cascade to respond

REPO_URL="$1"
WORK_DIR="/home/sohel/luxorios-barbershop/chat-bridge/repo"
QUEUE_DIR="/home/sohel/luxorios-barbershop/chat-bridge/message-queue"
ORDERS_FILE="orders.txt"
RESPONSE_FILE="response.txt"
LAST_ORDER=""

mkdir -p "$WORK_DIR"
mkdir -p "$QUEUE_DIR"
cd "$WORK_DIR" || exit 1

if [ ! -d ".git" ]; then
    echo "Cloning repo..."
    git clone "$REPO_URL" .
fi

echo "Cascade Bridge started - Bringing messages to Windsurf"
echo "Repo: $REPO_URL"
echo ""
echo "How it works:"
echo "1. You write in orders.txt on GitHub (from your phone)"
echo "2. Bridge copies it to message-queue/ folder in Windsurf"
echo "3. You open that file and I (Cascade) see it and respond"
echo "4. Bridge pushes my response back to response.txt on GitHub"
echo ""

while true; do
    git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || true

    if [ -f "$ORDERS_FILE" ]; then
        ORDER_ID=$(grep -oP 'ID:\s*\K\S+' "$ORDERS_FILE" 2>/dev/null | head -1)
        
        # Get message content (everything except ID line)
        MESSAGE=$(grep -v "^ID:" "$ORDERS_FILE" 2>/dev/null | grep -v "^$" | head -1)
        
        # If starts with MESSAGE:, remove that prefix
        if echo "$MESSAGE" | grep -q "^MESSAGE:"; then
            MESSAGE=$(echo "$MESSAGE" | sed 's/^MESSAGE: //')
        fi
        # If starts with COMMAND:, remove that prefix  
        if echo "$MESSAGE" | grep -q "^COMMAND:"; then
            MESSAGE=$(echo "$MESSAGE" | sed 's/^COMMAND: //')
        fi

        if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "$LAST_ORDER" ] && [ -n "$MESSAGE" ]; then
            echo "[$(date '+%H:%M:%S')] 📩 New message from phone: $ORDER_ID"
            echo "Message: $MESSAGE"
            
            # Write to queue for Cascade to see
            cat > "$QUEUE_DIR/$ORDER_ID.txt" << EOF
=== NEW MESSAGE FROM GITHUB ===
ID: $ORDER_ID
TIME: $(date)

MESSAGE FROM YOU:
$MESSAGE

=== CASCADE, PLEASE RESPOND ===

Write your response below this line, then save this file.
The bridge will automatically push it to response.txt on GitHub.

MY RESPONSE:


EOF

            # Create an instruction file
            cat > "$QUEUE_DIR/_INSTRUCTION.txt" << EOF
🚨 NEW MESSAGE FROM YOUR PHONE!

File: $QUEUE_DIR/$ORDER_ID.txt

Open that file in Windsurf and I'll respond to it.
After you save my response, the bridge will push it to GitHub.
EOF

            # Notify via a popup if possible (using notify-send if available)
            which notify-send > /dev/null 2>&1 && \
                notify-send "New GitHub Message" "ID: $ORDER_ID - Check message-queue folder" 2>/dev/null || true

            echo "[$(date '+%H:%M:%S')] ✏️  Written to: $QUEUE_DIR/$ORDER_ID.txt"
            echo "[$(date '+%H:%M:%S')] Waiting for Cascade's response..."
            
            LAST_ORDER="$ORDER_ID"
            
            # Now wait for Cascade's response (user will edit the file)
            # Poll for changes in the file (when response section is filled)
            WAIT_TIME=0
            MAX_WAIT=999999  # Wait indefinitely (no timeout)
            
            while [ $WAIT_TIME -lt $MAX_WAIT ]; do
                sleep 10
                WAIT_TIME=$((WAIT_TIME + 10))
                
                # Check if response was written (look for content after "MY RESPONSE:")
                if [ -f "$QUEUE_DIR/$ORDER_ID.txt" ]; then
                    RESPONSE_CONTENT=$(sed -n '/MY RESPONSE:/,$p' "$QUEUE_DIR/$ORDER_ID.txt" 2>/dev/null | tail -n +2 | grep -v "^$")
                    
                    if [ -n "$RESPONSE_CONTENT" ]; then
                        echo "[$(date '+%H:%M:%S')] ✍️  Response found! Pushing to GitHub..."
                        
                        # Write to response.txt for GitHub
                        cat > "$RESPONSE_FILE" << EOF
[ID: $ORDER_ID]

$MESSAGE

CASCADE:
$RESPONSE_CONTENT

TIME: $(date)
EOF

                        git add "$RESPONSE_FILE"
                        git commit -m "Response to $ORDER_ID" 2>/dev/null || true
                        git push 2>/dev/null || echo "Push failed, will retry..."
                        
                        echo "[$(date '+%H:%M:%S')] ✅ Response pushed to GitHub!"
                        
                        # Mark as done
                        mv "$QUEUE_DIR/$ORDER_ID.txt" "$QUEUE_DIR/done-$ORDER_ID.txt" 2>/dev/null || true
                        rm "$QUEUE_DIR/_INSTRUCTION.txt" 2>/dev/null || true
                        
                        break
                    fi
                fi
            done
            
            if [ $WAIT_TIME -ge $MAX_WAIT ]; then
                echo "[$(date '+%H:%M:%S')] ⏱️  Timeout waiting for response"
                
                # Push timeout notice
                cat > "$RESPONSE_FILE" << EOF
[ID: $ORDER_ID]

$MESSAGE

CASCADE:
⏱️ I haven't responded yet. Check back in a few minutes, or open your laptop to see the message.

TIME: $(date)
EOF
                git add "$RESPONSE_FILE"
                git commit -m "Timeout for $ORDER_ID" 2>/dev/null || true
                git push 2>/dev/null || true
            fi
            
            echo ""
        fi
    fi

    # Check again in 2 minutes
    sleep 120
done
