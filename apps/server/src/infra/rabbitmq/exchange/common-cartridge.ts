import { EntityId } from '@shared/domain/types';

export enum CommonCartridgeEvents {
	IMPORT_COURSE = 'import-course',
}

export interface ImportCourseParams {
	jwt: string;

	fileRecordId: EntityId;
	fileName: string;
	fileUrl: string;
}
