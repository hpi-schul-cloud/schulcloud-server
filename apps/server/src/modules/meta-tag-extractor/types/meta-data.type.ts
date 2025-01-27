export enum MetaDataEntityType {
	UNKNOWN = 'unknown',
	EXTERNAL = 'external',
	COURSE = 'course',
	BOARD = 'board',
	BOARD_CARD = 'board-card',
	TASK = 'task',
	LESSON = 'lesson',
}

export type MetaData = {
	title: string;
	description: string;
	url: string;
	originalImageUrl?: string;
	type: MetaDataEntityType;
	parentTitle?: string;
	parentType?: MetaDataEntityType;
};
