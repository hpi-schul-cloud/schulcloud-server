import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { FilesStorageService } from '@src/modules/files-storage/service';
import { FileRecord } from '@src/modules/files-storage/entity';
import { FileRecordParentType, GetFileResponse, StorageLocation } from '@src/modules/files-storage/interface';
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

	public async downloadFile(): Promise<GetFileResponse> {
		// const fileRecords: FileDto[] = await this.filesService.listFilesOfParent(courseId);
		const fileRecord: FileRecord = new FileRecord({
			name: 'Mathe-2024-10-16T09_59_47.369Z.imscc',
			size: 2358,
			mimeType: 'application/zip',
			parentType: FileRecordParentType.Task,
			isUploading: false,
			// hard coded id from DB
			parentId: '6710d7913d371c3101997959',
			storageLocation: StorageLocation.SCHOOL,
			// hard coded id from DB
			storageLocationId: '5f2987e020834114b8efd6f8',
		});

		fileRecord.id = '6710d792bf75fec677b0e3df';
		const fileResponse = await this.fileStorageService.download(fileRecord, {
			fileRecordId: fileRecord.id,
			fileName: fileRecord.name,
		});

		return fileResponse;
	}
}
