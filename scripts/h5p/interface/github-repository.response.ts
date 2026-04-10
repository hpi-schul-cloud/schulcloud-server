// This interface is based on the GitHub API response for repositories
// See: https://docs.github.com/en/rest/repos/repos#list-organization-repositories

export interface GitHubUser {
	name: string | null;
	email: string | null;
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string | null;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
	starred_at?: string;
	user_view_type?: string;
}

export interface GitHubRepoPermissions {
	admin: boolean;
	maintain: boolean;
	push: boolean;
	triage: boolean;
	pull: boolean;
}

export interface GitHubCodeOfConduct {
	key: string;
	name: string;
	url: string;
	body: string;
	html_url: string | null;
}

export interface GitHubLicense {
	key: string;
	name: string;
	spdx_id: string;
	url: string;
	node_id: string;
}

export interface GitHubSecurityAndAnalysis {
	advanced_security?: { status: 'enabled' | 'disabled' };
	code_security?: { status: 'enabled' | 'disabled' };
	dependabot_security_updates?: { status: 'enabled' | 'disabled' };
	secret_scanning?: { status: 'enabled' | 'disabled' };
	secret_scanning_push_protection?: { status: 'enabled' | 'disabled' };
	secret_scanning_non_provider_patterns?: { status: 'enabled' | 'disabled' };
	secret_scanning_ai_detection?: { status: 'enabled' | 'disabled' };
}

export interface GitHubRepository {
	id: number;
	node_id: string;
	name: string;
	full_name: string;
	owner: GitHubUser;
	private: boolean;
	html_url: string;
	description: string | null;
	fork: boolean;
	url: string;
	archive_url: string;
	assignees_url: string;
	blobs_url: string;
	branches_url: string;
	collaborators_url: string;
	comments_url: string;
	commits_url: string;
	compare_url: string;
	contents_url: string;
	contributors_url: string;
	deployments_url: string;
	downloads_url: string;
	events_url: string;
	forks_url: string;
	git_commits_url: string;
	git_refs_url: string;
	git_tags_url: string;
	git_url: string;
	issue_comment_url: string;
	issue_events_url: string;
	issues_url: string;
	keys_url: string;
	labels_url: string;
	languages_url: string;
	merges_url: string;
	milestones_url: string;
	notifications_url: string;
	pulls_url: string;
	releases_url: string;
	ssh_url: string;
	stargazers_url: string;
	statuses_url: string;
	subscribers_url: string;
	subscription_url: string;
	tags_url: string;
	teams_url: string;
	trees_url: string;
	clone_url: string;
	mirror_url: string | null;
	hooks_url: string;
	svn_url: string;
	homepage: string | null;
	language: string | null;
	forks_count: number;
	stargazers_count: number;
	watchers_count: number;
	size: number;
	default_branch: string;
	open_issues_count: number;
	is_template: boolean;
	topics: string[];
	has_issues: boolean;
	has_projects: boolean;
	has_wiki: boolean;
	has_pages: boolean;
	has_downloads: boolean;
	has_discussions: boolean;
	archived: boolean;
	disabled: boolean;
	visibility: string;
	pushed_at: string | null;
	created_at: string | null;
	updated_at: string | null;
	permissions?: GitHubRepoPermissions;
	role_name?: string;
	temp_clone_token?: string;
	delete_branch_on_merge?: boolean;
	subscribers_count?: number;
	network_count?: number;
	code_of_conduct?: GitHubCodeOfConduct;
	license?: GitHubLicense | null;
	forks: number;
	open_issues: number;
	watchers: number;
	allow_forking: boolean;
	web_commit_signoff_required: boolean;
	security_and_analysis?: GitHubSecurityAndAnalysis | null;
	custom_properties?: Record<string, any>;
}

export type GitHubRepositoryResponse = GitHubRepository[];
