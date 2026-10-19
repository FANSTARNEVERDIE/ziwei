/* 通过 GitHub API 推送仓库内容
 *
 * 背景：本机 github.com:443 被阻断（git push 走不通），
 * 但 api.github.com 可达。因此改用 Git Data API 直接建树提交。
 *
 * 流程：blob -> tree -> commit -> 更新 ref
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OWNER = 'FANSTARNEVERDIE';
const REPO = 'ziwei';
const BRANCH = 'main';

const ROOT = path.join(__dirname, '..');

const os = require('os');

/* 把请求体写临时文件后用 --input 传，
 * 避免 execSync 的 input 选项与 gh 的 stdin 读取方式不兼容 */
let tmpSeq = 0;
function gh(method, endpoint, body) {
  let args = ['api', '-X', method, endpoint];
  if (body) {
    const tmp = path.join(os.tmpdir(), 'zw-push-' + (++tmpSeq) + '-' + Date.now() + '.json');
    fs.writeFileSync(tmp, JSON.stringify(body), 'utf8');
    args = args.concat(['--input', tmp]);
    try {
      const out = execSync('gh ' + args.map((a) => /[^A-Za-z0-9_\-/.=:]/.test(a) ? JSON.stringify(a) : a).join(' '),
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      return out.trim() ? JSON.parse(out) : null;
    } finally {
      try { fs.unlinkSync(tmp); } catch (e) { }
    }
  }
  const out = execSync('gh ' + args.join(' '), { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.trim() ? JSON.parse(out) : null;
}

/* 用 git 找出应提交的文件（尊重 .gitignore）
 * -z 用 NUL 分隔且不做路径转义，避免中文文件名被引号包住 */
function listFiles() {
  const out = execSync('git ls-files -z', { cwd: ROOT, encoding: 'utf8' });
  return out.split('\0').filter(Boolean);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const files = listFiles();
  console.log('本地跟踪文件: ' + files.length + ' 个');

  // 1) 取父提交（若分支已存在）
  let parentSha = null;
  try {
    const ref = gh('GET', `repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    parentSha = ref.object.sha;
    console.log('已有分支 ' + BRANCH + '，父提交 ' + parentSha.slice(0, 8));
  } catch (e) {
    console.log('分支 ' + BRANCH + ' 尚不存在，将创建首个提交');
  }

  // 2) 逐个上传 blob
  console.log('\n上传文件…');
  const tree = [];
  let done = 0;
  for (const rel of files) {
    const abs = path.join(ROOT, rel);
    const buf = fs.readFileSync(abs);
    const isBinary = /\.(png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(rel);

    const blob = gh('POST', `repos/${OWNER}/${REPO}/git/blobs`, {
      content: buf.toString('base64'),
      encoding: 'base64',
    });

    tree.push({
      path: rel.replace(/\\/g, '/'),
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });

    done++;
    if (done % 10 === 0 || done === files.length) {
      process.stdout.write('  ' + done + '/' + files.length + '\r');
    }
    // 轻微节流，避免触发二级限流
    if (done % 5 === 0) await sleep(120);
  }
  console.log('  ' + files.length + '/' + files.length + ' 完成');

  // 3) 建树
  console.log('\n创建 tree…');
  const treeBody = { tree };
  if (parentSha) {
    const parentCommit = gh('GET', `repos/${OWNER}/${REPO}/git/commits/${parentSha}`);
    treeBody.base_tree = parentCommit.tree.sha;
  }
  const newTree = gh('POST', `repos/${OWNER}/${REPO}/git/trees`, treeBody);
  console.log('  tree: ' + newTree.sha.slice(0, 8));

  // 4) 建提交
  console.log('\n创建 commit…');
  let msg = fs.readFileSync(path.join(ROOT, '.git', 'COMMIT_MSG_TMP'), 'utf8');
  // 防御：若消息文件被以 UTF-16 写入（PowerShell 的 > 重定向会这样），
  // 读出来会带 BOM 与乱码，导致 API 报 "Problems parsing JSON"
  msg = msg.replace(/^\uFEFF/, '').replace(/\0/g, '');
  if (!/^[\x20-\x7E\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\n\r]/.test(msg)) {
    throw new Error('提交信息编码异常，请用 Node 以 UTF-8 写入 .git/COMMIT_MSG_TMP');
  }

  const commitBody = {
    message: msg,
    tree: newTree.sha,
    parents: parentSha ? [parentSha] : [],
  };
  const commit = gh('POST', `repos/${OWNER}/${REPO}/git/commits`, commitBody);
  console.log('  commit: ' + commit.sha.slice(0, 8));

  // 5) 更新分支
  console.log('\n更新分支 ' + BRANCH + '…');
  if (parentSha) {
    const r = gh('PATCH', `repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      sha: commit.sha, force: false,
    });
    console.log('  已更新 -> ' + r.object.sha.slice(0, 8));
  } else {
    const r = gh('POST', `repos/${OWNER}/${REPO}/git/refs`, {
      ref: 'refs/heads/' + BRANCH, sha: commit.sha,
    });
    console.log('  已创建 -> ' + r.object.sha.slice(0, 8));
  }

  console.log('\n完成: https://github.com/' + OWNER + '/' + REPO);
})().catch((e) => {
  console.error('\n失败: ' + e.message);
  if (e.stdout) console.error(e.stdout.toString().slice(0, 800));
  if (e.stderr) console.error(e.stderr.toString().slice(0, 800));
  process.exit(1);
});