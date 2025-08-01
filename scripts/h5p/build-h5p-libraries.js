const { Octokit } = require('@octokit/rest');
const arg = require('arg');
const fs = require('fs');
const yaml = require('yaml');
const fileSystemHelper = require('./helper/file-system.helper.js');
const H5pLibraryBuilderService = require('./service/h5p-library-builder.service.js');

const args = arg(
	{
		'--help': Boolean,
		'-h': '--help',
	},
	{
		'--input': String,
		'-i': '--input',
	},
	{
		'--map': String,
		'-m': '--map',
	},
	{
		argv: process.argv.slice(2),
	}
);

if ('--help' in args) {
	console.log(`Usage: node generate-h5p-libraries.js [opts]
OPTIONS:
    --help (-h)		Show this help.
    --input (-i)	The file containing the list of libraries to be installed.
    --map (-m)		The file containing the library to repository map.
`);
	process.exit(0);
}

const params = {
	input: args._[0] || args['--input'],
	map: args._[1] || args['--map'],
};

const main = async () => {
	const mapFile = params.map || 'config/h5p-library-repo-map.yaml';
	const librariesFile = params.input || 'config/h5p-libraries.yaml';

	const libraryRepoMap = fileSystemHelper.readLibraryRepoMap(mapFile);
	const libraryWishList = fileSystemHelper.readLibraryWishList(librariesFile);

	const h5pLibraryBuilderService = new H5pLibraryBuilderService(libraryRepoMap);
	await h5pLibraryBuilderService.buildH5pLibrariesFromGitHubAsBulk(libraryWishList);
};

main();
