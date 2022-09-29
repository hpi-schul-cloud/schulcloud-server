import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Counted, EntityId, FileRecord } from '@shared/domain';
import { FileRecordRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../client/s3-client.adapter';
import { FileRecordParams } from '../controller/dto';

@Injectable()
export class FilesStorageService {
	constructor(
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly storageClient: S3ClientAdapter,
		private logger: Logger
	) {
		this.logger.setContext(FilesStorageService.name);
	}

	private createPath(schoolId: EntityId, fileRecordId: EntityId): string {
		const pathToFile = [schoolId, fileRecordId].join('/');

		return pathToFile;
	}

	private async unmarkForDelete(fileRecords: FileRecord[]): Promise<void> {
		fileRecords.forEach((fileRecord) => {
			fileRecord.unmarkForDelete();
		});

		await this.fileRecordRepo.save(fileRecords);
	}

	private async markForDelete(fileRecords: FileRecord[]): Promise<void> {
		fileRecords.forEach((fileRecord) => {
			fileRecord.markForDelete();
		});

		await this.fileRecordRepo.save(fileRecords);
	}

	private async delete(fileRecords: FileRecord[]) {
		this.logger.debug({ action: 'delete', fileRecords });

		await this.markForDelete(fileRecords);
		try {
			const paths = fileRecords.map((fileRecord) => this.createPath(fileRecord.schoolId, fileRecord.id));

			await this.storageClient.delete(paths);
		} catch (err) {
			await this.unmarkForDelete(fileRecords);

			throw new InternalServerErrorException(err, `${FilesStorageService.name}:delete`);
		}
	}

	public async deleteFilesOfParent(params: FileRecordParams): Promise<Counted<FileRecord[]>> {
		const [fileRecords, count] = await this.fileRecordRepo.findBySchoolIdAndParentId(params.schoolId, params.parentId);

		if (count > 0) {
			await this.delete(fileRecords);
		}

		return [fileRecords, count];
	}
}
