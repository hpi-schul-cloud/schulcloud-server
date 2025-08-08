const arg = require('arg');
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
		'--tmp': String,
		'-t': '--tmp',
	},
	{
		argv: process.argv.slice(2),
	}
);

if ('--help' in args) {
	console.log(`Usage: node build-h5p-libraries.js [opts]
OPTIONS:
    --help (-h)		Show this help.
    --input (-i)	The file containing the list of libraries to be installed.
    --map (-m)		The file containing the library to repository map.
	--tmp (-t)		The temporary folder to use for building libraries.
`);
	process.exit(0);
}

const params = {
	input: args._[0] || args['--input'],
	map: args._[1] || args['--map'],
	tmp: args._[2] || args['--tmp'],
};

const main = async () => {
	const mapFile = params.map || 'config/h5p-library-repo-map.yaml';
	const librariesFile = params.input || 'config/h5p-libraries.yaml';
	const tempFolderPath = params.tmp;

	const libraryRepoMap = fileSystemHelper.readLibraryRepoMap(mapFile);
	const libraryWishList = fileSystemHelper.readLibraryWishList(librariesFile);

	const h5pLibraryBuilderService = new H5pLibraryBuilderService(libraryRepoMap, tempFolderPath);
	await h5pLibraryBuilderService.buildH5pLibrariesFromGitHubAsBulk(libraryWishList);
};

main();
