import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { File, FileRecord, FileRecordParentType } from '@shared/domain';
import { FileFilerecord } from '@shared/domain/entity/file_filerecord.entity';
import { TaskRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';

@Console({ command: 'sync-filerecords' })
export class SyncFilerecordsConsole {
	constructor(private taskRepo: TaskRepo, private em: EntityManager, private logger: Logger) {}

	@Command({ command: 'tasks [batchSize]' })
	async syncFilerecordsForTasks(batchSize = 50) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const tasksToSync: TaskToSync[] = await this.taskRepo.getTasksToSync(Number(batchSize));

		tasksToSync.forEach((task) => {
			if (task.filerecord) {
				this.updateFilerecordForTask(task);
			} else {
				const filerecord = this.createFilerecordForTask(task);
				this.createFileFilerecord(task.file._id, filerecord._id);
			}
		});

		await this.em.flush();
	}

	public updateFilerecordForTask(task: TaskToSync) {
		const { filerecord } = task;
		if (filerecord) {
			filerecord.updatedAt = task.file.updatedAt;
			this.em.persist(filerecord);
		}
	}

	private createFilerecordForTask(task: TaskToSync) {
		const { file } = task;
		const filerecord = new FileRecord({
			size: file.size || 0,
			name: file.storageFileName,
			mimeType: file.type || '',
			parentType: FileRecordParentType.Task,
			parentId: task._id,
			// TODO: What shall happen when file.creator is undefined?
			creatorId: file.creator?._id || new ObjectId(),
			schoolId: task.schoolId,
		});
		this.em.persist(filerecord);
		return filerecord;
	}

	private createFileFilerecord(fileId: ObjectId, filerecordId: ObjectId) {
		const fileFilerecord = new FileFilerecord({ fileId, filerecordId });
		this.em.persist(fileFilerecord);
	}
}

export class TaskToSync {
	constructor(public _id: ObjectId, public schoolId: ObjectId, public file: File, public filerecord?: FileRecord) {}
}
