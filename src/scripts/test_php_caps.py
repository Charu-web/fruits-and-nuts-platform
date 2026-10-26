import paramiko

HOST = "92.249.46.14"
PORT = 65002
USER = "u732572640"
KEY_FILE = r"C:\Users\Asus\.gemini\antigravity\brain\7e140920-11b7-473c-a16f-195b7c6f7e0a\hostinger_deploy_key"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
k = paramiko.Ed25519Key.from_private_key_file(KEY_FILE)
client.connect(hostname=HOST, port=PORT, username=USER, pkey=k, timeout=10)

test_script = """
/usr/bin/php -r '
  echo "PHP cURL: " . (function_exists("curl_init") ? "YES" : "NO") . "\\n";
  echo "PHP socket_client: " . (function_exists("stream_socket_client") ? "YES" : "NO") . "\\n";
  echo "PHP exec: " . (function_exists("exec") ? "YES" : "NO") . "\\n";
  echo "PHP shell_exec: " . (function_exists("shell_exec") ? "YES" : "NO") . "\\n";
  echo "PHP proc_open: " . (function_exists("proc_open") ? "YES" : "NO") . "\\n";
'
"""

stdin, stdout, stderr = client.exec_command(test_script)
print("PHP CAPABILITIES:")
print(stdout.read().decode())
print(stderr.read().decode())
client.close()
