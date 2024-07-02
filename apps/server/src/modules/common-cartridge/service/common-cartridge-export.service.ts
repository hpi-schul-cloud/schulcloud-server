import { Injectable } from '@nestjs/common';
import { FileRecord } from '@src/modules/files-storage/entity';
import { FilesStorageService } from '@src/modules/files-storage/service';

@Injectable()
export class CommonCartridgeExportService {
	constructor(private readonly filesService: FilesStorageService) {}

	public async findCourseFileRecords(courseId: string): Promise<FileRecord[]> {
		const [courseFiles] = await this.filesService.getFileRecordsOfParent(courseId);

		return courseFiles;
	}
}
