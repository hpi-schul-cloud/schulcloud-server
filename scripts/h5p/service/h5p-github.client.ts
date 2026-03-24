import axios, { AxiosResponse } from 'axios';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { GitHubContentTreeResponse } from '../interface/github-content-tree.response';
import { GitHubRepository, GitHubRepositoryResponse } from '../interface/github-repository.response';
import { GitHubTagResponse } from '../interface/github-tag.response';

export enum GitHubOwnerType {
	Organization = 'orgs',
	User = 'users',
}

export type GitHubOwner = {
	type: GitHubOwnerType;
	name: string;
};

export interface GitHubClientOptions {
	maxRetries: number;
}

export type LibraryRepoMap = Record<string, string>;

export class H5pGitHubClient {
	private token!: string;

	private libraryRepoMap: LibraryRepoMap = {};

	constructor(libraryRepoMap?: LibraryRepoMap) {
		this.initialize();
		if (libraryRepoMap) {
			this.libraryRepoMap = libraryRepoMap;
		}
	}

	public initialize(): void {
		const personalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
		if (!personalAccessToken) {
			throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set');
		}
		this.token = personalAccessToken;
	}

	public getLibraryRepoMapFromGitHub = async (owners: GitHubOwner[]): Promise<LibraryRepoMap> => {
		let libraryRepoMap: LibraryRepoMap = {};

		for (const owner of owners) {
			const repos = await this.fetchRepositories(owner.type, owner.name);
			const ownerType = owner.type === GitHubOwnerType.Organization ? 'organization' : 'user';
			console.log(`Found ${repos.length} repositories in the ${owner.name} ${ownerType}.`);
			const repoMap = await this.buildLibraryRepoMapFromRepos(owner.name, repos);
			console.log(`Built libraryRepoMap for ${owner.name} ${ownerType} with ${Object.keys(repoMap).length} entries.`);
			libraryRepoMap = { ...libraryRepoMap, ...repoMap };
		}
		console.log(`Built libraryRepoMap for all owners with ${Object.keys(libraryRepoMap).length} entries.`);

		this.libraryRepoMap = libraryRepoMap;

		return libraryRepoMap;
	};

	public async fetchRepositories(type: GitHubOwnerType, owner: string): Promise<GitHubRepositoryResponse> {
		let repos: GitHubRepositoryResponse = [];
		let page = 1;
		const perPage = 100; // Maximum allowed by GitHub API

		while (true) {
			const response = await this.fetchRepositoriesPagewise(type, owner, page, perPage);
			if (!response) {
				repos = [];
				break;
			}

			response.forEach((repo) => repos.push(repo));
			if (response.length < perPage) {
				break;
			}

			page++;
		}

		return repos;
	}

	private async fetchRepositoriesPagewise(
		type: GitHubOwnerType,
		owner: string,
		page: number = 1,
		perPage: number = 100
	): Promise<GitHubRepositoryResponse | undefined> {
		let result: GitHubRepositoryResponse | undefined;
		const url = `https://api.github.com/${type}/${owner}/repos?type=public&per_page=${perPage}&page=${page}`;
		try {
			const headers = this.getHeaders();
			const response: AxiosResponse<GitHubRepositoryResponse> = await axios.get(url, { headers });
			result = response.data;
		} catch (error) {
			console.error(`Error fetching repositories for ${owner} on page ${page}:`, error);
		}

		return result;
	}

	public async buildLibraryRepoMapFromRepos(
		owner: string,
		repos: GitHubRepositoryResponse
	): Promise<Record<string, string>> {
		const libraryRepoMap: Record<string, string> = {};

		for (const repo of repos) {
			const response = await this.getLibraryJsonFromRepo(owner, repo);
			if (!response) {
				continue;
			}

			const data = response.data;
			if (!this.checkContentOfLibraryJson(data) || data.content === undefined) {
				continue;
			}

			const libraryJsonContent = Buffer.from(data.content, 'base64').toString('utf-8');
			const libraryJson = JSON.parse(libraryJsonContent);

			if (libraryJson.machineName) {
				if (libraryRepoMap[libraryJson.machineName]) {
					console.error(
						`Duplicate machineName "${libraryJson.machineName}" found in repository ${repo.name}. Skipping this entry.`
					);
					continue;
				}
				libraryRepoMap[libraryJson.machineName] = `${owner}/${repo.name}`;
			}
		}

		return libraryRepoMap;
	}

