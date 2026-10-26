import os
import sys
import time
import paramiko

HOST = "92.249.46.14"
PORT = 65002
USER = "u732572640"
KEY_FILE = r"C:\Users\Asus\.gemini\antigravity\brain\7e140920-11b7-473c-a16f-195b7c6f7e0a\hostinger_deploy_key"
LOCAL_ARCHIVE = r"C:\Users\Asus\Downloads\fruits-and-nuts-website (1)\deploy_fruitsandnuts.tar.gz"
REMOTE_DEST = "/home/u732572640/deploy_fruitsandnuts.tar.gz"

def progress_callback(transferred, total):
    percent = (transferred / total) * 100
    mb_trans = transferred / (1024 * 1024)
    mb_tot = total / (1024 * 1024)
    sys.stdout.write(f"\rUploading: {mb_trans:.2f} MB / {mb_tot:.2f} MB ({percent:.1f}%)")
    sys.stdout.flush()

def main():
    print("Connecting to Hostinger SFTP...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    k = paramiko.Ed25519Key.from_private_key_file(KEY_FILE)
    client.connect(hostname=HOST, port=PORT, username=USER, pkey=k, timeout=15)

    sftp = client.open_sftp()
    print(f"Uploading {LOCAL_ARCHIVE} -> {REMOTE_DEST} ...")
    start_time = time.time()
    sftp.put(LOCAL_ARCHIVE, REMOTE_DEST, callback=progress_callback)
    duration = time.time() - start_time
    print(f"\nUpload complete in {duration:.1f} seconds!")
    sftp.close()
    client.close()

if __name__ == "__main__":
    main()
