/* 比对本地与 GitHub 的内容是否一致（用 tree SHA，而非 commit SHA）
 * commit SHA 会因提交者/时间不同而不同，tree SHA 只取决于内容。
 */
const { execSync } = require('child_process');

const path = require('path');
const ROOT = path.join(__dirname, '..');
const sh = (cmd) => execSync(cmd, { encoding: 'utf8', cwd: ROOT }).trim();

const localCommit = sh('git rev-parse HEAD');
// 不用 HEAD^{tree}：^ 在 Windows 的 PowerShell -> Node -> cmd 链路里会被吞掉。
// 改用 cat-file 输出 commit 对象，再取 tree 行。
const commitObj = sh('git cat-file -p HEAD');
const localTree = /^tree ([0-9a-f]{40})$/m.exec(commitObj)[1];

const remoteCommit = sh('gh api repos/FANSTARNEVERDIE/ziwei/commits/main --jq .sha');
const remoteTree = sh('gh api repos/FANSTARNEVERDIE/ziwei/commits/main --jq .commit.tree.sha');

console.log('本地 commit:', localCommit.slice(0, 8));
console.log('本地 tree  :', localTree.slice(0, 8));
console.log('远端 commit:', remoteCommit.slice(0, 8));
console.log('远端 tree  :', remoteTree.slice(0, 8));
console.log('');

if (localTree === remoteTree) {
  console.log('✓ tree 完全相同 —— 内容一致');
  console.log('  （commit SHA 不同是正常的：提交者与时间不同）');
} else {
  console.log('✗ tree 不同，内容有差异');
  // 列出差异
  try {
    const localFiles = sh('git ls-tree -r HEAD --format=%(objectname) %(path)').split('\n');
    console.log('\n本地 ' + localFiles.length + ' 个条目');
  } catch (e) { }
  process.exit(1);
}

// 顺带确认文件数
const remoteCount = sh('gh api "repos/FANSTARNEVERDIE/ziwei/git/trees/' + remoteTree + '?recursive=1" --jq "[.tree[] | select(.type==\\"blob\\")] | length"');
// 用 git ls-tree -r（每行一个条目，第一个字段是 mode）来数，避免 NUL 与换行差异
const localCount = sh('git ls-tree -r HEAD').split('\n').filter((l) => l.trim()).length;
console.log('\n本地文件数: ' + localCount);
console.log('远端文件数: ' + remoteCount);
if (String(localCount) !== String(remoteCount)) {
  console.log('✗ 文件数不一致');
  process.exit(1);
}
console.log('✓ 文件数一致');