const { Octokit } = require('@octokit/rest');
const arg = require('arg');
const fs = require('fs');
const yaml = require('yaml');

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
	--target (-t)		Path to the output file where the machineNameToRepoMap will be saved.
`);
	process.exit(0);
}

const params = {
	organization: args._[0] || args['--organization'],
	target: args._[1] || args['--target'],
};

const octokit = new Octokit({
	// Replace with your GitHub personal access token
	// auth: 'GITHUB_PERSONAL_ACCESS_TOKEN',
});

const getMachineNameToRepoMapFromGitHubOrganization = async (organization) => {
	const repos = await fetchRepositoriesFromGitHubOrganization(organization);
	console.log(`Found ${repos.length} repositories in the ${organization} organization.`);

	const machineNameToRepoMap = await buildMachineNameToRepoMapFromRepos(organization, repos);
	console.log(`Built machineNameToRepoMap with ${Object.keys(machineNameToRepoMap).length} entries.`);

	return machineNameToRepoMap;
};

const fetchRepositoriesFromGitHubOrganization = async (organization) => {
	const repos = [];
	let page = 1;
	const perPage = 100; // Maximum allowed by GitHub API

	while (true) {
		const response = await fetchRepositoriesOfOrganizationPagewise(organization, page, perPage);
		if (!response) {
			repos = [];
			break;
		}

		response.data.forEach((repo) => repos.push(repo));
		if (response.data.length < perPage) {
			break;
		}

		page++;
	}

	return repos;
};

const fetchRepositoriesOfOrganizationPagewise = async (organization, page = 1, perPage = 100) => {
	let response;
	try {
		response = await octokit.repos.listForOrg({
			org: organization,
			type: 'public',
			per_page: perPage,
			page,
		});
	} catch (error) {
		console.error(`Error fetching repositories for organization ${organization} on page ${page}:`, error);
	}

	return response;
};

const buildMachineNameToRepoMapFromRepos = async (organization, repos) => {
	const machineNameToRepoMap = {};

	for (const repo of repos) {
		const response = await getLibraryJsonFromRepo(organization, repo);
		if (!response) {
			continue;
		}

		const data = response.data;
		if (!checkContentOfLibraryJson(data)) {
			continue;
		}

		const libraryJsonContent = Buffer.from(data.content, 'base64').toString('utf-8');
		const libraryJson = JSON.parse(libraryJsonContent);

		if (libraryJson.machineName) {
			machineNameToRepoMap[libraryJson.machineName] = `${organization}/${repo.name}`;
		}
	}

	return machineNameToRepoMap;
};

const getLibraryJsonFromRepo = async (organization, repo) => {
	let response;
	try {
		response = await octokit.repos.getContent({
			owner: organization,
			repo: repo.name,
			path: 'library.json',
		});
	} catch (error) {
		if (error && error.status === 404) {
			console.error(`library.json does not exist in repository ${repo.name}.`);
		} else {
			console.error(`Unknown error fetching library.json from repository ${repo.name}:`, error);
		}
	}

	return response;
};

const checkContentOfLibraryJson = (data) => {
	if (!data || !data.content || typeof data.content !== 'string') {
		console.error('library.json content is missing or not a string.');

		return false;
	}

	return true;
};

const writeMachineNameToRepoMapToYamlFile = (machineNameToRepoMap, target) => {
	const yamlContent = yaml.stringify(machineNameToRepoMap);
	fs.writeFileSync(target, yamlContent, { encoding: 'utf-8' });
	console.log(`Wrote machineNameToRepoMap to ${target}`);
};

const main = async () => {
	const organization = params.organization || 'h5p';
	const target = params.target || 'config/h5p-library-repo-map.yaml';

	const machineNameToRepoMap = await getMachineNameToRepoMapFromGitHubOrganization(organization);

	writeMachineNameToRepoMapToYamlFile(machineNameToRepoMap, target);
};

main();
