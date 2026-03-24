import arg from 'arg';
import { FileSystemHelper } from './helper/file-system.helper';
import { h5pLogger } from './helper/h5p-logger.helper';
import { GitHubOwner, GitHubOwnerType, H5pGitHubClient } from './service/h5p-github.client';

const args = arg(
	{
		'--help': Boolean,
		'-h': '--help',
		'--organizations': String,
		'-o': '--organizations',
		'--users': String,
		'-u': '--users',
		'--target': String,
		'-t': '--target',
	},
	{
		argv: process.argv.slice(2),
	}
);

if ('--help' in args) {
	console.info(`Usage: node update-h5p-map.js [opts]
OPTIONS:
	--help (-h)				Show this help.
	--organizations (-o)	Organization name(s) on GitHub. Can be comma-separated for multiple organizations.
	--users (-u)			User name(s) on GitHub. Can be comma-separated for multiple users.
	--target (-t)			Path to the output file where the libraryRepoMap will be saved.
`);
	process.exit(0);
}

interface Params {
	organizations: string[];
	users: string[];
	target?: string;
}

const parseCommaSeparated = (value: string | undefined): string[] => {
	if (!value) {
		return [];
	}
	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
};

const params: Params = {
	organizations: parseCommaSeparated(args._[0] || args['--organizations']),
	users: parseCommaSeparated(args._[1] || args['--users']),
	target: args._[2] || args['--target'],
};

const main = async (): Promise<void> => {
	const organizations = params.organizations.length > 0 ? params.organizations : ['h5p'];
	const users = params.users.length > 0 ? params.users : ['ActiveLearningStudio', 'jithin-space', 'otacke'];
	const target = params.target || 'scripts/h5p/config/h5p-library-repo-map.yaml';

	const gitHubClient = new H5pGitHubClient();

	// Here the order is very important as the last organization/user will override the previous
	// ones in case of duplicate library names. By default it is preferred to have the 'h5p'
	// organization last as it contains the official libraries, which should override any forks
	// or user repositories.
	const hasH5pOrg = organizations.includes('h5p');
	const otherOrganizations = organizations.filter((org) => org !== 'h5p');

	const owners: GitHubOwner[] = [
		...users.map((user) => ({ type: GitHubOwnerType.User, name: user })),
		...otherOrganizations.map((org) => ({ type: GitHubOwnerType.Organization, name: org })),
		...(hasH5pOrg ? [{ type: GitHubOwnerType.Organization, name: 'h5p' }] : []),
	];

	const libraryRepoMap = await gitHubClient.getLibraryRepoMapFromGitHub(owners);

	FileSystemHelper.writeLibraryRepoMap(target, libraryRepoMap);
	h5pLogger.success(`Wrote library repo map to ${target}`);
};

main();
