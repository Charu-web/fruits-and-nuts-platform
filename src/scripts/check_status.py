import paramiko
import time

HOST = "92.249.46.14"
PORT = 65002
USER = "u732572640"
KEY_FILE = r"C:\Users\Asus\.gemini\antigravity\brain\7e140920-11b7-473c-a16f-195b7c6f7e0a\hostinger_deploy_key"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
k = paramiko.Ed25519Key.from_private_key_file(KEY_FILE)

try:
    client.connect(hostname=HOST, port=PORT, username=USER, pkey=k, timeout=10)
    print("Paramiko connected successfully!")
    
    # Kill any dangling node processes from previous test
    stdin, stdout, stderr = client.exec_command("killall -9 node 2>/dev/null; ps aux | grep -v grep")
    print("OUTPUT:\n", stdout.read().decode())
    print("ERR:\n", stderr.read().decode())
    client.close()
except Exception as e:
    print("Connection error:", e)
