// dist/ を gh-pages ブランチとして push する（GitHub Pages 配信用）。このリポジトリは公開なので、個人のデータは絶対に含めない。
import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

import { rmSync } from 'node:fs';
const run = (cmd, cwd = 'dist') => execSync(cmd, { cwd, stdio: 'inherit' });
rmSync('dist/demo', { recursive: true, force: true }); // 手元の動作確認用データは公開しない
if (existsSync('dist/demo')) throw new Error('dist/demo が残っています');
if (!existsSync('dist/index.html')) throw new Error('先に npm run build を実行してください');
const remote = execSync('git remote get-url origin').toString().trim();
writeFileSync('dist/.nojekyll', '');
run('rm -rf .git && git init -q && git checkout -q -b gh-pages');
run('git add -A');
run('git -c user.name=deploy -c user.email=deploy@localhost commit -q -m "deploy"');
run(`git push -f ${remote} gh-pages`);
run('rm -rf .git');
console.log('公開しました: https://kota-mochizuki.github.io/intel-media-app/');
