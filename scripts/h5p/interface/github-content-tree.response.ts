// This interface is based on the GitHub API response for repository content
// https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content

export interface GitHubContentTreeLinks {
	git: string | null;
	html: string | null;
	self: string;
}

export interface GitHubContentTreeEntry {
	type: string;
	size: number;
	name: string;
	path: string;
	sha: string;
	url: string;
	git_url: string | null;
	html_url: string | null;
	download_url: string | null;
	_links: GitHubContentTreeLinks;
}

export interface GitHubContentTreeResponse {
	type: string;
	size: number;
	name: string;
	path: string;
	sha: string;
	content?: string;
	url: string;
	git_url: string | null;
	html_url: string | null;
	download_url: string | null;
	entries?: GitHubContentTreeEntry[];
	encoding?: string;
	_links: GitHubContentTreeLinks;
}
