/* eslint-disable import/no-extraneous-dependencies */
const { dtsPlugin } = require('esbuild-plugin-d.ts');
const { build } = require('esbuild');
const fs = require('fs');
const { resolve } = require('path');
// add files to be transformed from CommonJs to EsModules in the following list
const options = [
	{
		name: 'keycloak-admin-client-lib',
		entryPoint: ['esbuild/content/keycloak-admin-client-cjs-index.ts'],
		outdir: 'node_modules/@keycloak/keycloak-admin-client-cjs',
	},
	{
		name: 'file-type-lib',
		entryPoint: ['esbuild/content/file-type-cjs-index.ts'],
		outdir: 'node_modules/file-type-cjs',
	},
	{
		// Path to file containing the resolution-mode="require" declaration.
		pathToResolutionModeError: 'node_modules/peek-readable/lib/StreamReader.d.ts',
	},
	{
		pathToResolutionModeError: 'node_modules/strtok3/lib/ReadStreamTokenizer.d.ts',
	},
	{
		pathToResolutionModeError: 'node_modules/strtok3/lib/core.d.ts',
	},
	{
		pathToResolutionModeError: 'node_modules/strtok3/lib/index.d.ts',
	},
	{
		pathToResolutionModeError: 'node_modules/strtok3/lib/types.d.ts',
	},
	{
		noExportedMember: 'node_modules/@feathersjs/express/lib/declarations.d.ts',
	},
];

const globalOptions = {
	platform: 'node',
	format: 'cjs',
	bundle: true,
	minify: true,
	loader: { '.js': 'jsx' },
};

function replace(type, filePath) {
	const file = resolve(__dirname, '..', filePath);
	fs.readFile(file, 'utf8', (err, data) => {
		if (err) throw err;
		let result = data;
		if (type === 'pathToResolutionModeError') {
			result = data.replace(/resolution-mode="require"/g, '');
		} else if (type === 'noExportedMember') {
			result = `// @ts-nocheck\n\n${data}`;
		}

		fs.writeFile(file, result, 'utf8', (err) => {
			if (err) throw err;
		});
	});
}

for (const option of options) {
	const { entryPoint, outdir, pathToResolutionModeError, noExportedMember } = option;
	try {
		if (entryPoint && outdir) {
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
		}

		// remove resolution-mode="require" from file because it provokes an error in the commonjs build
		if (pathToResolutionModeError) {
			replace('pathToResolutionModeError', pathToResolutionModeError);
		}
		if (noExportedMember) {
			replace('noExportedMember', noExportedMember);
		}
	} catch (e) {
		process.exit(1);
	}
}