	private async getLibraryJsonFromRepo(
		owner: string,
		repo: GitHubRepository
	): Promise<AxiosResponse<GitHubContentTreeResponse> | undefined> {
		let result: AxiosResponse<GitHubContentTreeResponse> | undefined;
		const url = `https://api.github.com/repos/${owner}/${repo.name}/contents/library.json`;
		try {
			const headers = this.getHeaders();
			result = await axios.get(url, { headers });
		} catch (error: unknown) {
			if (this.isObjectWithResponseStatus(error) && error.response.status === 404) {
				console.error(`library.json does not exist in repository ${repo.name}.`);
			} else {
				console.error(`Unknown error fetching library.json from repository ${repo.name}:`, error);
			}
			result = undefined;
		}

		return result;
	}

	private isObjectWithResponseStatus(obj: unknown): obj is { response: { status: number } } {
		return (
			typeof obj === 'object' &&
			obj !== null &&
			'response' in obj &&
			typeof (obj as any).response === 'object' &&
			'status' in (obj as any).response &&
			typeof (obj as any).response.status === 'number'
		);
	}

	private checkContentOfLibraryJson(data: GitHubContentTreeResponse): boolean {
		if (!data || !data.content || typeof data.content !== 'string') {
			console.error('library.json content is missing or not a string.');

			return false;
		}

		return true;
	}

	public async fetchAllTags(repoName: string, options: GitHubClientOptions = { maxRetries: 3 }): Promise<string[]> {
		const [owner, repo] = repoName.split('/');
		const perPage = 100;
		let page = 1;
		let allTags: string[] = [];
		let hasMore: boolean;

		do {
			const url = this.buildTagsUrl(owner, repo, page, perPage);

			let response: AxiosResponse<GitHubTagResponse>;
			try {
				response = await this.fetch(url, options);
			} catch (error) {
				console.error(`Failed to fetch tags for ${owner}/${repo}.`, error);
				return [];
			}

			const pageTags = this.extractTagNames(response);
			allTags = allTags.concat(pageTags);
			hasMore = response.data.length === perPage;
			page++;
		} while (hasMore);

		return allTags;
	}

	private buildTagsUrl(owner: string, repo: string, page: number, perPage: number): string {
		return `https://api.github.com/repos/${owner}/${repo}/tags?per_page=${perPage}&page=${page}`;
	}

	private extractTagNames(response: AxiosResponse<GitHubTagResponse>): string[] {
		return Array.isArray(response.data) ? response.data.map((tag) => tag.name) : [];
	}

	public async downloadTag(library: string, tag: string, filePath: string): Promise<void> {
		const [owner, repo] = library.split('/');
		const url = `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}.zip`;

		try {
			const response = await this.fetchContent(url);

			// TODO: Move this to FileSystemHelper?
			const writer = createWriteStream(filePath);
			response.data.pipe(writer);

			await new Promise<void>((resolve, reject) => {
				writer.on('finish', () => resolve());
				writer.on('error', (err) => reject(err));
			});

			console.log(`Downloaded ${tag} of ${library} to ${filePath}`);
		} catch (error) {
			console.error(`Unknown error while downloading ${library} at tag ${tag}:`, error);
		}
	}

	private async fetch(url: string, options: GitHubClientOptions): Promise<AxiosResponse<GitHubTagResponse>> {
		let attempt = 0;
		let response: AxiosResponse<GitHubTagResponse> | undefined;
		const headers = this.getHeaders();

		while (attempt < options.maxRetries) {
			try {
				response = await axios.get(url, { headers });
				break;
			} catch (error) {
				attempt++;
				console.error(`Error getting data from ${url} (Attempt ${attempt}/${options.maxRetries}):`, error);
				if (attempt === options.maxRetries) {
					throw new Error(`Failed to get data from ${url} after ${options.maxRetries} attempts.`);
				}
				await this.delay(1000);
			}
		}

		if (!response || response.status < 200 || response.status >= 300) {
			throw new Error(`GitHub API request failed${response ? ` with status ${response.status}` : ''}`);
		}

		return response;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async fetchContent(url: string): Promise<AxiosResponse<Readable>> {
		const response: AxiosResponse<Readable> = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
		});

		if (response.status < 200 || response.status >= 300) {
			throw new Error(`GitHub content request failed with status ${response.status}`);
		}

		return response;
	}

	private getHeaders(): Record<string, string> {
		const headers: Record<string, string> = this.token ? { Authorization: `token ${this.token}` } : {};
		return headers;
	}

	public mapMachineNameToGitHubRepo(library: string): string | undefined {
		const repo = this.libraryRepoMap[library];
		return repo;
	}
}
