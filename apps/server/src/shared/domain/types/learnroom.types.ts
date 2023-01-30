export enum LearnroomTypes {
	'Course' = 'course',
	'Lesson' = 'lesson',
}

export type BaseMetadata = {
	id: string;
	type: LearnroomTypes;
	title: string;
};

export type LearnroomMetadata = BaseMetadata & {
	shortTitle: string;
	displayColor: string;
	startDate?: Date;
	untilDate?: Date;
	copyingSince?: Date;
};
