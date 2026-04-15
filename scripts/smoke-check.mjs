const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:5000/api';

async function run() {
  const checks = [
    {
      name: 'Health live',
      url: `${baseUrl}/health/live`,
      expectedStatus: 200
    },
    {
      name: 'Health ready',
      url: `${baseUrl}/health/ready`,
      expectedStatus: 200
    },
    {
      name: 'Auth required route blocks anonymous access',
      url: `${baseUrl}/reports/dashboard`,
      expectedStatus: 401
    }
  ];

  let failed = false;

  for (const check of checks) {
    try {
      const response = await fetch(check.url);
      const ok = response.status === check.expectedStatus;
      const marker = ok ? 'OK' : 'FAIL';

      console.log(`${marker} | ${check.name} | status=${response.status} expected=${check.expectedStatus}`);

      if (!ok) {
        failed = true;
      }
    } catch (error) {
      failed = true;
      console.log(`FAIL | ${check.name} | error=${error.message}`);
    }
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log('Smoke checks passed.');
}

run();
