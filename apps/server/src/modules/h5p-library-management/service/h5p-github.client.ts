import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { components } from '@octokit/openapi-types';
import { Octokit } from '@octokit/rest';
import axios, { AxiosResponse } from 'axios';
import { createWriteStream } from 'fs';
import { FileSystemHelper } from '../helper';
import { H5PLibraryManagementErrorLoggable, H5PLibraryManagementLoggable } from '../loggable';

@Injectable()
export class H5pGitHubClient {
	constructor(private readonly logger: Logger) {
		this.logger.setContext(H5pGitHubClient.name);
	}

	public mapMachineNamesToGitHubRepos(libraries: string[]): string[] {
		const libraryRepoMap = FileSystemHelper.readYamlFile('config/h5p-library-repo-map.yaml');

		const repos: string[] = [];
		for (const library of libraries) {
			if (libraryRepoMap[library]) {
				repos.push(libraryRepoMap[library]);
			}
		}

		return repos;
	}

	public mapMachineNameToGitHubRepo(library: string): string {
		const repo = this.mapMachineNamesToGitHubRepos([library])[0];

		return repo;
	}

	public async getMachineNameToRepoMapFromGitHub(): Promise<Record<string, string>> {
		const octokit = new Octokit({
			// Replace with your GitHub personal access token
			// auth: 'GITHUB_PERSONAL_ACCESS_TOKEN',
		});
		const organization = 'h5p';
		const machineNameToRepoMap: Record<string, string> = {};

		try {
			// Fetch all repositories in the H5P organization with pagination
			const repos: components['schemas']['repository'][] = [];
			let page = 1;
			const perPage = 100; // Maximum allowed by GitHub API

			while (true) {
				const response = await octokit.repos.listForOrg({
					org: organization,
					type: 'public',
					per_page: perPage,
					page,
				});

				response.data.forEach((repo) => repos.push(repo as components['schemas']['repository']));

				if (response.data.length < perPage) {
					break;
				}

				page++;
			}

			this.logger.info(
				new H5PLibraryManagementLoggable(`Found ${repos.length} repositories in the ${organization} organization.`)
			);

			for (const repo of repos) {
				try {
					const response = await octokit.repos.getContent({
						owner: organization,
						repo: repo.name,
						path: 'library.json',
					});

					type GitHubContentResponse = { content: string };
					const data = response.data as GitHubContentResponse;
					if (!data || typeof data.content !== 'string') {
						throw new Error('library.json content is missing or not a string');
					}
					const libraryJsonContent = Buffer.from(data.content, 'base64').toString('utf-8');
					const libraryJson = JSON.parse(libraryJsonContent) as { machineName?: string };

					if (libraryJson.machineName) {
						machineNameToRepoMap[libraryJson.machineName] = `${organization}/${repo.name}`;
					}
				} catch (error) {
					throw error instanceof Error
						? error
						: new Error(`Unknown error while processing library.json of repository ${repo.name}`);
				}
			}
		} catch (error) {
			throw error instanceof Error
				? error
				: new Error(`Unknown error while fetching repositories for organization ${organization}`);
		}

		return machineNameToRepoMap;
	}

	public async fetchGitHubTags(repoName: string): Promise<string[]> {
		const octokit = new Octokit({
			// Replace with your GitHub personal access token
			// auth: 'GITHUB_PERSONAL_ACCESS_TOKEN',
		});
		let tags: string[] = [];

		try {
			const [owner, repo] = repoName.split('/');
			const response = await octokit.repos.listTags({
				owner,
				repo,
			});
			tags = response.data.map((tag: components['schemas']['tag']) => tag.name);
		} catch (error: unknown) {
			const loggableError =
				error instanceof Error
					? new H5PLibraryManagementErrorLoggable(repoName, error)
					: new H5PLibraryManagementErrorLoggable(repoName, new Error('Unknown error during fetching tags'));
			this.logger.warning(loggableError);
			tags = [];
		}

		return tags;
	}

	public async downloadGitHubTag(library: string, tag: string, filePath: string): Promise<void> {
		const [owner, repo] = library.split('/');
		const url = `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}.zip`;

		try {
			const response: AxiosResponse<ReadableStream> = await axios({
				url,
				method: 'GET',
				responseType: 'stream',
			});

			const writer = createWriteStream(filePath);
			(response.data as unknown as NodeJS.ReadableStream).pipe(writer);

			await new Promise<void>((resolve, reject) => {
				writer.on('finish', () => resolve());
				writer.on('error', (err) => reject(err));
			});

			this.logger.info(new H5PLibraryManagementLoggable(`Downloaded ${tag} of ${library} to ${filePath}`));
		} catch (error: unknown) {
			const loggableError =
				error instanceof Error
					? new H5PLibraryManagementErrorLoggable(library, error)
					: new H5PLibraryManagementErrorLoggable(library, new Error('Unknown error during download'));
			this.logger.warning(loggableError);
		}
	}
}
