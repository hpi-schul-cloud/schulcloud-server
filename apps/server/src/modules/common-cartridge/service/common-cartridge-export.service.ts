import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { BoardClientAdapter } from '../common-cartridge-client/board-client';
import { CourseCommonCartridgeMetadataDto, CoursesClientAdapter } from '../common-cartridge-client/course-client';
import { SingleColumnBoardResponse } from '../common-cartridge-client/room-client/room-api-client';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly filesService: FilesStorageClientAdapterService,
		private readonly boardClientAdapter: BoardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter
	) {}

	public async findCourseFileRecords(courseId: string): Promise<FileDto[]> {
		const courseFiles = await this.filesService.listFilesOfParent(courseId);

		return courseFiles;
	}

	public async findCourseCommonCartridgeMetadata(courseId: string): Promise<CourseCommonCartridgeMetadataDto> {
		const courseCommonCartridgeMetadata = await this.coursesClientAdapter.getCourseCommonCartridgeMetadata(courseId);

		return courseCommonCartridgeMetadata;
	}

	public async findCourseRooms(courseId: string): Promise<SingleColumnBoardResponse> {
		const courseRooms = await this.courseRoomsClientAdapter.getRoomsByCourseId(courseId);

		return courseRooms;
	}
}
