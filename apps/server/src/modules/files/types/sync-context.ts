/* istanbul ignore file */
// Temporary functionality for migration to new fileservice

import { FileRecordParentType, Lesson, Task } from '@shared/domain';

// TODO: Remove when BC-1496 is done!
export type SyncContext = {
	fileCounter: number;
};

export type AvailableSyncParentType = FileRecordParentType.Task | FileRecordParentType.Lesson;
export type AvailableSyncEntityType = Task | Lesson;
