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

transport = client.get_transport()
chan = transport.open_session()
print("Session channel opened.")

try:
    chan.get_pty()
    print("PTY acquired.")
    chan.invoke_shell()
    print("Shell invoked successfully!")
    time.sleep(1)
    chan.send("echo SHELL_ACTIVE_OK\n")
    time.sleep(1)
    output = chan.recv(4096).decode(errors="replace")
    print("OUTPUT:\n", output)
except Exception as e:
    print("Error:", e)

chan.close()
client.close()
