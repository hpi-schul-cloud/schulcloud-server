// This interface is based on the GitHub API response for repository tags
// See: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-tags

export interface GitHubTagCommit {
	sha: string;
	url: string;
}

export interface GitHubTag {
	name: string;
	node_id: string;
	commit: GitHubTagCommit;
	zipball_url: string;
	tarball_url: string;
}

export type GitHubTagResponse = GitHubTag[];
