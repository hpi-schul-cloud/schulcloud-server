/* eslint-disable import/no-extraneous-dependencies */
const { dtsPlugin } = require('esbuild-plugin-d.ts');
const { build } = require('esbuild');

// add files to be transformed from CommonJs to EsModules in the following list
const options = [
	{
		name: 'keycloak-admin-client-lib',
		entryPoints: ['apps/esbuild/content/keycloak-admin-client-cjs-index.ts'],
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
		build({
			entryPoints,
			outdir,
			platform,
			format,
			bundle,
			minify,
			loader,
			plugins: [dtsPlugin()],
		});
	} catch (e) {
		process.exit(1);
	}
}
