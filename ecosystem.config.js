module.exports = {
  apps: [
    {
      name: 'proptivio-sales',
      cwd: '/root/self-hosted-claude/FusionETA/proptivio/sales-portal-pmid',
      interpreter: '/usr/local/bin/node',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        BITRIX24_WEBHOOK_URL: 'https://fusion.bitrix24.com/rest/152/9kb90xso1fvzdknm/',
        PORTAL_PASSWORD: 'proptivio123',
      },
    },
    {
      name: 'proptivio-buyer',
      cwd: '/root/self-hosted-claude/FusionETA/proptivio/buyer-portal/property-portal-nextjs-fixed',
      interpreter: '/usr/local/bin/node',
      script: 'node_modules/.bin/next',
      args: 'start -p 3002',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        NEXT_PUBLIC_BITRIX24_WEBHOOK: 'https://fusion.bitrix24.com/rest/38/ghgrjkyk1ybf8fd9/',
        BITRIX24_DOMAIN: 'https://fusion.bitrix24.com',
        BITRIX24_LOGIN_EMAIL: 'cy@fusioneta.com',
        BITRIX24_LOGIN_PASSWORD: 'cyCheongPass123!',
        BUYER_PASSWORD: 'testtest123',
        PROGRESSIVE_BILLING_CATEGORY: '4',
      },
    },
    {
      name: 'proptivio-commission',
      cwd: '/root/self-hosted-claude/FusionETA/proptivio/commission-portal/commission-portal',
      interpreter: '/usr/local/bin/node',
      script: 'node_modules/.bin/next',
      args: 'start -p 3003',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
    },
    {
      name: 'proptivio-dashboard',
      cwd: '/root/self-hosted-claude/FusionETA/proptivio/management-dashboard',
      interpreter: '/usr/local/bin/node',
      script: 'node_modules/.bin/next',
      args: 'start -p 3004',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
    },
  ],
};
