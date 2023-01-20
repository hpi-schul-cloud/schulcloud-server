export enum LearnroomTypes {
	'Course' = 'course',
	'Lesson' = 'lesson',
}

export type LearnroomMetadata = {
	id: string;
	type: LearnroomTypes;
	title: string;
	shortTitle: string;
	displayColor: string;
	startDate?: Date;
	untilDate?: Date;
};
