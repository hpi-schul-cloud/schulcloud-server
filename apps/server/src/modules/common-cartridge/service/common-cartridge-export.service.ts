import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { FilesStorageService } from '@src/modules/files-storage/service';
import { FileRecord } from '@src/modules/files-storage/entity';
import { GetFileResponse, StorageLocation } from '@src/modules/files-storage/interface';
import { BoardClientAdapter } from '../common-cartridge-client/board-client';
import { CourseCommonCartridgeMetadataDto, CoursesClientAdapter } from '../common-cartridge-client/course-client';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import { RoomBoardDto } from '../common-cartridge-client/room-client/dto/room-board.dto';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly filesService: FilesStorageClientAdapterService,
		private readonly boardClientAdapter: BoardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter,
		private readonly fileStorageService: FilesStorageService
	) {}

	public async findCourseFileRecords(courseId: string): Promise<FileDto[]> {
		const courseFiles = await this.filesService.listFilesOfParent(courseId);

		return courseFiles;
	}

	public async findCourseCommonCartridgeMetadata(courseId: string): Promise<CourseCommonCartridgeMetadataDto> {
		const courseCommonCartridgeMetadata = await this.coursesClientAdapter.getCourseCommonCartridgeMetadata(courseId);

		return courseCommonCartridgeMetadata;
	}

	public async findRoomBoardByCourseId(courseId: string): Promise<RoomBoardDto> {
		const courseRooms = await this.courseRoomsClientAdapter.getRoomBoardByCourseId(courseId);

		return courseRooms;
	}

	public async downloadFile(courseId: string): Promise<GetFileResponse> {
		const fileRecords: FileDto[] = await this.filesService.listFilesOfParent(courseId);
		const fileRecorde: FileRecord = new FileRecord({
			name: fileRecords[0].name,
			size: 1,
			mimeType: 'application/octet-stream',
			parentType: fileRecords[0].parentType,
			isUploading: false,
			parentId: fileRecords[0].parentId,
			storageLocation: StorageLocation.SCHOOL,
			// hard coded id from DB
			storageLocationId: '5f2987e020834114b8efd6f8',
		});
		const fileResponse = await this.fileStorageService.download(fileRecorde, {
			fileRecordId: fileRecords[0].id,
			fileName: fileRecords[0].name,
		});

		return fileResponse;
	}
}
