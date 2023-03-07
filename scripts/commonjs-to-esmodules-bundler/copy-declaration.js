const path = require('path');
const fs = require('fs');

const fromPath = path.join(
	__dirname,
	'../../dist/apps/server/shared/infra/identity-management/',
	'keycloak-admin-client-cjs-index.d.ts'
);
const toPath = path.join(
	__dirname,
	'../../node_modules/@keycloak/keycloak-admin-client-cjs/',
	'keycloak-admin-client-cjs-index.d.ts'
);
fs.copyFileSync(fromPath, toPath);
