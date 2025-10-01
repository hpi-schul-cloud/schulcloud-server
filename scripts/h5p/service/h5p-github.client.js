const axios = require('axios');
const fs = require('fs');

class H5pGitHubClient {
	constructor() {
		const personalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
		if (!personalAccessToken) {
			throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set');
		}

		this.token = personalAccessToken;
	}

	async fetchRepositoriesFromOrganization(organization) {
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
		let result;
		const url = `https://api.github.com/orgs/${organization}/repos?type=public&per_page=${perPage}&page=${page}`;
		try {
			const headers = this.getHeaders();
			const response = await axios.get(url, { headers });
			result = { data: response.data };
		} catch (error) {
			console.error(`Error fetching repositories for organization ${organization} on page ${page}:`, error);
		}

		return result;
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
		let result;
		const url = `https://api.github.com/repos/${organization}/${repo.name}/contents/library.json`;
		try {
			const headers = this.getHeaders();
			result = await axios.get(url, { headers });
		} catch (error) {
			if (error && error.response && error.response.status === 404) {
				console.error(`library.json does not exist in repository ${repo.name}.`);
			} else {
				console.error(`Unknown error fetching library.json from repository ${repo.name}:`, error);
			}
			result = undefined;
		}

		return result;
	}

	checkContentOfLibraryJson(data) {
		if (!data || !data.content || typeof data.content !== 'string') {
			console.error('library.json content is missing or not a string.');

			return false;
		}

		return true;
	}

	async fetchTags(repoName, maxRetries = 3) {
		const [owner, repo] = repoName.split('/');
		const perPage = 100;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const tags = await this.getAllTags(owner, repo, perPage);
				return tags;
			} catch (error) {
				console.error(`Error fetching tags for ${repoName} (Attempt ${attempt}/${maxRetries}):`, error);
				if (attempt < maxRetries) {
					await this.delay(1000);
				} else {
					console.error(`Failed to fetch tags for ${repoName} after ${maxRetries} attempts.`);
					return [];
				}
			}
		}
	}

	async getAllTags(owner, repo, perPage) {
		let page = 1;
		let allTags = [];
		let hasMore;

		do {
			const url = `https://api.github.com/repos/${owner}/${repo}/tags?per_page=${perPage}&page=${page}`;
			const response = await this.fetch(url);
			const pageTags = response.data.map((tag) => tag.name);
			allTags = allTags.concat(pageTags);
			hasMore = response.data.length === perPage;
			page++;
		} while (hasMore);

		return allTags;
	}

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async downloadTag(library, tag, filePath) {
		const [owner, repo] = library.split('/');
		const url = `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}.zip`;

		try {
			const response = await this.fetchContent(url);

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

	async fetch(url) {
		const headers = this.getHeaders();
		const response = await axios.get(url, { headers });

		// throw if not 2xx response
		if (response.status < 200 || response.status >= 300) {
			throw new Error(`GitHub API request failed with status ${response.status}`);
		}

		return response;
	}

	async fetchContent(url) {
		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
		});

		// throw if not 2xx response
		if (response.status < 200 || response.status >= 300) {
			throw new Error(`GitHub content request failed with status ${response.status}`);
		}

		return response;
	}

	getHeaders() {
		const headers = this.token ? { Authorization: `token ${this.token}` } : {};

		return headers;
	}
}

module.exports = H5pGitHubClient;
