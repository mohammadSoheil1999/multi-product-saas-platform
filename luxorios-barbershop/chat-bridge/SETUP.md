# GitHub Chat Bridge Setup

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a **private** repo named `luxorios-bridge` (or any name)
3. Don't initialize with README (we'll add files)

## Step 2: Configure Git on Your Laptop

Open terminal and run:

```bash
# Set your name and email
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Create GitHub Personal Access Token:
# 1. Go to https://github.com/settings/tokens
# 2. Click "Generate new token (classic)"
# 3. Select 'repo' scope
# 4. Copy the token

# Store credentials (replace TOKEN with your actual token)
cd /home/sohel/luxorios-barbershop/chat-bridge
git config --global credential.helper store
```

## Step 3: Initialize Repo with Template Files

```bash
cd /home/sohel/luxorios-barbershop/chat-bridge
mkdir -p repo
cd repo

# Initialize git
git init
git remote add origin https://github.com/YOUR_USERNAME/luxorios-bridge.git

# Copy template files
cp ../template-orders.txt orders.txt
cp ../template-response.txt response.txt

# Push to GitHub
git add .
git commit -m "Initial setup"
git push -u origin main
```

When it asks for password, use your **GitHub Personal Access Token**.

## Step 4: Start the Bridge

```bash
cd /home/sohel/luxorios-barbershop/chat-bridge
./safe-bridge.sh https://github.com/YOUR_USERNAME/luxorios-bridge.git
```

Leave this running (use `screen` or `tmux` to keep it alive).

## Step 5: Use From Your Phone

1. Open GitHub mobile app or browser
2. Go to your `luxorios-bridge` repo
3. Edit `orders.txt`:
   ```
   [ID: 002]
   COMMAND: status
   ```
4. Change the ID number each time!
5. Wait 2-3 minutes
6. Refresh and check `response.txt`

## Available Commands

- `help` - Show all commands
- `status` - Check if backend/frontend running
- `restart-backend` - Restart the backend server
- `check-appointments` - Count future appointments
- `tail-logs` - Show last 20 log lines
- `disk-space` - Check disk space
- `uptime` - System uptime

## Important

- **Always change the ID** when sending a new command
- The bridge only responds to **new** IDs
- Keep your repo **private** for security
