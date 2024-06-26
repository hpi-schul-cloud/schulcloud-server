import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { FileRecord } from '@src/modules/files-storage/entity';
import { FilesStorageService } from '@src/modules/files-storage/service';

@Injectable()
export class CommonCartridgeExportService {
	constructor(private readonly filesService: FilesStorageService, private readonly logger: LegacyLogger) {
		this.logger.setContext(CommonCartridgeExportService.name);
	}

	public async findCourseFileRecords(courseId: string): Promise<FileRecord[]> {
		const [courseFiles] = await this.filesService.getFileRecordsOfParent(courseId);

		return courseFiles;
	}
}
