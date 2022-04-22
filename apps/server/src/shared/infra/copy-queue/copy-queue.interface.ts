export interface CopyQueueServiceOptions {
	exchange: string;
}

export enum CopyQueueRoutingKeys {
	COURSE = 'course',
	LESSON = 'lesson',
}
