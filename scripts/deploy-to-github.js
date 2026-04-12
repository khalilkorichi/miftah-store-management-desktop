import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const REPOS = [
  { owner: 'khalilkorichi', repo: 'miftah-store-app', branch: 'main' },
  { owner: 'khalilkorichi', repo: 'miftah-store-management-desktop', branch: 'master' }
];

const SYNC_DIRS = ['dist', 'src', 'electron', 'public', 'scripts'];
const SYNC_ROOT_FILES = ['index.html', 'package.json', 'vite.config.js', 'eslint.config.js'];
const EXCLUDE = ['node_modules', '.git', '.local', '.cache', '.replit', 'attached_assets', '.upm', '.canvas', 'package-lock.json'];

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('❌ GITHUB_TOKEN غير موجود. يرجى تعيينه أولاً.');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json'
};

function gitBlobSha(buffer) {
  const header = `blob ${buffer.length}\0`;
  return crypto.createHash('sha1').update(Buffer.from(header)).update(buffer).digest('hex');
}

function getLocalFiles() {
  const files = new Map();

  for (const dir of SYNC_DIRS) {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;
    walkDir(dirPath, ROOT, files);
  }

  for (const file of SYNC_ROOT_FILES) {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      files.set(file, { sha: gitBlobSha(content), size: content.length });
    }
  }

  return files;
}

function walkDir(dir, base, files) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const rel = path.relative(base, fullPath).replace(/\\/g, '/');
    if (EXCLUDE.some(e => rel.startsWith(e) || rel.includes(`/${e}`))) continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, base, files);
    } else {
      const content = fs.readFileSync(fullPath);
      files.set(rel, { sha: gitBlobSha(content), size: content.length });
    }
  }
}

async function githubApi(url, options = {}) {
  const resp = await fetch(url, { headers, ...options });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`GitHub API ${resp.status}: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function getRemoteTree(owner, repo, branch) {
  const tree = await githubApi(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  const files = new Map();
  for (const t of tree.tree) {
    if (t.type === 'blob') {
      const isTracked = SYNC_DIRS.some(d => t.path.startsWith(d + '/')) || SYNC_ROOT_FILES.includes(t.path);
      if (isTracked) {
        files.set(t.path, { sha: t.sha });
      }
    }
  }
  return files;
}

async function getFileSha(owner, repo, branch, filePath) {
  try {
    const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, { headers });
    if (resp.ok) {
      const data = await resp.json();
      return data.sha;
    }
  } catch {}
  return null;
}

async function uploadFile(owner, repo, branch, filePath) {
  const localPath = path.join(ROOT, filePath);
  const content = fs.readFileSync(localPath);
  const sha = await getFileSha(owner, repo, branch, filePath);
  const body = {
    message: `تحديث: ${filePath}`,
    content: content.toString('base64'),
    branch
  };
  if (sha) body.sha = sha;
  await githubApi(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

async function deleteFile(owner, repo, branch, filePath) {
  const sha = await getFileSha(owner, repo, branch, filePath);
  if (!sha) return;
  await githubApi(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message: `حذف: ${filePath}`,
      sha,
      branch
    })
  });
}

async function syncRepo(repoConfig, localFiles) {
  const { owner, repo, branch } = repoConfig;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 مزامنة: ${owner}/${repo} (${branch})`);
  console.log('='.repeat(60));

  const remoteFiles = await getRemoteTree(owner, repo, branch);

  const toUpload = [];
  const toDelete = [];

  for (const [filePath, local] of localFiles) {
    const remote = remoteFiles.get(filePath);
    if (!remote || remote.sha !== local.sha) {
      toUpload.push(filePath);
    }
  }

  for (const [filePath] of remoteFiles) {
    if (!localFiles.has(filePath)) {
      const isTracked = SYNC_DIRS.some(d => filePath.startsWith(d + '/')) || SYNC_ROOT_FILES.includes(filePath);
      if (isTracked) {
        toDelete.push(filePath);
      }
    }
  }

  if (toUpload.length === 0 && toDelete.length === 0) {
    console.log('✅ لا توجد تغييرات - كل شيء محدث');
    return { uploaded: 0, deleted: 0 };
  }

  console.log(`\n📤 ملفات للرفع: ${toUpload.length}`);
  console.log(`🗑️  ملفات للحذف: ${toDelete.length}`);

  for (const filePath of toDelete) {
    try {
      await deleteFile(owner, repo, branch, filePath);
      console.log(`  🗑️  ${filePath}`);
    } catch (err) {
      console.error(`  ❌ فشل حذف ${filePath}: ${err.message}`);
    }
  }

  for (let i = 0; i < toUpload.length; i++) {
    const filePath = toUpload[i];
    const progress = `[${i + 1}/${toUpload.length}]`;
    try {
      await uploadFile(owner, repo, branch, filePath);
      console.log(`  ✅ ${progress} ${filePath}`);
    } catch (err) {
      console.error(`  ❌ ${progress} فشل رفع ${filePath}: ${err.message}`);
    }
  }

  return { uploaded: toUpload.length, deleted: toDelete.length };
}

async function main() {
  console.log('🔨 بناء المشروع...\n');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('❌ فشل بناء المشروع');
    process.exit(1);
  }

  console.log('\n📂 جمع الملفات المحلية...');
  const localFiles = getLocalFiles();
  console.log(`  📄 ${localFiles.size} ملف`);

  let totalUploaded = 0;
  let totalDeleted = 0;

  for (const repoConfig of REPOS) {
    const result = await syncRepo(repoConfig, localFiles);
    totalUploaded += result.uploaded;
    totalDeleted += result.deleted;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ اكتمل النشر بنجاح!');
  console.log(`  📤 ملفات تم رفعها: ${totalUploaded}`);
  console.log(`  🗑️  ملفات تم حذفها: ${totalDeleted}`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('❌ خطأ:', err.message);
  process.exit(1);
});
