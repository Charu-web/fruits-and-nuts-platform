import paramiko

HOST = "92.249.46.14"
PORT = 65002
USER = "u732572640"
KEY_FILE = r"C:\Users\Asus\.gemini\antigravity\brain\7e140920-11b7-473c-a16f-195b7c6f7e0a\hostinger_deploy_key"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
k = paramiko.Ed25519Key.from_private_key_file(KEY_FILE)

try:
    client.connect(hostname=HOST, port=PORT, username=USER, pkey=k, timeout=10)
    print("SSH Connection successful!")
    sftp = client.open_sftp()
    print("SFTP opened successfully!")
    files = sftp.listdir("/home/u732572640")
    print("Home files:", files)
    sftp.close()
    client.close()
except Exception as e:
    print("SFTP error:", e)
