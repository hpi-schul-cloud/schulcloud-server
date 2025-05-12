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
import {
	commonCartridgeOrganizationPropsFactory,
	joinCommonCartridgeOrganizationPath,
} from '../testing/common-cartridge-parser.factory';

jest.mock('../import/common-cartridge-file-parser');

describe(CommonCartridgeImportService.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let boardsClientAdapterMock: DeepMocked<BoardsClientAdapter>;
	let columnClientAdapterMock: DeepMocked<ColumnClientAdapter>;
	let cardClientAdapterMock: DeepMocked<CardClientAdapter>;
	let commonCartridgeFileParser: DeepMocked<CommonCartridgeFileParser>;

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

	const setupBase = () => {
		const boardId = faker.string.uuid();
		const columnId = faker.string.uuid();
		const columnId2 = faker.string.uuid();
		const cardId = faker.string.uuid();
		const elementId = faker.string.uuid();
		const file = Buffer.from('');
		commonCartridgeFileParser.getTitle.mockReturnValue('test course');
		commonCartridgeFileParser.getOrganizations.mockReturnValue([
			commonCartridgeOrganizationPropsFactory.build({
				title: 'Mock Board',
				identifier: boardId,
				path: boardId,
			}),
			commonCartridgeOrganizationPropsFactory.build({
				pathDepth: 1,
				path: joinCommonCartridgeOrganizationPath(boardId, columnId),
				identifier: columnId,
			}),
			commonCartridgeOrganizationPropsFactory.build({
				pathDepth: 2,
				path: joinCommonCartridgeOrganizationPath(boardId, columnId, cardId),
				identifier: cardId,
				isResource: true,
				resourcePath: 'https://www.webcontent.html',
				resourceType: CommonCartridgeResourceTypeV1P1.WEB_CONTENT,
			}),
			commonCartridgeOrganizationPropsFactory.build({
				pathDepth: 3,
				path: joinCommonCartridgeOrganizationPath(boardId, columnId, cardId, elementId),
				identifier: elementId,
			}),
			commonCartridgeOrganizationPropsFactory.build({
				pathDepth: 1,
				path: joinCommonCartridgeOrganizationPath(boardId, columnId2),
				identifier: columnId2,
				isResource: true,
				resourcePath: faker.system.filePath(),
				resourceType: faker.lorem.word(),
			}),
			commonCartridgeOrganizationPropsFactory.build({
				pathDepth: 2,
				path: joinCommonCartridgeOrganizationPath(boardId, columnId2, cardId),
				identifier: cardId,
				isResource: true,
				resourcePath: 'https://www.weblink.com',
				resourceType: CommonCartridgeResourceTypeV1P1.WEB_LINK,
			}),
			commonCartridgeOrganizationPropsFactory.build({
				pathDepth: 3,
				path: joinCommonCartridgeOrganizationPath(boardId, columnId2, cardId, elementId),
				identifier: elementId,
			}),
			commonCartridgeOrganizationPropsFactory.build({
				pathDepth: 2,
				path: joinCommonCartridgeOrganizationPath(boardId, columnId, cardId),
				identifier: cardId,
			}),
			commonCartridgeOrganizationPropsFactory.build({
				pathDepth: 3,
				path: joinCommonCartridgeOrganizationPath(boardId, columnId, cardId, elementId),
				identifier: elementId,
			}),
		]);

		coursesClientAdapterMock.createCourse.mockResolvedValueOnce({ courseId: faker.string.uuid() });

		boardsClientAdapterMock.createBoard.mockResolvedValueOnce({ id: boardId });

		return { file };
	};

	describe('importFile', () => {
		describe('when importing a file', () => {
			const setup = () => setupBase();

			it('should create a course', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: 'test course' });
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
				expect(cardClientAdapterMock.updateCardTitle).toHaveBeenCalledTimes(2);
				expect(cardClientAdapterMock.updateCardElement).toHaveBeenCalledTimes(1);
			});

			it('should create a cards and update titles', async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(columnClientAdapterMock.createCard).toHaveBeenCalledTimes(3);
				expect(cardClientAdapterMock.updateCardTitle).toHaveBeenCalledTimes(2);
			});
		});

		describe('when no title is given', () => {
			const setup = () => {
				const { file } = setupBase();

				commonCartridgeFileParser.getTitle.mockReturnValueOnce(undefined);

				return { file };
			};

			it(`should give 'Untitled Course' as title`, async () => {
				const { file } = setup();

				await sut.importFile(file);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: 'Untitled Course' });
			});
		});
	});
});
