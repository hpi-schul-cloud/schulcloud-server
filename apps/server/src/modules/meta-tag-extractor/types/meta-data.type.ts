export type MetaDataEntityType = 'external' | 'course' | 'board' | 'task' | 'lesson' | 'unknown';

export type MetaData = {
	title: string;
	description: string;
	url: string;
	originalImageUrl?: string;
	type: MetaDataEntityType;
	parentTitle?: string;
	parentType?: MetaDataEntityType;
};
