import arg from 'arg';
import { FileSystemHelper } from './helper/file-system.helper';
import { H5pLibraryPackagerService } from './service/h5p-library-packager.service';

const args = arg(
	{
		'--help': Boolean,
		'-h': '--help',
		'--map': String,
		'-m': '--map',
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
    --map (-m)		The file containing the library to repository map.
    --tmp (-t)		The temporary folder to use for building libraries.
`);
	process.exit(0);
}

interface Params {
	input?: string;
	map?: string;
	tmp?: string;
}

const params: Params = {
	map: args._[0] || args['--map'],
	tmp: args._[1] || args['--tmp'],
};

const main = async (): Promise<void> => {
	const mapFile = params.map || 'scripts/h5p/config/h5p-library-repo-map.yaml';
	const tempFolderPath = params.tmp;

	const libraryRepoMap = FileSystemHelper.readLibraryRepoMap(mapFile);
	const libraryWishList = process.env.H5P_EDITOR__LIBRARY_LIST ? process.env.H5P_EDITOR__LIBRARY_LIST.split(',') : [];
	if (!libraryWishList || libraryWishList.length === 0) {
		throw new Error('H5P_EDITOR__LIBRARY_LIST environment variable is not set or empty');
	}

	const h5pLibraryPackagerService = new H5pLibraryPackagerService(libraryRepoMap, tempFolderPath);
	await h5pLibraryPackagerService.buildH5pLibrariesFromGitHubAsBulk(libraryWishList);
};

main();
