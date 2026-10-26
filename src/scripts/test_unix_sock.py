import paramiko
import urllib.request
import ssl

HOST = "92.249.46.14"
PORT = 65002
USER = "u732572640"
KEY_FILE = r"C:\Users\Asus\.gemini\antigravity\brain\7e140920-11b7-473c-a16f-195b7c6f7e0a\hostinger_deploy_key"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
k = paramiko.Ed25519Key.from_private_key_file(KEY_FILE)
client.connect(hostname=HOST, port=PORT, username=USER, pkey=k, timeout=10)

test_script = """
cat << 'EOF' > /home/u732572640/sock_node.js
const http = require('http');
const fs = require('fs');
const sockPath = '/home/u732572640/node.sock';
if (fs.existsSync(sockPath)) fs.unlinkSync(sockPath);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('UNIX_SOCKET_COMMUNICATION_SUCCESSFUL!');
});

server.listen(sockPath, () => {
  fs.chmodSync(sockPath, 0777);
  console.log('Server listening on socket:', sockPath);
});
setTimeout(() => process.exit(0), 20000);
EOF

cat << 'EOF' > /home/u732572640/domains/fruitsandnuts.co.in/Public_html/test_sock.php
<?php
$sockPath = '/home/u732572640/node.sock';
if (!file_exists($sockPath)) {
  die("Socket file does not exist: " . $sockPath);
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_UNIX_SOCKET_PATH, $sockPath);
curl_setopt($ch, CURLOPT_URL, 'http://localhost/');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 4);
$resp = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);
echo "SOCKET_RESP: " . ($resp ?: "EMPTY") . " | ERR: " . ($err ?: "NONE");
EOF

/opt/alt/alt-nodejs22/root/usr/bin/node /home/u732572640/sock_node.js > /dev/null 2>&1 &
sleep 2
"""

stdin, stdout, stderr = client.exec_command(test_script)
stdout.read()
print("Socket server started. Probing https://fruitsandnuts.co.in/test_sock.php ...")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    req = urllib.request.Request("https://fruitsandnuts.co.in/test_sock.php", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=8) as response:
        content = response.read().decode()
        print("HTTP Status:", response.status)
        print("Response Content:", content)
except Exception as e:
    print("Request failed:", e)

# Cleanup
client.exec_command("rm -f /home/u732572640/sock_node.js /home/u732572640/node.sock /home/u732572640/domains/fruitsandnuts.co.in/Public_html/test_sock.php")
client.close()
