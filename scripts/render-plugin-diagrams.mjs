import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Keep the renderer pinned so changes in layout are reviewed with the SVG output.
const expectedVersion = '11.12.0';
const actualVersion = execFileSync('mmdc', ['--version'], { encoding: 'utf8' }).trim();
if (actualVersion !== expectedVersion) {
    throw new Error(`Expected Mermaid CLI ${expectedVersion}, found ${actualVersion}`);
}
const directory = fileURLToPath(new URL('../docs/en/developer/plugins/diagrams/', import.meta.url));
for (const file of readdirSync(directory).filter(file => file.endsWith('.mmd')).sort()) {
    execFileSync('mmdc', [
        '-i', join(directory, file),
        '-o', join(directory, file.replace(/\.mmd$/, '.svg')),
        '-b', 'white',
        '-t', 'neutral',
    ], { stdio: 'inherit' });
}
