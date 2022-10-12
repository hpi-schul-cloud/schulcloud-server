import { EntityId, FileRecord } from '@shared/domain';
import { ErrorType } from '../../error';

export function createPath(schoolId: EntityId, fileRecordId: EntityId): string {
	if (!schoolId || !fileRecordId) {
		throw new Error(ErrorType.COULD_NOT_CREATE_PATH);
	}

	return [schoolId, fileRecordId].join('/');
}

export function getPaths(fileRecords: FileRecord[]): string[] {
	const paths = fileRecords.map((fileRecord) => createPath(fileRecord.schoolId, fileRecord.id));

	return paths;
}
