/* eslint-disable import/no-extraneous-dependencies */
const { dtsPlugin } = require('esbuild-plugin-d.ts');
const { build } = require('esbuild');
const { exec } = require('child_process');

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
		// Path to file containing the resolution-mode="require" declaration.
		pathToResolutionModeError: 'node_modules/stream-mime-type/dist/index.d.ts',
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
	const { entryPoint, outdir, pathToResolutionModeError } = option;
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

		// remove resolution-mode="require" from file because it provokes an error in the commonjs build
		if (pathToResolutionModeError) {
			exec(`sed -i -- 's/resolution-mode="require"//g' ${pathToResolutionModeError} `);
		}
	} catch (e) {
		process.exit(1);
	}
}
