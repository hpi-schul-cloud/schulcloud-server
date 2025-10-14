import arg from 'arg';
import { H5pLibraryUploaderService } from './service/h5p-library-uploader.service';

const args = arg(
	{
		'--help': Boolean,
		'-h': '--help',
		'--tmp': String,
		'-t': '--tmp',
	},
	{
		argv: process.argv.slice(2),
	}
);

if ('--help' in args) {
	console.log(`Usage: node upload-h5p-libraries.js [opts]
OPTIONS:
    --help (-h)		Show this help.
    --tmp (-t)		The temporary folder to use for building libraries.
`);
	process.exit(0);
}

interface Params {
	tmp?: string;
}

const params: Params = {
	tmp: args._[2] || args['--tmp'],
};

const main = async (): Promise<void> => {
	const tempFolderPath = params.tmp;
	const h5pLibraryUploaderService = new H5pLibraryUploaderService(tempFolderPath);
	await h5pLibraryUploaderService.uploadLibraries();
};

main();
