import sys
import os
import paramiko

HOST = "92.249.46.14"
PORT = 65002
USER = "u732572640"
KEY_FILE = r"C:\Users\Asus\.gemini\antigravity\brain\7e140920-11b7-473c-a16f-195b7c6f7e0a\hostinger_deploy_key"

def main():
    password = None
    if len(sys.argv) > 1 and sys.argv[1].strip():
        password = sys.argv[1].strip()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    connected = False
    print(f"Connecting to Hostinger: {USER}@{HOST}:{PORT} ...")

    # Try key first if exists
    if os.path.exists(KEY_FILE):
        try:
            k = paramiko.Ed25519Key.from_private_key_file(KEY_FILE)
            client.connect(hostname=HOST, port=PORT, username=USER, pkey=k, timeout=10)
            connected = True
            print("Connected successfully using SSH Public Key authentication!")
        except Exception as e:
            print(f"SSH Key auth attempt: {e}")

    # Try password if provided and not yet connected
    if not connected and password:
        try:
            client.connect(hostname=HOST, port=PORT, username=USER, password=password, timeout=10)
            connected = True
            print("Connected successfully using SSH Password authentication!")
        except Exception as e:
            print(f"SSH Password auth attempt failed: {e}")
            sys.exit(1)

    if not connected:
        print("ERROR: Authentication failed. Neither SSH Key nor valid password succeeded.")
        sys.exit(2)

    commands = [
        ("System Info", "uname -a"),
        ("Current User & Directory", "whoami && pwd"),
        ("Disk Space", "df -h ."),
        ("Node.js Version", "which node && node -v || echo 'node not found'"),
        ("NPM Version", "which npm && npm -v || echo 'npm not found'"),
        ("PM2 Status", "which pm2 && pm2 -v || echo 'pm2 not found'"),
        ("Running Node Processes", "ps aux | grep -E 'node|next|pm2' | grep -v grep || echo 'None'"),
        ("Directory Listing (Document Roots)", "ls -la /home/u732572640/ && ls -la /home/u732572640/public_html 2>/dev/null || echo 'No public_html'"),
        ("Domains Configured", "ls -la /home/u732572640/domains 2>/dev/null || echo 'No domains dir'"),
    ]

    print("\n=== HOSTINGER SERVER ENVIRONMENT PROBE ===")
    for title, cmd in commands:
        print(f"\n--- {title} [{cmd}] ---")
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode("utf-8", errors="replace").strip()
        err = stderr.read().decode("utf-8", errors="replace").strip()
        if out:
            print(out)
        if err:
            print(f"ERR: {err}")

    client.close()
    print("\n=== PROBE COMPLETE ===")

if __name__ == "__main__":
    main()
