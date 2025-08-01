const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const fs = require('fs');

class H5pGitHubClient {
	constructor() {
		const personalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
		if (!personalAccessToken) {
			throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set');
		}

		this.octokit = new Octokit({
			auth: personalAccessToken,
		});
	}

	async fetchRepositoriesFromGitHubOrganization(organization) {
		const repos = [];
		let page = 1;
		const perPage = 100; // Maximum allowed by GitHub API

		while (true) {
			const response = await this.fetchRepositoriesOfOrganizationPagewise(organization, page, perPage);
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
	}

	async fetchRepositoriesOfOrganizationPagewise(organization, page = 1, perPage = 100) {
		let response;
		try {
			response = await this.octokit.repos.listForOrg({
				org: organization,
				type: 'public',
				per_page: perPage,
				page,
			});
		} catch (error) {
			console.error(`Error fetching repositories for organization ${organization} on page ${page}:`, error);
		}

		return response;
	}

	async buildLibraryRepoMapFromRepos(organization, repos) {
		const libraryRepoMap = {};

		for (const repo of repos) {
			const response = await this.getLibraryJsonFromRepo(organization, repo);
			if (!response) {
				continue;
			}

			const data = response.data;
			if (!this.checkContentOfLibraryJson(data)) {
				continue;
			}

			const libraryJsonContent = Buffer.from(data.content, 'base64').toString('utf-8');
			const libraryJson = JSON.parse(libraryJsonContent);

			if (libraryJson.machineName) {
				libraryRepoMap[libraryJson.machineName] = `${organization}/${repo.name}`;
			}
		}

		return libraryRepoMap;
	}

	async getLibraryJsonFromRepo(organization, repo) {
		let response;
		try {
			response = await this.octokit.repos.getContent({
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
	}

	checkContentOfLibraryJson(data) {
		if (!data || !data.content || typeof data.content !== 'string') {
			console.error('library.json content is missing or not a string.');

			return false;
		}

		return true;
	}

	async fetchGitHubTags(repoName) {
		let tags = [];

		try {
			const [owner, repo] = repoName.split('/');
			const response = await this.octokit.repos.listTags({
				owner,
				repo,
			});
			tags = response.data.map((tag) => tag.name);
		} catch (error) {
			console.error(`Unknown error while fetching tags for ${repoName}:`, error);
			tags = [];
		}

		return tags;
	}

	async downloadGitHubTag(library, tag, filePath) {
		const [owner, repo] = library.split('/');
		const url = `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}.zip`;

		try {
			const response = await axios({
				url,
				method: 'GET',
				responseType: 'stream',
			});

			// TODO: Move this to FileSystemHelper?
			const writer = fs.createWriteStream(filePath);
			response.data.pipe(writer);

			await new Promise((resolve, reject) => {
				writer.on('finish', () => resolve());
				writer.on('error', (err) => reject(err));
			});

			console.log(`Downloaded ${tag} of ${library} to ${filePath}`);
		} catch (error) {
			console.error(`Unknown error while downloading ${library} at tag ${tag}:`, error);
		}
	}
}

module.exports = H5pGitHubClient;
