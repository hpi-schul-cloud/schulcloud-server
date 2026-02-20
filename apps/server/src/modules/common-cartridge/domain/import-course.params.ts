import { EntityId } from '@shared/domain/types';

export interface ImportCourseParams {
	fileRecordId: EntityId;
	fileName: string;
	fileUrl: string;
}
