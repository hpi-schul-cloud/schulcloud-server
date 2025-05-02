import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BoardsClientAdapter } from '@infra/boards-client';
import { CardClientAdapter } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeResourceTypeV1P1 } from '../import/common-cartridge-import.enums';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';
import { CommonCartridgeImportService } from './common-cartridge-import.service';

jest.mock('../import/common-cartridge-file-parser');

describe(CommonCartridgeImportService.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let boardsClientAdapterMock: DeepMocked<BoardsClientAdapter>;
	let columnClientAdapterMock: DeepMocked<ColumnClientAdapter>;
	let cardClientAdapterMock: DeepMocked<CardClientAdapter>;
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
				{
					provide: CommonCartridgeImportMapper,
					useValue: createMock<CommonCartridgeImportMapper>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeImportService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		boardsClientAdapterMock = module.get(BoardsClientAdapter);
		columnClientAdapterMock = module.get(ColumnClientAdapter);
		cardClientAdapterMock = module.get(CardClientAdapter);
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
				const boardId = faker.string.uuid();
				const columnId = faker.string.uuid();
				const columnId2 = faker.string.uuid();
				const cardId = faker.string.uuid();
				const elementId = faker.string.uuid();
				const file = Buffer.from('');
				commonCartridgeFileParser.getTitle.mockReturnValue('test course');
				commonCartridgeFileParser.getOrganizations.mockReturnValue([
					{
						pathDepth: 0,
						title: 'Mock Board',
						identifier: boardId,
						path: boardId,
						isInlined: false,
						isResource: false,
						resourcePath: '',
						resourceType: '',
					},
					{
						pathDepth: 1,
						title: faker.lorem.words(),
						path: `${boardId}/${columnId}`,
						identifier: columnId,
						isInlined: false,
						isResource: false,
						resourcePath: faker.system.filePath(),
						resourceType: faker.lorem.word(),
					},
					{
						pathDepth: 2,
						title: faker.lorem.words(),
						path: `${boardId}/${columnId}/${cardId}`,
						identifier: cardId,
						isInlined: false,
						isResource: true,
						resourcePath: 'https://www.webcontent.html',
						resourceType: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
					},
					{
						pathDepth: 3,
						title: faker.lorem.words(),
						path: `${boardId}/${columnId}/${cardId}/${elementId}`,
						identifier: elementId,
						isInlined: false,
						isResource: false,
						resourcePath: 'https://www.webcontent.html',
						resourceType: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
					},
					{
						pathDepth: 1,
						title: faker.lorem.words(),
						path: `${boardId}/${columnId2}`,
						identifier: columnId2,
						isInlined: false,
						isResource: true,
						resourcePath: faker.system.filePath(),
						resourceType: faker.lorem.word(),
					},
					{
						pathDepth: 2,
						title: faker.lorem.words(),
						path: `${boardId}/${columnId2}/${cardId}`,
						identifier: cardId,
						isInlined: false,
						isResource: true,
						resourcePath: 'https://www.weblink.com',
						resourceType: CommonCartridgeResourceTypeV1P1.WEB_LINK,
					},
					{
						pathDepth: 3,
						title: faker.lorem.words(),
						path: `${boardId}/${columnId2}/${cardId}/${elementId}`,
						identifier: elementId,
						isInlined: false,
						isResource: false,
						resourcePath: 'https://www.weblink.com',
						resourceType: CommonCartridgeResourceTypeV1P1.WEB_LINK,
					},
					{
						pathDepth: 2,
						title: 'card without resource',
						path: `${boardId}/${columnId}/${cardId}`,
						identifier: cardId,
						isInlined: false,
						isResource: false,
						resourcePath: faker.system.filePath(),
						resourceType: CommonCartridgeResourceTypeV1P1.UNKNOWN,
					},
					{
						pathDepth: 3,
						title: faker.lorem.words(),
						path: `${boardId}/${columnId}/${cardId}/${elementId}`,
						identifier: elementId,
						isInlined: false,
						isResource: false,
						resourcePath: faker.system.filePath(),
						resourceType: CommonCartridgeResourceTypeV1P1.UNKNOWN,
					},
				]);

				coursesClientAdapterMock.createCourse.mockResolvedValue({ courseId: faker.string.uuid() });

				boardsClientAdapterMock.createBoard.mockResolvedValue({ id: boardId });

				return { file };
			};

			it('should create a course', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: 'test course' });
			});

			it('should give Untitled Course as title if no title is found', async () => {
				const { file } = setup();
				commonCartridgeFileParser.getTitle.mockReturnValue(undefined);

				await sut.importFile(file);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: 'Untitled Course' });
			});

			it('should create a board', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(boardsClientAdapterMock.createBoard).toHaveBeenCalledWith({
					title: 'Mock Board',
					layout: 'columns',
					parentId: expect.any(String),
					parentType: 'course',
				});
			});

			it('should create a column', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(boardsClientAdapterMock.createBoardColumn).toHaveBeenCalledWith(expect.any(String));
			});

			it('should update column resources', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(columnClientAdapterMock.updateBoardColumnTitle).toHaveBeenCalledTimes(2);
				expect(cardClientAdapterMock.updateCardTitle).toHaveBeenCalledTimes(3);
				expect(cardClientAdapterMock.updateCardElement).toHaveBeenCalledTimes(1);
			});

			it('should create a cards and update titles', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(columnClientAdapterMock.createCard).toHaveBeenCalledTimes(3);
				expect(cardClientAdapterMock.updateCardTitle).toHaveBeenCalledTimes(3);
			});
		});
	});
});
