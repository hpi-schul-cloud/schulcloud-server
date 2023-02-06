/* istanbul ignore file */
// Temporary functionality for migration to new fileservice

import { Lesson, Submission, Task } from '@shared/domain';
import { FileRecordParentType } from '@src/modules/files-storage/repo/filerecord.entity';

// TODO: Remove when BC-1496 is done!
export type SyncContext = {
	fileCounter: number;
};

export type AvailableSyncParentType =
	| FileRecordParentType.Task
	| FileRecordParentType.Lesson
	| FileRecordParentType.Submission;
export type AvailableSyncEntityType = Task | Lesson | Submission;
