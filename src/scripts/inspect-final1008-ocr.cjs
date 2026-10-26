const fs = require('fs');

const raw = fs.readFileSync('C:/Users/Asus/.gemini/antigravity/brain/7e140920-11b7-473c-a16f-195b7c6f7e0a/scratch/final1008_images_ocr.json', 'utf8');
const data = JSON.parse(raw);

console.log('Total images in final1008:', data.length);
data.forEach(item => {
  if (item.Text.trim()) {
    console.log(`${item.RelPath} => "${item.Text.trim()}"`);
  } else {
    console.log(`${item.RelPath} => [NO TEXT / PHOTO ONLY]`);
  }
});
