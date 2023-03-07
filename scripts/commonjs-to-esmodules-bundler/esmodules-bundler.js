// eslint-disable-next-line import/no-extraneous-dependencies
const esbuild = require('esbuild');

const options = [
	{
		name: 'keycloak-admin-client-lib',
		entryPoints: ['apps/server/src/shared/infra/identity-management/keycloak-admin-client-cjs-index.ts'],
		outdir: 'node_modules/@keycloak/keycloak-admin-client-cjs',
		platform: 'node',
		format: 'cjs',
		bundle: true,
		minify: true,
		loader: { '.js': 'jsx' },
	},
];

for (const option of options) {
	const { entryPoints, outdir, platform, format, bundle, minify, loader } = option;
	try {
		esbuild.build({
			entryPoints,
			outdir,
			platform,
			format,
			bundle,
			minify,
			loader,
		});
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}
