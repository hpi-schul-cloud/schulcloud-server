import arg from 'arg';
import { FileSystemHelper } from './helper/file-system.helper';
import { H5pGitHubClient } from './service/h5p-github.client';

const args = arg(
	{
		'--help': Boolean,
		'-h': '--help',
		'--organization': String,
		'-o': '--organization',
		'--target': String,
		'-t': '--target',
	},
	{
		argv: process.argv.slice(2),
	}
);

if ('--help' in args) {
	console.log(`Usage: node update-h5p-map.js [opts]
OPTIONS:
	--help (-h)		Show this help.
	--organization (-o)	Organization name on GitHub.
	--target (-t)		Path to the output file where the libraryRepoMap will be saved.
`);
	process.exit(0);
}

interface Params {
	organization?: string;
	target?: string;
}

const params: Params = {
	organization: args._[0] || args['--organization'],
	target: args._[1] || args['--target'],
};

const getLibraryRepoMapFromGitHubOrganization = async (organization: string): Promise<Record<string, string>> => {
	const gitHubClient = new H5pGitHubClient();
	const repos = await gitHubClient.fetchRepositoriesFromOrganization(organization);
	console.log(`Found ${repos.length} repositories in the ${organization} organization.`);
	const libraryRepoMap = await gitHubClient.buildLibraryRepoMapFromRepos(organization, repos);
	console.log(`Built libraryRepoMap with ${Object.keys(libraryRepoMap).length} entries.`);
	return libraryRepoMap;
};

const main = async (): Promise<void> => {
	const organization = params.organization || 'h5p';
	const target = params.target || 'scripts/h5p/config/h5p-library-repo-map.yaml';

	const libraryRepoMap = await getLibraryRepoMapFromGitHubOrganization(organization);

	FileSystemHelper.writeLibraryRepoMap(target, libraryRepoMap);
	console.log(`Wrote library repo map to ${target}`);
};

main();
