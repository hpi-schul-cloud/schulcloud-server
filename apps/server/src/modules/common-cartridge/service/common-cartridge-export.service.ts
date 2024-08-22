import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { CoursesClientAdapter } from '../common-cartridge-client/courses-client.adapter';
import { CourseCommonCartridgeMetadataDto } from '../common-cartridge-client/dto/course-common-cartridge-metadata.dto';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly filesService: FilesStorageClientAdapterService,
		private readonly coursesClientAdapter: CoursesClientAdapter
	) {}

	public async findCourseFileRecords(courseId: string): Promise<FileDto[]> {
		const courseFiles = await this.filesService.listFilesOfParent(courseId);

		return courseFiles;
	}

	public async findCourseCcMetadata(courseId: string): Promise<CourseCommonCartridgeMetadataDto> {
		const courseCcMetadata = await this.coursesClientAdapter.getCourseCommonCartridgeMetadata(courseId);

		return courseCcMetadata;
	}
}
