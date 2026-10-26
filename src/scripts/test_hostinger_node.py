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
cat << 'EOF' > /home/u732572640/node_proxy_test.js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('LITESPEED PROXY TO NODE 22 IS WORKING!');
});
server.listen(3008, '127.0.0.1', () => {
  console.log('Server running on 3008');
});
setTimeout(() => process.exit(0), 20000);
EOF

# Backup current htaccess
cp /home/u732572640/domains/fruitsandnuts.co.in/Public_html/.htaccess /home/u732572640/domains/fruitsandnuts.co.in/Public_html/.htaccess.bak

cat << 'EOF' > /home/u732572640/domains/fruitsandnuts.co.in/Public_html/.htaccess
RewriteEngine On
RewriteRule ^proxy-test$ http://127.0.0.1:3008/ [P,L]
EOF

/opt/alt/alt-nodejs22/root/usr/bin/node /home/u732572640/node_proxy_test.js > /dev/null 2>&1 &
sleep 2
"""

stdin, stdout, stderr = client.exec_command(test_script)
stdout.read()
print("Node server started with .htaccess proxy rule. Probing via HTTPS...")

# Test via external request to https://fruitsandnuts.co.in/proxy-test
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    req = urllib.request.Request("https://fruitsandnuts.co.in/proxy-test", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        content = response.read().decode()
        print("HTTP Status:", response.status)
        print("Response Content:", content)
except Exception as e:
    print("Request failed:", e)

# Restore htaccess
restore_script = """
mv /home/u732572640/domains/fruitsandnuts.co.in/Public_html/.htaccess.bak /home/u732572640/domains/fruitsandnuts.co.in/Public_html/.htaccess
rm -f /home/u732572640/node_proxy_test.js
"""
client.exec_command(restore_script)
client.close()
