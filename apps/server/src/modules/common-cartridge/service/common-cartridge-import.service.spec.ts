import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BoardsClientAdapter } from '@infra/boards-client';
import { CardClientAdapter } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeImportOrganizationProps, CommonCartridgeImportResourceProps } from '..';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeResourceTypeV1P1 } from '../import/common-cartridge-import.enums';
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

			it('should update column title', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(columnClientAdapterMock.updateBoardColumnTitle).toHaveBeenCalledTimes(1);
			});

			it('should create a card', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(columnClientAdapterMock.createCard).toHaveBeenCalledTimes(2);
			});

			it('should update card title', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(cardClientAdapterMock.updateCardTitle).toHaveBeenCalledTimes(1);
			});

			it('should create a rich text element', async () => {
				const { file } = setup();

				commonCartridgeFileParser.getResource.mockReturnValue({
					type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
					html: '<p>Example content</p>',
				});

				await sut.importFile(file);

				expect(cardClientAdapterMock.createCardElement).toHaveBeenCalledTimes(1);
				expect(cardClientAdapterMock.updateCardElement).toHaveBeenCalledTimes(1);
			});

			it('should create a link element', async () => {
				const { file } = setup();

				commonCartridgeFileParser.getResource.mockReturnValue({
					type: CommonCartridgeResourceTypeV1P1.WEB_LINK,
					title: 'Example link',
					url: 'https://www.example.com',
				});

				await sut.importFile(file);

				expect(cardClientAdapterMock.createCardElement).toHaveBeenCalledTimes(1);
				expect(cardClientAdapterMock.updateCardElement).toHaveBeenCalledTimes(1);
			});

			it('should not create an element if the resource type is not supported', async () => {
				const { file } = setup();

				commonCartridgeFileParser.getResource.mockReturnValue({
					type: CommonCartridgeResourceTypeV1P1.UNKNOWN,
				});

				await sut.importFile(file);

				expect(cardClientAdapterMock.createCardElement).not.toHaveBeenCalled();
				expect(cardClientAdapterMock.updateCardElement).not.toHaveBeenCalled();
			});

			it('should return undefined if resource type is not WEB_CONTENT with .html', () => {
				const resource: CommonCartridgeImportResourceProps = {
					type: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
				} as CommonCartridgeImportResourceProps;

				const cardElementProps: CommonCartridgeImportOrganizationProps = {
					resourcePath: 'some-path.txt',
				} as CommonCartridgeImportOrganizationProps;

				const result = sut['mapToResourceBody'](resource, cardElementProps);

				expect(result).toBeUndefined();
			});
		});
	});
});
