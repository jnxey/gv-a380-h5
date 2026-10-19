import { createHmac, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const apiProxyTarget = 'http://127.0.0.1:3200';
const devMemberId = '1';
const memberAccountType = 'MEMBER';
const devTokenLifetimeSeconds = 7 * 24 * 60 * 60;

/**
 * 从接口项目的环境文件读取一项。密钥不写进 H5 仓库。
 */
function readServerEnvValue(key) {
  const envPath = resolve(__dirname, '../gv-a380-server/.env');
  const envText = readFileSync(envPath, 'utf8');
  const lineList = envText.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lineList.length; lineIndex += 1) {
    const line = lineList[lineIndex];
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0 || line.startsWith('#')) {
      continue;
    }
    if (line.slice(0, separatorIndex) === key) {
      return line.slice(separatorIndex + 1);
    }
  }
  return '';
}

/**
 * 签发本地调试用的会员访问令牌。字段与接口守卫要求一致。
 */
function signDevMemberToken(secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: devMemberId,
      accountType: memberAccountType,
      jti: randomUUID(),
      iat: nowSeconds,
      exp: nowSeconds + devTokenLifetimeSeconds
    })
  ).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export default defineConfig(({ command }) => {
  const defineEnv = {};
  if (command === 'serve') {
    const jwtSecret = readServerEnvValue('JWT_SECRET');
    if (jwtSecret.trim() === '') {
      throw new Error('本地调试需要接口项目的 JWT_SECRET');
    }
    defineEnv['import.meta.env.VITE_DEV_MEMBER_TOKEN'] = JSON.stringify(signDevMemberToken(jwtSecret));
  }
  return {
    plugins: [vue()],
    define: defineEnv,
    server: {
      host: '0.0.0.0',
      port: 5174,
      proxy: {
        '/app': {
          target: apiProxyTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: apiProxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
