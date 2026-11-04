import { type EntityId } from '@shared/domain/types';

export interface Release {
	id: EntityId;
	name: string;
	body: string;
	url: string;
	author: string;
	authorUrl: string;
	createdAt: Date;
	publishedAt: Date;
	zipUrl?: string;
}

export interface GithubRelease {
	id: number;
	name: string;
	body?: string;
	html_url: string;
	author: { login: string; html_url: string };
	created_at: string;
	published_at: string;
	zipball_url?: string;
}
