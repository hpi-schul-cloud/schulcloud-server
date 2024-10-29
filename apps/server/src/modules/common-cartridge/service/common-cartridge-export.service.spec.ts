import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardClientAdapter } from '../common-cartridge-client/board-client';
import { CommonCartridgeExportService } from './common-cartridge-export.service';
import { CoursesClientAdapter } from '../common-cartridge-client/course-client';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import { CardClientAdapter } from '../common-cartridge-client/card-client/card-client.adapter';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';
import { CardResponseDto } from '../common-cartridge-client/card-client/dto/card-response.dto';
import { ContentElementType } from '../common-cartridge-client/card-client/enums/content-element-type.enum';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let sut: CommonCartridgeExportService;
	let filesStorageServiceMock: DeepMocked<FilesStorageClientAdapterService>;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let courseRoomsClientAdapterMock: DeepMocked<CourseRoomsClientAdapter>;
	let cardClientAdapterMock: DeepMocked<CardClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeExportService,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: BoardClientAdapter,
					useValue: createMock<BoardClientAdapter>(),
				},
				{
					provide: CoursesClientAdapter,
					useValue: createMock<CoursesClientAdapter>(),
				},
				{
					provide: CourseRoomsClientAdapter,
					useValue: createMock<CourseRoomsClientAdapter>(),
				},
				{
					provide: CardClientAdapter,
					useValue: createMock<CardClientAdapter>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeExportService);
		filesStorageServiceMock = module.get(FilesStorageClientAdapterService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		courseRoomsClientAdapterMock = module.get(CourseRoomsClientAdapter);
		cardClientAdapterMock = module.get(CardClientAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('findCourseFileRecords', () => {
		const setup = () => {
			const courseId = faker.string.uuid();
			const expected = [];

			filesStorageServiceMock.listFilesOfParent.mockResolvedValue([]);

			return { courseId, expected };
		};

		it('should return a list of FileRecords', async () => {
			const { courseId, expected } = setup();

			const result = await sut.findCourseFileRecords(courseId);

			expect(result).toEqual(expected);
		});
	});

	describe('findCourseCcMetadata', () => {
		const setup = () => {
			const courseId = faker.string.uuid();
			const expected = {
				id: courseId,
				title: faker.lorem.sentence(),
				copyRightOwners: [faker.lorem.word()],
			};

			coursesClientAdapterMock.getCourseCommonCartridgeMetadata.mockResolvedValue(expected);

			return { courseId, expected };
		};

		it('should return a CourseCommonCartridgeMetadataDto', async () => {
			const { courseId, expected } = setup();

			const result = await sut.findCourseCommonCartridgeMetadata(courseId);

			expect(result).toEqual(expected);
		});
	});

	describe('findCourseRoomBoard', () => {
		const setup = () => {
			const roomId = faker.string.uuid();
			const expected = {
				roomId,
				title: faker.lorem.word(),
				displayColor: faker.date.recent().toString(),
				isSynchronized: faker.datatype.boolean(),
				elements: [],
				isArchived: faker.datatype.boolean(),
			};

			courseRoomsClientAdapterMock.getRoomBoardByCourseId.mockResolvedValue(expected);

			return { roomId, expected };
		};

		it('should return a room board', async () => {
			const { roomId, expected } = setup();

			const result = await sut.findRoomBoardByCourseId(roomId);

			expect(result).toEqual(expected);
		});
	});

	describe('findAllCardsByIds', () => {
		const setup = () => {
			const cardsIds: Array<string> = new Array<string>(faker.string.uuid());
			const mockCard: CardResponseDto = {
				id: cardsIds[0],
				title: faker.lorem.word(),
				height: faker.number.int(),
				elements: [
					{
						id: 'element-1',
						type: ContentElementType.RICH_TEXT,
						content: {
							text: faker.string.alphanumeric.toString(),
							inputFormat: 'HTML',
						},
						timestamps: {
							lastUpdatedAt: faker.date.anytime.toString(),
							createdAt: faker.date.anytime.toString(),
							deletedAt: '',
						},
					},
				],
				visibilitySettings: {
					publishedAt: '2024-10-01T12:00:00Z',
				},
				timeStamps: {
					lastUpdatedAt: '2024-10-01T11:00:00Z',
					createdAt: faker.date.anytime.toString(),
					deletedAt: faker.date.anytime.toString(),
				},
			};
			const expected: CardListResponseDto = new CardListResponseDto(new Array<CardResponseDto>(mockCard));
			cardClientAdapterMock.getAllBoardCardsByIds.mockResolvedValue(expected);

			return { cardsIds, expected };
		};
		it('should return a card', async () => {
			const { cardsIds, expected } = setup();
			const result = await sut.findAllCardsByIds(cardsIds);

			expect(result).toEqual(expected);
		});
	});
});
