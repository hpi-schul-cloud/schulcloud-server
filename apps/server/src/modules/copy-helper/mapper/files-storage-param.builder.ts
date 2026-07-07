import { FileRecordParentType, type FileRequestInfo, StorageLocation } from '@infra/files-storage-amqp-client';
import { LessonEntity } from '@modules/lesson/repo';
import { Submission, Task } from '@modules/task/repo';
import { type EntityId } from '@shared/domain/types';
import { type EntitiesWithFiles } from '../types';

export class FileParamBuilder {
	static build(
		storageLocationId: EntityId,
		parent: EntitiesWithFiles,
		storageLocation: StorageLocation = StorageLocation.SCHOOL
	): FileRequestInfo {
		const parentType = FileParamBuilder.mapEntityToParentType(parent);
		const fileRequestInfo = {
			parentType,
			storageLocationId,
			storageLocation,
			parentId: parent.id,
		};

		return fileRequestInfo;
	}

	static mapEntityToParentType(entity: EntitiesWithFiles): FileRecordParentType {
		if (entity instanceof LessonEntity) return FileRecordParentType.Lesson;

		if (entity instanceof Task) return FileRecordParentType.Task;

		if (entity instanceof Submission) return FileRecordParentType.Submission;

		throw new Error(`Mapping type is not supported.`);
	}
}
