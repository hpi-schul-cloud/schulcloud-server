import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import AdmZip from 'adm-zip';
import {
	BoardClientAdapter,
	BoardSkeletonDto,
	CardSkeletonDto,
	ColumnSkeletonDto,
} from '../common-cartridge-client/board-client';
import { CommonCartridgeExportService } from './common-cartridge-export.service';
import { CourseCommonCartridgeMetadataDto, CoursesClientAdapter } from '../common-cartridge-client/course-client';
import { CourseRoomsClientAdapter } from '../common-cartridge-client/room-client';
import { CardClientAdapter } from '../common-cartridge-client/card-client/card-client.adapter';
import { LessonClientAdapter } from '../common-cartridge-client/lesson-client/lesson-client.adapter';
import { CommonCartridgeExportMapper } from './common-cartridge.mapper';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { RoomBoardDto } from '../common-cartridge-client/room-client/dto/room-board.dto';
import { LessonContentDto, LessonDto, LessonLinkedTaskDto } from '../common-cartridge-client/lesson-client/dto';
import { CardResponseDto } from '../common-cartridge-client/card-client/dto/card-response.dto';
import { VisibilitySettingsResponseDto } from '../common-cartridge-client/card-client/dto/visibility-settings-response.dto';
import { TimestampResponseDto } from '../common-cartridge-client/card-client/dto/timestamp-response.dto';
import { CardListResponseDto } from '../common-cartridge-client/card-client/dto/card-list-response.dto';
import { BoardElementDtoType } from '../common-cartridge-client/room-client/enums/board-element.enum';
import { BoardLayout } from '../common-cartridge-client/room-client/enums/board-layout.enum';
import { BoardTaskDto } from '../common-cartridge-client/room-client/dto/board-task.dto';
import { BoardTaskStatusDto } from '../common-cartridge-client/room-client/dto/board-task-status.dto';
import { RichTextElementResponseDto } from '../common-cartridge-client/card-client/dto/rich-text-element-response.dto';
import { ContentElementType } from '../common-cartridge-client/card-client/enums/content-element-type.enum';
import { RichTextElementContentDto } from '../common-cartridge-client/card-client/dto/rich-text-element-content.dto';
import { LinkElementResponseDto } from '../common-cartridge-client/card-client/dto/link-element-response.dto';
import { LinkElementContentDto } from '../common-cartridge-client/card-client/dto/link-element-content.dto';
import { ComponentTextPropsDto } from '../common-cartridge-client/lesson-client/dto/component-text-props.dto';
import { BoardLessonDto } from '../common-cartridge-client/room-client/dto/board-lesson.dto';
import { ComponentGeogebraPropsDto } from '../common-cartridge-client/lesson-client/dto/component-geogebra-props.dto';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let sut: CommonCartridgeExportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let courseRoomsClientAdapterMock: DeepMocked<CourseRoomsClientAdapter>;
	let cardClientAdapterMock: DeepMocked<CardClientAdapter>;
	let boardClientAdapterMock: DeepMocked<BoardClientAdapter>;
	let lessonClientAdapterMock: DeepMocked<LessonClientAdapter>;

	const dummyCourseId = faker.string.uuid();
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
		const courseMetadata = new CourseCommonCartridgeMetadataDto({
			id: dummyCourseId,
			courseName: 'TEST COURSE',
			creationDate: faker.date.recent().toISOString(),
			copyRightOwners: [faker.person.fullName()],
		});

		const lessonLinkedTask: LessonLinkedTaskDto[] = [
			{
				name: 'First linked Task',
				description: faker.lorem.paragraph(),
				descriptionInputFormat: 'plainText',
				availableDate: faker.date.recent().toISOString(),
				dueDate: faker.date.future().toISOString(),
				private: false,
				publicSubmissions: false,
				teamSubmissions: false,
				creator: faker.internet.email(),
				courseId: dummyCourseId,
				submissionIds: [],
				finishedIds: [],
			},
			{
				name: 'second linked Task',
				description: faker.lorem.paragraph(),
				descriptionInputFormat: 'plainText',
				availableDate: faker.date.recent().toISOString(),
				dueDate: faker.date.future().toISOString(),
				private: false,
				publicSubmissions: false,
				teamSubmissions: false,
				creator: faker.internet.email(),
				courseId: dummyCourseId,
				submissionIds: [],
				finishedIds: [],
			},
		];

		const lessons: LessonDto[] = [
			{
				lessonId: faker.string.uuid(),
				name: 'TEST LESSON 1',
				courseId: dummyCourseId,
				courseGroupId: faker.string.uuid(),
				hidden: false,
				position: faker.number.int(),
				contents: [
					new LessonContentDto({
						id: faker.string.uuid(),
						content: new ComponentTextPropsDto({
							text: 'text',
						}),
						title: faker.lorem.sentence(),
						component: 'text',
						hidden: false,
					}),
					new LessonContentDto({
						id: faker.string.uuid(),
						content: new ComponentGeogebraPropsDto({
							materialId: faker.string.uuid(),
						}),
						title: faker.lorem.sentence(),
						component: 'geoGebra',
						hidden: false,
					}),
				],
				materials: [],
				linkedTasks: [lessonLinkedTask[0]],
			},
			{
				lessonId: faker.string.uuid(),
				name: 'TEST LESSON 2',
				courseId: dummyCourseId,
				courseGroupId: faker.string.uuid(),
				hidden: false,
				position: faker.number.int(),
				contents: [
					new LessonContentDto({
						id: faker.string.uuid(),
						content: new ComponentTextPropsDto({
							text: 'text',
						}),
						title: faker.lorem.sentence(),
						component: 'text',
						hidden: false,
					}),
				],
				materials: [],
			},
		];

		const boardSkeleton: BoardSkeletonDto = {
			boardId: faker.string.uuid(),
			title: 'TEST BOARD SKELETON',
			columns: [
				new ColumnSkeletonDto({
					columnId: faker.string.uuid(),
					title: faker.lorem.sentence(),
					cards: [
						new CardSkeletonDto({
							cardId: faker.string.uuid(),
							height: faker.number.int(),
						}),
						new CardSkeletonDto({
							cardId: faker.string.uuid(),
							height: faker.number.int(),
						}),
					],
				}),
				new ColumnSkeletonDto({
					columnId: faker.string.uuid(),
					title: faker.lorem.sentence(),
					cards: [],
				}),
			],
			isVisible: true,
			layout: 'columns',
		};

		const listOfCardsResponse: CardListResponseDto = {
			data: [
				new CardResponseDto(
					boardSkeleton.columns[0].cards?.[0].cardId ?? '',
					'Text card',
					faker.number.int(),
					[
						new RichTextElementResponseDto(
							faker.string.uuid(),
							ContentElementType.RICH_TEXT,
							new RichTextElementContentDto('dummy rich text', 'plainText'),
							new TimestampResponseDto(faker.date.recent().toISOString(), faker.date.recent().toISOString(), undefined)
						),
					],
					new VisibilitySettingsResponseDto('public'),
					new TimestampResponseDto(faker.date.recent().toISOString(), faker.date.recent().toISOString(), undefined)
				),
				new CardResponseDto(
					boardSkeleton.columns[0].cards?.[1].cardId ?? '',
					'link card',
					faker.number.int(),
					[
						new LinkElementResponseDto(
							faker.string.uuid(),
							ContentElementType.LINK,
							new LinkElementContentDto('dummy url', 'dummy title of the link', 'dummy description'),
							new TimestampResponseDto(faker.date.recent().toISOString(), faker.date.recent().toISOString(), undefined)
						),
					],
					new VisibilitySettingsResponseDto('public'),
					new TimestampResponseDto(faker.date.recent().toISOString(), faker.date.recent().toISOString(), undefined)
				),
			],
		};

		const boardTask: BoardTaskDto = {
			id: faker.string.uuid(),
			name: 'TEST TASK',
			availableDate: faker.date.recent().toISOString(),
			dueDate: faker.date.future().toISOString(),
			courseName: courseMetadata.courseName,
			description: faker.lorem.paragraph(),
			displayColor: faker.internet.color(),
			createdAt: faker.date.recent().toISOString(),
			updatedAt: faker.date.recent().toISOString(),
			status: new BoardTaskStatusDto({
				submitted: faker.number.int(),
				maxSubmissions: faker.number.int(),
				graded: faker.number.int(),
				isDraft: faker.datatype.boolean(),
				isSubstitutionTeacher: faker.datatype.boolean(),
				isFinished: faker.datatype.boolean(),
			}),
		};

		const room: RoomBoardDto = {
			roomId: faker.string.uuid(),
			title: courseMetadata.courseName,
			displayColor: faker.internet.color(),
			elements: [
				{
					type: BoardElementDtoType.TASK,
					content: { ...boardTask, status: { ...boardTask.status } },
				},
				{
					type: BoardElementDtoType.COLUMN_BOARD,
					content: {
						id: boardSkeleton.boardId,
						title: 'TEST BOARD COLUMN BOARD',
						published: faker.datatype.boolean(),
						createdAt: faker.date.recent().toISOString(),
						updatedAt: faker.date.recent().toISOString(),
						columnBoardId: boardSkeleton.boardId,
						layout: BoardLayout.COLUMNS,
					},
				},
				{
					type: BoardElementDtoType.LESSON,
					content: new BoardLessonDto({
						id: lessons[0].lessonId,
						name: lessons[0].name,
						courseName: courseMetadata.courseName,
						numberOfPublishedTasks: lessons[0].linkedTasks?.length ?? 0,
						numberOfDraftTasks: 0,
						numberOfPlannedTasks: 0,
						createdAt: faker.date.recent().toISOString(),
						updatedAt: faker.date.recent().toISOString(),
						hidden: lessons[0].hidden,
					}),
				},
				{
					type: BoardElementDtoType.LESSON,
					content: new BoardLessonDto({
						id: lessons[1].lessonId,
						name: lessons[1].name,
						courseName: courseMetadata.courseName,
						numberOfPublishedTasks: lessons[1].linkedTasks?.length ?? 0,
						numberOfDraftTasks: 0,
						numberOfPlannedTasks: 0,
						createdAt: faker.date.recent().toISOString(),
						updatedAt: faker.date.recent().toISOString(),
						hidden: lessons[1].hidden,
					}),
				},
			],
			isArchived: false,
			isSynchronized: false,
		};

		coursesClientAdapterMock.getCourseCommonCartridgeMetadata.mockResolvedValue(courseMetadata);
		courseRoomsClientAdapterMock.getRoomBoardByCourseId.mockResolvedValue(room);
		lessonClientAdapterMock.getLessonById.mockResolvedValue(lessons[0]);
		lessonClientAdapterMock.getLessonTasks.mockResolvedValue(lessonLinkedTask);
		boardClientAdapterMock.getBoardSkeletonById.mockResolvedValue(boardSkeleton);
		cardClientAdapterMock.getAllBoardCardsByIds.mockResolvedValue(listOfCardsResponse);

		const buffer = await sut.exportCourse(
			dummyCourseId,
			version,
			exportTopics ? [room.elements[2].content.id, room.elements[3].content.id] : [],
			exportTasks ? [room.elements[0].content.id] : [],
			exportColumnBoards ? [room.elements[1].content.id] : []
		);

		const archive = new AdmZip(buffer);

		return {
			courseMetadata,
			archive,
			version,
			room,
			lessons,
			boardTask,
			boardSkeleton,
			listOfCardsResponse,
			textElement: listOfCardsResponse.data[0].elements[0].content as RichTextElementContentDto,
			linkElement: listOfCardsResponse.data[1].elements[0].content as LinkElementContentDto,
		};
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
				{
					provide: LessonClientAdapter,
					useValue: createMock<LessonClientAdapter>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeExportService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		courseRoomsClientAdapterMock = module.get(CourseRoomsClientAdapter);
		cardClientAdapterMock = module.get(CardClientAdapter);
		boardClientAdapterMock = module.get(BoardClientAdapter);
		lessonClientAdapterMock = module.get(LessonClientAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('exportCourse', () => {
		describe('when using version 1.1', () => {
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_1_0, true, true, true);

			it('should use schema version 1.1.0', async () => {
				const { archive } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('schemaversion', '1.1.0'));
			});

			it('should add course', async () => {
				const { archive, courseMetadata } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(
					createXmlString('mnf:string', courseMetadata.courseName)
				);
			});

			it('should add lesson', async () => {
				const { archive, room } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(
					createXmlString('title', (room.elements[2].content as BoardLessonDto).name)
				);
			});

			it('should add task', async () => {
				const { archive, boardTask } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('title', boardTask.name));

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(`<resource identifier="i${boardTask.id}"`);
			});

			it('should add tasks of lesson to manifest file', async () => {
				const { archive, lessons } = await setup();
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

				lessons[0].linkedTasks?.forEach((linkedTask) => {
					expect(manifest).toContain(`<title>${linkedTask.name}</title>`);
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
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_3_0, true, true, true);

			it('should use schema version 1.3.0', async () => {
				const { archive } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(createXmlString('schemaversion', '1.3.0'));
			});

			it('should add course', async () => {
				const { archive, courseMetadata } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(
					createXmlString('mnf:string', courseMetadata.courseName)
				);
			});

			it('should add lessons', async () => {
				const { archive, room } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(
					createXmlString('title', (room.elements[2].content as BoardLessonDto).name)
				);
			});

			it('should add tasks', async () => {
				const { archive, boardTask } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).toContain(`<resource identifier="i${boardTask.id}"`);
			});

			it('should add tasks of lesson to manifest file', async () => {
				const { archive, lessons } = await setup();
				const manifest = archive.getEntry('imsmanifest.xml')?.getData().toString();

				lessons[0].linkedTasks?.forEach((linkedTask) => {
					expect(manifest).toContain(`<title>${linkedTask.name}</title>`);
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

			it('should add content element of cards', async () => {
				const { archive, listOfCardsResponse } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(`<resource identifier="i${listOfCardsResponse.data[0].id}"`);
			});

			it('should add link element of card', async () => {
				const { archive, linkElement } = await setup();
				const manifest = getFileContent(archive, 'imsmanifest.xml');

				expect(manifest).toContain(createXmlString('title', linkElement.title));
			});
		});

		describe('When topics array is empty', () => {
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_1_0, false, true, true);

			it("shouldn't add lessons", async () => {
				const { archive, lessons } = await setup();

				lessons.forEach((lesson) => {
					expect(getFileContent(archive, 'imsmanifest.xml')).not.toContain(createXmlString('title', lesson.name));
				});
			});
		});

		describe('When tasks array is empty', () => {
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_1_0, true, false, true);

			it("shouldn't add tasks", async () => {
				const { archive, boardTask } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).not.toContain(`<resource identifier="i${boardTask.id}"`);
			});
		});

		describe('When columnBoards array is empty', () => {
			const setup = async () => setupParams(CommonCartridgeVersion.V_1_1_0, true, true, false);

			it("shouldn't add column boards", async () => {
				const { archive, boardSkeleton } = await setup();

				expect(getFileContent(archive, 'imsmanifest.xml')).not.toContain(
					createXmlString('title', boardSkeleton.columns[0].title)
				);
			});
		});
	});
});
