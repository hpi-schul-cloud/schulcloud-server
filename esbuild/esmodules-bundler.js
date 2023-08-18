/* eslint-disable import/no-extraneous-dependencies */
const { dtsPlugin } = require('esbuild-plugin-d.ts');
const { build } = require('esbuild');

// add files to be transformed from CommonJs to EsModules in the following list
const options = [
	{
		name: 'keycloak-admin-client-lib',
		entryPoint: ['esbuild/content/keycloak-admin-client-cjs-index.ts'],
		outdir: 'node_modules/@keycloak/keycloak-admin-client-cjs',
	},
	{
		name: 'stream-mime-type-lib',
		entryPoint: ['esbuild/content/stream-mime-type-cjs-index.ts'],
		outdir: 'node_modules/stream-mime-type-cjs',
	},
];

const globalOptions = {
	platform: 'node',
	format: 'cjs',
	bundle: true,
	minify: true,
	loader: { '.js': 'jsx' },
};

for (const option of options) {
	const { entryPoint, outdir } = option;
	try {
		build({
			entryPoints: entryPoint,
			outdir,
			platform: globalOptions.platform,
			format: globalOptions.format,
			bundle: globalOptions.bundle,
			minify: globalOptions.minify,
			loader: globalOptions.loader,
			plugins: [dtsPlugin()],
		});
	} catch (e) {
		process.exit(1);
	}
}
