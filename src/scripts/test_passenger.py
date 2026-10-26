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
cat << 'EOF' > /home/u732572640/domains/fruitsandnuts.co.in/Public_html/app.js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('PASSENGER_TEST_SUCCESS');
});
server.listen(process.env.PORT || 3000);
EOF

cat << 'EOF' > /home/u732572640/domains/fruitsandnuts.co.in/Public_html/.htaccess
PassengerAppRoot /home/u732572640/domains/fruitsandnuts.co.in/Public_html
PassengerAppType node
PassengerStartupFile app.js
PassengerNodejs /opt/alt/alt-nodejs22/root/usr/bin/node
EOF
"""

stdin, stdout, stderr = client.exec_command(test_script)
stdout.read()
print("Passenger config created. Testing via HTTPS...")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    req = urllib.request.Request("https://fruitsandnuts.co.in/", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        content = response.read().decode(errors="replace")
        print("HTTP Status:", response.status)
        print("Response Content preview:", content[:200])
except Exception as e:
    print("Request failed:", e)

# Clean up test
cleanup_script = """
rm -f /home/u732572640/domains/fruitsandnuts.co.in/Public_html/app.js
cat << 'EOF' > /home/u732572640/domains/fruitsandnuts.co.in/Public_html/.htaccess
# Fruits & Nuts
EOF
"""
client.exec_command(cleanup_script)
client.close()
