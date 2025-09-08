const arg = require('arg');
const H5pLibraryUploaderService = require('./service/h5p-library-uploader.service.js');

const args = arg(
	{
		'--help': Boolean,
		'-h': '--help',
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
	console.log(`Usage: node upload-h5p-libraries.js [opts]
OPTIONS:
    --help (-h)		Show this help.
    --tmp (-t)		The temporary folder to use for building libraries.
`);
	process.exit(0);
}

const params = {
	tmp: args._[2] || args['--tmp'],
};

const main = async () => {
	const tempFolderPath = params.tmp;

	const h5pLibraryUploaderService = new H5pLibraryUploaderService(tempFolderPath);
	h5pLibraryUploaderService.uploadLibraries();
};

main();
