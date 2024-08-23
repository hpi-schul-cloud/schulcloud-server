import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { BoardClientAdapter } from '../common-cartridge-client/board-client/board-client.adapter';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly filesService: FilesStorageClientAdapterService,
		private readonly boardClientAdapter: BoardClientAdapter
	) {}

	public async findCourseFileRecords(courseId: string): Promise<FileDto[]> {
		const courseFiles = await this.filesService.listFilesOfParent(courseId);

		return courseFiles;
	}
}
