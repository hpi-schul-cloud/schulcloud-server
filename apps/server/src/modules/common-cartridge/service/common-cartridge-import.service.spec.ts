import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BoardsClientAdapter } from '@infra/boards-client';
import { CardClientAdapter } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { commonCartridgeOrganizationPropsFactory as organizationFactory } from '../testing/common-cartridge-organization-props.factory';
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

		const board = organizationFactory.withIdentifier(boardId).withTitle('Mock Board').build();
		const column = organizationFactory.withIdentifier(columnId).withParent(board).build();
		const card = organizationFactory
			.withIdentifier(cardId)
			.withParent(column)
			.withWebContent('https://www.webcontent.html')
			.build();
		const element = organizationFactory.withIdentifier(elementId).withParent(card).build();
		const column2 = organizationFactory.withIdentifier(columnId2).withParent(board).withResource().build();
		const card2 = organizationFactory
			.withIdentifier(cardId)
			.withParent(column2)
			.withWebLink('https://www.weblink.com')
			.build();

		const element2 = organizationFactory.withIdentifier(elementId).withParent(card2).build();
		const card3 = organizationFactory.withIdentifier(cardId).withParent(column).build();
		const element3 = organizationFactory.withIdentifier(elementId).withParent(card3).build();

		const orgs = [board, column, card, element, column2, card2, element2, card3, element3];
		commonCartridgeFileParser.getOrganizations.mockReturnValue(orgs);

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
