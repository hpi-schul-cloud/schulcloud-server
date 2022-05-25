/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { FileRecord, FileRecordParentType } from '@shared/domain';
import { Logger } from '@src/core/logger';
import { Command, Console } from 'nestjs-console';
import { FileFilerecord } from './sync-filerecords-utils/file_filerecord.entity';
import { SyncTaskRepo } from './sync-filerecords-utils/sync-task.repo';

@Console({ command: 'sync-filerecords' })
export class SyncFilerecordsConsole {
	constructor(private syncTaskRepo: SyncTaskRepo, private em: EntityManager, private logger: Logger) {}

	@Command({ command: 'tasks [batchSize]' })
	async syncFilerecordsForTasks(batchSize = 50) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const tasksToSync: TaskToSync[] = await this.syncTaskRepo.getTasksToSync(Number(batchSize));

		await this.syncMetaData(tasksToSync);
	}

	private async syncMetaData(tasks: TaskToSync[]) {
		const promises = tasks.map((task) => {
			if (task.filerecord) {
				return this.updateFilerecordForTask(task);
			}

			return this.createFilerecordForTask(task);
		});

		if (await Promise.all(promises)) {
			await this.em.flush();
		}
	}

	public async updateFilerecordForTask(task: TaskToSync) {
		const { file } = task;
		const filerecord = await this.em.findOneOrFail(FileRecord, task.filerecord?._id);
		// TODO: Does deletedSince information exist on file? Same for creation below.
		// filerecord.deletedSince = file.
		filerecord.name = file.name;
		filerecord.size = file.size;
		filerecord.mimeType = file.type;
		filerecord.securityCheck = file.securityCheck;
		filerecord._creatorId = file.creator?._id;
		filerecord._lockedForUserId = file.lockId;
		filerecord.createdAt = file.createdAt;
		filerecord.updatedAt = file.updatedAt;
	}

	private createFilerecordForTask(task: TaskToSync) {
		const { file } = task;
		const filerecord = new FileRecord({
			size: file.size,
			name: file.name,
			mimeType: file.type,
			parentType: FileRecordParentType.Task,
			parentId: task._id,
			creatorId: file.creator?._id,
			schoolId: task.schoolId,
		});
		filerecord._id = new ObjectId();
		filerecord.securityCheck = file.securityCheck;
		filerecord._lockedForUserId = file.lockId;
		filerecord.createdAt = file.createdAt;
		filerecord.updatedAt = file.updatedAt;
		this.em.persist(filerecord);
		const fileFilerecord = new FileFilerecord({ fileId: file._id, filerecordId: filerecord._id });
		this.em.persist(fileFilerecord);
	}
}

export class TaskToSync {
	constructor(public _id: ObjectId, public schoolId: ObjectId, public file: any, public filerecord?: FileRecord) {}
}
