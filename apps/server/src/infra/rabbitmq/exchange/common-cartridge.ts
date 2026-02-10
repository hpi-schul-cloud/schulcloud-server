import { EntityId } from '@shared/domain/types';

export enum CommonCartridgeEvents {
	IMPORT_COURSE = 'import-course',
}

export interface ImportCourseParams {
	fileRecordId: EntityId;
	fileName: string;
	fileUrl: string;
}
