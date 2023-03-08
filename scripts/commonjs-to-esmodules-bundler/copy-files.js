const path = require('path');
const fs = require('fs');

// In this list you can add files to be copied from one path to another.
const files = [
	{
		name: 'declaration file of keycloak-admin-client',
		fromPath: '../../dist/apps/server/shared/infra/identity-management/',
		sourceFileName: 'keycloak-admin-client-cjs-index.d.ts',
		toPath: '../../node_modules/@keycloak/keycloak-admin-client-cjs/',
		newFileName: 'keycloak-admin-client-cjs-index.d.ts',
	},
];

function copyFiles() {
	for (const file of files) {
		const { fromPath, sourceFileName, toPath, newFileName } = file;

		const source = path.join(__dirname, fromPath, sourceFileName);

		const target = path.join(__dirname, toPath, newFileName);

		fs.copyFileSync(source, target);
	}
}

copyFiles();
