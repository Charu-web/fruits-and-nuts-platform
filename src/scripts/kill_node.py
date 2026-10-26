import paramiko
import time

HOST = "92.249.46.14"
PORT = 65002
USER = "u732572640"
KEY_FILE = r"C:\Users\Asus\.gemini\antigravity\brain\7e140920-11b7-473c-a16f-195b7c6f7e0a\hostinger_deploy_key"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
k = paramiko.Ed25519Key.from_private_key_file(KEY_FILE)

client.connect(hostname=HOST, port=PORT, username=USER, pkey=k, timeout=10)
print("Connected to SSH. Opening interactive shell...")

shell = client.invoke_shell()
time.sleep(1)

shell.send("killall -9 node\n")
time.sleep(1)
shell.send("ps -u u732572640 -o pid,comm,args\n")
time.sleep(1)

output = ""
while shell.recv_ready():
    output += shell.recv(4096).decode("utf-8", errors="replace")

print("SHELL OUTPUT:\n", output)

shell.close()
client.close()
