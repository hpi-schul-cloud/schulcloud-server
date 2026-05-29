import { EntityId } from '@shared/domain/types';

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
