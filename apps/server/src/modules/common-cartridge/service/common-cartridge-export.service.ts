import { FileApiInterface, FilesStorageClientFactory } from '@infra/files-storage-client';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { BoardClientAdapter } from '../common-cartridge-client/board-client';
import { CardClientAdapter } from '../common-cartridge-client/card-client/card-client.adapter';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';
import { CourseCommonCartridgeMetadataDto, CoursesClientAdapter } from '../common-cartridge-client/course-client';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import { RoomBoardDto } from '../common-cartridge-client/room-client/dto/room-board.dto';

@Injectable()
export class CommonCartridgeExportService {
	constructor(
		private readonly filesService: FilesStorageClientAdapterService,
		private readonly boardClientAdapter: BoardClientAdapter,
		private readonly cardClientAdapter: CardClientAdapter,
		private readonly coursesClientAdapter: CoursesClientAdapter,
		private readonly courseRoomsClientAdapter: CourseRoomsClientAdapter,
		private readonly filesStorageApiClientFactory: FilesStorageClientFactory
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

	public async findAllCardsByIds(ids: Array<string>): Promise<CardListResponseDto> {
		const cards = await this.cardClientAdapter.getAllBoardCardsByIds(ids);

		return cards;
	}

	public async getFiles(files: FileDto[]): Promise<Array<[FileDto, Buffer]>> {
		const client = this.filesStorageApiClientFactory.createFileClient();
		const downloads = files.map((file) => this.getFile(client, file));
		const results = await Promise.allSettled(downloads);
		// TODO: Handle errors/log them
		const downloadedFiles = results.filter((result) => result.status === 'fulfilled').map((result) => result.value);

		return downloadedFiles;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
	private async getFile(client: FileApiInterface, file: FileDto): Promise<[FileDto, Buffer]> {
		// const response = await client.download(file.id, file.name, undefined, { responseType: 'stream' });
		// const buffer = Buffer.from(response.data.pipe());

		throw new Error('Not implemented');
	}
}
