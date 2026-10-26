import os
import paramiko

HOST = "92.249.46.14"
PORT = 65002
USER = "u732572640"
KEY_FILE = r"C:\Users\Asus\.gemini\antigravity\brain\7e140920-11b7-473c-a16f-195b7c6f7e0a\hostinger_deploy_key"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
k = paramiko.Ed25519Key.from_private_key_file(KEY_FILE)
client.connect(hostname=HOST, port=PORT, username=USER, pkey=k, timeout=15)
sftp = client.open_sftp()

local_dir = r"C:\Users\Asus\Downloads\fruits-and-nuts-website (1)\node_modules\.prisma\client"
remote_dir = "/home/u732572640/domains/fruitsandnuts.co.in/app/node_modules/.prisma/client"

engines = [
    "libquery_engine-rhel-openssl-3.0.x.so.node",
    "libquery_engine-debian-openssl-1.1.x.so.node",
    "libquery_engine-debian-openssl-3.0.x.so.node",
]

for eng in engines:
    loc_path = os.path.join(local_dir, eng)
    rem_path = f"{remote_dir}/{eng}"
    if os.path.exists(loc_path):
        size_mb = os.path.getsize(loc_path) / (1024 * 1024)
        print(f"Uploading {eng} ({size_mb:.1f} MB)...")
        sftp.put(loc_path, rem_path)
        print(f"  [OK] {eng} uploaded successfully!")

sftp.close()
client.close()
print("All Prisma Linux engines deployed to Hostinger!")
