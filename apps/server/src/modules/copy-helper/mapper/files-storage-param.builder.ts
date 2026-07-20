import { FileRecordParentType, type FileRequestInfo, StorageLocation } from '@infra/files-storage-amqp-client';
import { LessonEntity } from '@modules/lesson/repo/lesson.entity';
import { Submission } from '@modules/task/repo/submission.entity';
import { Task } from '@modules/task/repo/task.entity';
import { type EntityId } from '@shared/domain/types';
import { type EntitiesWithFiles } from '../types';

export class FileParamBuilder {
	public static build(
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

	public static mapEntityToParentType(entity: EntitiesWithFiles): FileRecordParentType {
		if (entity instanceof LessonEntity) return FileRecordParentType.Lesson;

		if (entity instanceof Task) return FileRecordParentType.Task;

		if (entity instanceof Submission) return FileRecordParentType.Submission;

		throw new Error(`Mapping type is not supported.`);
	}
}
