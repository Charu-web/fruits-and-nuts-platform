const fs = require('fs');

const transcript = fs.readFileSync('C:/Users/Asus/.gemini/antigravity/brain/7e140920-11b7-473c-a16f-195b7c6f7e0a/.system_generated/logs/transcript.jsonl', 'utf8');

const lines = transcript.split('\n');
for (const l of lines) {
  if (l.includes('"media":') || l.includes('media_')) {
    const obj = JSON.parse(l);
    if (obj.media && obj.media.length > 0) {
      console.log('Step index:', obj.step_index, 'Media count:', obj.media.length);
      obj.media.forEach(m => console.log('  -', m.uri));
    }
  }
}
