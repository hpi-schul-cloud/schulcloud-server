import { GroupEntity } from '@modules/group/entity';

export enum LearnroomTypes {
	'Course' = 'course',
}

export type LearnroomMetadata = {
	id: string;
	type: LearnroomTypes;
	title: string;
	shortTitle: string;
	displayColor: string;
	startDate?: Date;
	untilDate?: Date;
	copyingSince?: Date;
	isSynchronized: boolean;
	syncedWithGroup?: GroupEntity;
};
