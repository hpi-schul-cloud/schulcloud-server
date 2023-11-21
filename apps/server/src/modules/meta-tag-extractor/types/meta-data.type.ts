import { ImageObject } from 'open-graph-scraper/dist/lib/types';

export type MetaDataEntityType = 'external' | 'course' | 'board' | 'task' | 'lesson' | 'unknown';

export type MetaData = {
	title: string;
	description: string;
	url: string;
	image?: ImageObject;
	type: MetaDataEntityType;
	parentTitle?: string;
	parentType?: MetaDataEntityType;
};
