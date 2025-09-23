import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { BoardResponse, BoardsClientAdapter } from '@infra/boards-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FilesStorageClientAdapter } from '@infra/files-storage-client';
import { FileRecordParentType } from '@infra/rabbitmq';
import { FileDto, FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import AdmZip from 'adm-zip';
import { ArchiverError, ProgressData } from 'archiver';
import { Readable } from 'stream';
import { CardClientAdapter } from '../common-cartridge-client/card-client/card-client.adapter';
import {
	CardListResponseDto,
	LinkElementContentDto,
	RichTextElementContentDto,
} from '../common-cartridge-client/card-client/dto';
import { LessonClientAdapter } from '../common-cartridge-client/lesson-client/lesson-client.adapter';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import {
	BoardColumnBoardDto,
	BoardLessonDto,
	BoardTaskDto,
	RoomBoardDto,
} from '../common-cartridge-client/room-client/dto';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportMessageLoggable } from '../loggable/common-cartridge-export-message.loggable';
import {
	boardColumnFactory,
	boardLessonFactory,
	boardTaskFactory,
	columnBoardFactory,
	courseMetadataFactory,
	lessonFactory,
	listOfCardResponseFactory,
	roomFactory,
} from '../testing/common-cartridge-dtos.factory';
import { CommonCartridgeExportMapper } from './common-cartridge-export.mapper';
import { CommonCartridgeExportService } from './common-cartridge-export.service';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let sut: CommonCartridgeExportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let courseRoomsClientAdapterMock: DeepMocked<CourseRoomsClientAdapter>;
	let cardClientAdapterMock: DeepMocked<CardClientAdapter>;
	let boardClientAdapterMock: DeepMocked<BoardsClientAdapter>;
	let lessonClientAdapterMock: DeepMocked<LessonClientAdapter>;
	let filesMetadataClientAdapterMock: DeepMocked<FilesStorageClientAdapterService>;
	let filesStorageClientAdapterMock: DeepMocked<FilesStorageClientAdapter>;
	let logger: DeepMocked<Logger>;

	const createXmlString = (nodeName: string, value: boolean | number | string): string =>
		`<${nodeName}>${value.toString()}</${nodeName}>`;
	const getFileContent = (archive: AdmZip, filePath: string): string | undefined =>
		archive.getEntry(filePath)?.getData().toString();
	const setupParams = async (
		version: CommonCartridgeVersion,
		exportTopics: boolean,
		exportTasks: boolean,
		exportColumnBoards: boolean
	) => {
		const courseMetadata = courseMetadataFactory.build();
		const lessons = lessonFactory.buildList(2);
		const [lesson] = lessons;
		lesson.courseId = courseMetadata.id;

		const boardSkeleton: BoardResponse = columnBoardFactory.build();
		const cardIds = boardSkeleton.columns
			.map((c) => c.cards)
			.flat()
			.map((c) => c.cardId);
		const listOfCardsResponse: CardListResponseDto = listOfCardResponseFactory.withCardIds(cardIds).build();
		const boardTask: BoardTaskDto = boardTaskFactory.build();
		boardTask.courseName = courseMetadata.title;

		const room: RoomBoardDto = roomFactory.build();
		room.title = courseMetadata.title;
		room.elements[0].content = boardTask;
		room.elements[1].content = new BoardLessonDto(boardLessonFactory.build());
		room.elements[1].content.id = lesson.lessonId;
		room.elements[1].content.name = lesson.name;
		room.elements[2].content = new BoardColumnBoardDto(boardColumnFactory.build());

		coursesClientAdapterMock.getCourseCommonCartridgeMetadata.mockResolvedValue(courseMetadata);
		lessonClientAdapterMock.getLessonById.mockResolvedValue(lesson);
		lessonClientAdapterMock.getLessonTasks.mockResolvedValue(lesson.linkedTasks ?? []);
		boardClientAdapterMock.getBoardSkeletonById.mockResolvedValue(boardSkeleton);
		cardClientAdapterMock.getAllBoardCardsByIds.mockResolvedValue(listOfCardsResponse);
		courseRoomsClientAdapterMock.getRoomBoardByCourseId.mockResolvedValue(room);

		const exported = await sut.exportCourse(
			courseMetadata.id,
			version,
			exportTopics ? [room.elements[1].content.id] : [],
			exportTasks ? [room.elements[0].content.id] : [],
			exportColumnBoards ? [room.elements[2].content.id] : []
		);
		const stream = exported.data;

		const buffer = await new Promise<Buffer>((resolve, reject) => {
			const chunks: Buffer[] = [];
			stream.on('data', (chunk: Buffer) => chunks.push(chunk));
			stream.on('end', () => resolve(Buffer.concat(chunks)));
			stream.on('error', reject);
		});

		const archive = new AdmZip(buffer);

		return {
			courseMetadata,
			archive,
			version,
			room,
			lesson,
			lessons,
			boardTask,
			boardSkeleton,
			listOfCardsResponse,
			textElement: listOfCardsResponse.data[0].elements[0].content as RichTextElementContentDto,
			linkElement: listOfCardsResponse.data[0].elements[1].content as LinkElementContentDto,
		};
	};
	const setupFile = () => {
		const fileRecord: FileDto = new FileDto({
			id: faker.string.uuid(),
			name: faker.system.fileName(),
			parentId: faker.string.uuid(),
			parentType: FileRecordParentType.Course,
			createdAt: faker.date.past(),
			updatedAt: faker.date.recent(),
		});
		const file = Readable.from(faker.lorem.paragraphs(100));

		filesMetadataClientAdapterMock.listFilesOfParent.mockResolvedValue([fileRecord]);
		filesStorageClientAdapterMock.getStream.mockResolvedValue(file);

		return { fileRecord, file };
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeExportService,
				CommonCartridgeExportMapper,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: BoardsClientAdapter,
					useValue: createMock<BoardsClientAdapter>(),
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
				{
					provide: LessonClientAdapter,
					useValue: createMock<LessonClientAdapter>(),
				},
				{
					provide: FilesStorageClientAdapter,
					useValue: createMock<FilesStorageClientAdapter>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeExportService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		courseRoomsClientAdapterMock = module.get(CourseRoomsClientAdapter);
		cardClientAdapterMock = module.get(CardClientAdapter);
		boardClientAdapterMock = module.get(BoardsClientAdapter);
		lessonClientAdapterMock = module.get(LessonClientAdapter);
		filesMetadataClientAdapterMock = module.get(FilesStorageClientAdapterService);
		filesStorageClientAdapterMock = module.get(FilesStorageClientAdapter);
		logger = module.get(Logger);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('exportCourse', () => {
		describe('when using version 1.1', () => {
			const setup = async () => {
				const fileSetup = setupFile();
				const paramsSetup = await setupParams(CommonCartridgeVersion.V_1_1_0, true, true, true);

				return { ...fileSetup, ...paramsSetup };
			};

			it('should use schema version 1.1.0', async () => {
				const { archive } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('schemaversion', '1.1.0'));
			});

			it('should add course', async () => {
				const { archive, courseMetadata } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(
					createXmlString('mnf:string', courseMetadata.title)
				);
			});

			it('should add lesson', async () => {
				const { archive, lesson } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('title', lesson.name));
			});

			it('should add task with file', async () => {
				const { archive, boardTask, fileRecord } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('title', boardTask.name));

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(`<resource identifier="i${boardTask.id}"`);

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(`${fileRecord.name}"`);
			});

			it('should add tasks of lesson to manifest file', async () => {
				const { archive, lesson } = await setup();
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

				lesson.linkedTasks.forEach((linkedTask) => {
					expect(manifest).toContain(`<title>${linkedTask.name}</title>`);
				});
			});

			it('should add lernstore element of lesson to manifest file', async () => {
				const { archive, lesson } = await setup();
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

				lesson.contents.forEach((content) => {
					expect(manifest).toContain(`<title>${content.title}</title>`);
				});
			});

			it('should add column boards', async () => {
				const { archive, boardSkeleton } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', boardSkeleton.title));
			});

			it('should add column', async () => {
				const { archive, boardSkeleton } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', boardSkeleton.columns[0].title ?? ''));
			});

			it('should add card', async () => {
				const { archive, listOfCardsResponse } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', listOfCardsResponse.data[0].title ?? ''));
			});
		});

		describe('when using version 1.3', () => {
			const setup = async () => {
				const fileSetup = setupFile();
				const paramsSetup = await setupParams(CommonCartridgeVersion.V_1_3_0, true, true, true);

				return { ...fileSetup, ...paramsSetup };
			};

			it('should use schema version 1.3.0', async () => {
				const { archive } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('schemaversion', '1.3.0'));
			});

			it('should add course', async () => {
				const { archive, courseMetadata } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(
					createXmlString('mnf:string', courseMetadata.title)
				);
			});

			it('should add lesson', async () => {
				const { archive, lesson } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('title', lesson.name));
			});

			it('should add tasks', async () => {
				const { archive, boardTask } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(`<resource identifier="i${boardTask.id}"`);
			});

			it('should add tasks of lesson to manifest file', async () => {
				const { archive, lesson } = await setup();
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

				lesson.linkedTasks.forEach((linkedTask) => {
					expect(manifest).toContain(`<title>${linkedTask.name}</title>`);
				});
			});

			it('should add lernstore element of lesson to manifest file', async () => {
				const { archive, lesson } = await setup();
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

				lesson.contents.forEach((content) => {
					expect(manifest).toContain(`<title>${content.title}</title>`);
				});
			});

			it('should add column boards', async () => {
				const { archive, boardSkeleton } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', boardSkeleton.title));
			});

			it('should add column', async () => {
				const { archive, boardSkeleton } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', boardSkeleton.columns[0].title ?? ''));
			});

			it('should add card', async () => {
				const { archive, listOfCardsResponse } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', listOfCardsResponse.data[0].title ?? ''));
			});

			it('should add link element of card', async () => {
				const { archive, linkElement } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', linkElement.title));
			});

			it('should add text element of card', async () => {
				const { archive, textElement } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', textElement.text));
			});
		});

		describe('when topics array is empty', () => {
			const setup = async () => {
				const fileSetup = setupFile();
				const paramsSetup = await setupParams(CommonCartridgeVersion.V_1_1_0, false, true, true);

				return { ...fileSetup, ...paramsSetup };
			};

			it("shouldn't add lessons", async () => {
				const { archive, lessons } = await setup();

				lessons.forEach((lesson) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).not.toContain(createXmlString('title', lesson.name));
				});
			});
		});

		describe('when tasks array is empty', () => {
			const setup = async () => {
				const fileSetup = setupFile();
				const paramsSetup = await setupParams(CommonCartridgeVersion.V_1_1_0, true, false, true);

				return { ...fileSetup, ...paramsSetup };
			};

			it("shouldn't add tasks", async () => {
				const { archive, boardTask } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).not.toContain(createXmlString('title', boardTask.name));
			});
		});

		describe('when columnBoards array is empty', () => {
			const setup = async () => {
				const fileSetup = setupFile();
				const paramsSetup = await setupParams(CommonCartridgeVersion.V_1_1_0, true, true, false);

				return { ...fileSetup, ...paramsSetup };
			};

			it("shouldn't add column boards", async () => {
				const { archive, boardSkeleton } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).not.toContain(
					createXmlString('title', boardSkeleton.columns[0].title)
				);
			});
		});

		describe('When event is emitted', () => {
			const setup = () => {
				const courseMetadata = courseMetadataFactory.build();
				const lessons = lessonFactory.buildList(2);
				const [lesson] = lessons;
				lesson.courseId = courseMetadata.id;

				const boardSkeleton: BoardResponse = columnBoardFactory.build();
				const cardIds = boardSkeleton.columns
					.map((c) => c.cards)
					.flat()
					.map((c) => c.cardId);
				const listOfCardsResponse: CardListResponseDto = listOfCardResponseFactory.withCardIds(cardIds).build();
				const boardTask: BoardTaskDto = boardTaskFactory.build();
				boardTask.courseName = courseMetadata.title;

				const room: RoomBoardDto = roomFactory.build();
				room.title = courseMetadata.title;
				room.elements[0].content = boardTask;
				room.elements[1].content = new BoardLessonDto(boardLessonFactory.build());
				room.elements[1].content.id = lesson.lessonId;
				room.elements[1].content.name = lesson.name;
				room.elements[2].content = new BoardColumnBoardDto(boardColumnFactory.build());

				coursesClientAdapterMock.getCourseCommonCartridgeMetadata.mockResolvedValue(courseMetadata);
				lessonClientAdapterMock.getLessonById.mockResolvedValue(lesson);
				lessonClientAdapterMock.getLessonTasks.mockResolvedValue(lesson.linkedTasks ?? []);
				boardClientAdapterMock.getBoardSkeletonById.mockResolvedValue(boardSkeleton);
				cardClientAdapterMock.getAllBoardCardsByIds.mockResolvedValue(listOfCardsResponse);
				courseRoomsClientAdapterMock.getRoomBoardByCourseId.mockResolvedValue(room);

				const courseId = faker.string.uuid();
				return { courseId };
			};

			it('should log warning on warning', async () => {
				const { courseId } = setup();

				const result = await sut.exportCourse(courseId, CommonCartridgeVersion.V_1_1_0, [], [], []);
				const archive = result.data;

				archive.emit('warning', {} as unknown as ArchiverError);

				expect(logger.warning).toHaveBeenCalledWith(
					new CommonCartridgeExportMessageLoggable('Warning while creating archive', {
						courseId,
						cause: JSON.stringify({}),
					})
				);
			});

			it('should log debug on progress', async () => {
				const { courseId } = setup();

				const result = await sut.exportCourse(courseId, CommonCartridgeVersion.V_1_1_0, [], [], []);
				const archive = result.data;

				archive.emit('progress', {
					entries: {
						total: 2,
						processed: 1,
					},
					fs: {
						totalBytes: 10,
						processedBytes: 5,
					},
				} as ProgressData);

				expect(logger.debug).toHaveBeenCalledWith(
					new CommonCartridgeExportMessageLoggable('Progress for CC export: 1 of 2 total processed.', {
						courseId,
						entries: {
							total: 2,
							processed: 1,
						},
						fs: {
							totalBytes: 10,
							processedBytes: 5,
						},
					})
				);
			});

			it('should throw on error', async () => {
				const { courseId } = setup();

				const result = await sut.exportCourse(courseId, CommonCartridgeVersion.V_1_1_0, [], [], []);
				const archive = result.data;

				expect(() => archive.emit('error', {} as unknown as ArchiverError)).toThrow(
					new InternalServerErrorException('Error while creating archive', { cause: {} })
				);
			});
		});
	});
});
