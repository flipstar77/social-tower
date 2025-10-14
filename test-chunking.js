const fs = require('fs');

const content = fs.readFileSync('d:/social tower/complete-labs-guide.md', 'utf-8');
const lines = content.split('\n');

let chunks = [];
let currentChunk = { title: '', content: '', level: 0 };

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{2,3})\s+(.+)$/);

    if (headerMatch) {
        // Save previous chunk if it has content
        if (currentChunk.content.trim()) {
            chunks.push({ ...currentChunk });
            console.log(`Saved chunk: "${currentChunk.title}" (${currentChunk.content.length} chars)`);
        }

        // Start new chunk
        currentChunk = {
            title: headerMatch[2],
            content: `# Complete Labs Guide\n\n${line}\n\n`,
            level: headerMatch[1].length
        };
    } else {
        currentChunk.content += line + '\n';
    }
}

// Save final chunk
if (currentChunk.content.trim()) {
    chunks.push({ ...currentChunk });
    console.log(`Saved final chunk: "${currentChunk.title}" (${currentChunk.content.length} chars)`);
}

console.log(`\n📊 Total chunks: ${chunks.length}`);
console.log(`Expected: ~140-160 (one per lab + sections)`);
