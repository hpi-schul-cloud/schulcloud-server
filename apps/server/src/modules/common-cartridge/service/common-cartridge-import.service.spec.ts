import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BoardsClientAdapter } from '@infra/boards-client';
import { CardClientAdapter } from '@infra/card-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeImportService } from './common-cartridge-import.service';

jest.mock('../import/common-cartridge-file-parser');

// jest.mock('../import/common-cartridge-file-parser', () => {
// 	const fileParserMock = createMock<CommonCartridgeFileParser>();
// const courseId = faker.string.uuid();
// const boardId = faker.string.uuid();
// const columnId = faker.string.uuid();
// 	const cardId1 = faker.string.uuid();
// 	// const cardId2 = faker.string.uuid();
// 	const elementId1 = faker.string.uuid();
// 	// const elementId2 = faker.string.uuid();

// 	fileParserMock.getTitle.mockReturnValue(faker.lorem.words());
// 	fileParserMock.getOrganizations.mockReturnValue([
// 		{
// 	pathDepth: 0,
// 	title: faker.lorem.words(),
// 	path: faker.system.filePath(),
// 	identifier: courseId,
// 	isInlined: true,
// 	isResource: false,
// 	resourcePath: faker.system.filePath(),
// 	resourceType: faker.lorem.word(),
// },
// {
// 	pathDepth: 1,
// 	title: faker.lorem.words(),
// 	path: `${courseId}/${boardId}`,
// 	identifier: columnId,
// 	isInlined: false,
// 	isResource: false,
// 	resourcePath: faker.system.filePath(),
// 	resourceType: faker.lorem.word(),
// },
// 		{
// 			pathDepth: 2,
// 			title: faker.lorem.words(),
// 			path: `${courseId}/${boardId}/${columnId}`,
// 			identifier: cardId1,
// 			isInlined: false,
// 			isResource: true,
// 			resourcePath: 'https://www.webcontent.html',
// 			resourceType: faker.lorem.word(),
// 		},
// 		{
// 			pathDepth: 3,
// 			title: faker.lorem.words(),
// 			path: `${courseId}/${boardId}/${columnId}/${cardId1}`,
// 			identifier: elementId1,
// 			isInlined: false,
// 			isResource: false,
// 			resourcePath: 'https://www.webcontent.html',
// 			resourceType: faker.lorem.word(),
// 		},
// 		// {
// 		// 	pathDepth: 2,
// 		// 	title: faker.lorem.words(),
// 		// 	path: `${courseId}/${boardId}/${columnId}`,
// 		// 	identifier: cardId2,
// 		// 	isInlined: false,
// 		// 	isResource: false,
// 		// 	resourcePath: 'https://www.weblink.imswl_xmlv1p1',
// 		// 	resourceType: CommonCartridgeResourceTypeV1P1.WEB_LINK,
// 		// },
// 		// {
// 		// 	pathDepth: 3,
// 		// 	title: faker.lorem.words(),
// 		// 	path: `${courseId}/${boardId}/${columnId}/${cardId1}`,
// 		// 	identifier: elementId2,
// 		// 	isInlined: false,
// 		// 	isResource: false,
// 		// 	resourcePath: 'https://www.weblink.imswl_xmlv1p1',
// 		// 	resourceType: CommonCartridgeResourceTypeV1P1.WEB_LINK,
// 		// },
// 	]);

// 	fileParserMock.getResource.mockReturnValue({
// 		type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
// 		html: '<p>Example content</p>',
// 	});

// 	return {
// 		CommonCartridgeFileParser: jest.fn(() => fileParserMock),
// 	};
// });

describe(CommonCartridgeImportService.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let boardsClientAdapterMock: DeepMocked<BoardsClientAdapter>;
	let commonCartridgeFileParser: jest.Mocked<CommonCartridgeFileParser>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeImportService,
				{
					provide: CoursesClientAdapter,
					useValue: createMock<CoursesClientAdapter>(),
				},
				{
					provide: BoardsClientAdapter,
					useValue: createMock<BoardsClientAdapter>(),
				},
				{
					provide: ColumnClientAdapter,
					useValue: createMock<ColumnClientAdapter>(),
				},
				{
					provide: CardClientAdapter,
					useValue: createMock<CardClientAdapter>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeImportService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		boardsClientAdapterMock = module.get(BoardsClientAdapter);
		commonCartridgeFileParser = createMock<CommonCartridgeFileParser>();
		(CommonCartridgeFileParser as jest.Mock).mockImplementation(() => commonCartridgeFileParser);
	});

	afterEach(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('importFile', () => {
		describe('when importing a file', () => {
			const setup = () => {
				const file = Buffer.from('');

				return { file };
			};

			it('should create a course', async () => {
				const { file } = setup();

				commonCartridgeFileParser.getTitle.mockReturnValue('test course');

				commonCartridgeFileParser.getOrganizations.mockReturnValue([]);

				await sut.importFile(file);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: 'test course' });
			});

			it('should create a board', async () => {
				const { file } = setup();

				commonCartridgeFileParser.getTitle.mockReturnValue('test course');
				commonCartridgeFileParser.getOrganizations.mockReturnValue([
					{
						pathDepth: 0,
						title: 'Mock Board',
						identifier: faker.string.uuid(),
						path: faker.string.uuid(),
						isInlined: false,
						isResource: false,
						resourcePath: '',
						resourceType: '',
					},
				]);

				coursesClientAdapterMock.createCourse.mockResolvedValue({ courseId: faker.string.uuid() });

				await sut.importFile(file);

				expect(boardsClientAdapterMock.createBoard).toHaveBeenCalledWith({
					title: 'Mock Board',
					layout: 'columns',
					parentId: expect.any(String),
					parentType: 'course',
				});
			});
		});
	});
});
