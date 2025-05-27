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
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { FilesStorageClientAdapter } from '@infra/files-storage-client';

jest.mock('../import/common-cartridge-file-parser');

describe(CommonCartridgeImportService.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let boardsClientAdapterMock: DeepMocked<BoardsClientAdapter>;
	let columnClientAdapterMock: DeepMocked<ColumnClientAdapter>;
	let cardClientAdapterMock: DeepMocked<CardClientAdapter>;
	let filesStorageClientAdapterMock: DeepMocked<FilesStorageClientAdapter>;
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
				{
					provide: FilesStorageClientAdapter,
					useValue: createMock<FilesStorageClientAdapter>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeImportService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		boardsClientAdapterMock = module.get(BoardsClientAdapter);
		columnClientAdapterMock = module.get(ColumnClientAdapter);
		cardClientAdapterMock = module.get(CardClientAdapter);
		filesStorageClientAdapterMock = module.get(FilesStorageClientAdapter);
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
		const columnId1 = faker.string.uuid();
		const cardId1 = faker.string.uuid();
		const elementId1 = faker.string.uuid();
		const file = Buffer.from('');

		const board = organizationFactory.withIdentifier(boardId).withTitle('Mock Board').build();
		const column1 = organizationFactory.withIdentifier(columnId1).withParent(board).build();
		const card1 = organizationFactory
			.withIdentifier(cardId1)
			.withParent(column1)
			.withTitle('card one')
			.withWebContent('https://www.webcontent.html')
			.build();
		const element1 = organizationFactory.withIdentifier(elementId1).withParent(card1).build();

		const columnId2 = faker.string.uuid();
		const column2 = organizationFactory.withIdentifier(columnId2).withParent(board).withResource().build();
		const cardId2 = faker.string.uuid();
		const card2 = organizationFactory
			.withIdentifier(cardId2)
			.withParent(column2)
			.withTitle('card two')
			.withWebLink('https://www.weblink.com')
			.build();
		const element2 = organizationFactory.withIdentifier(elementId1).withParent(card2).build();

		const cardId3 = faker.string.uuid();
		const card3 = organizationFactory.withIdentifier(cardId3).withParent(column2).withTitle('card three').build();

		const currentUser = currentUserFactory.build();

		const orgs = [board, column1, card1, element1, column2, card2, element2, card3];
		commonCartridgeFileParser.getOrganizations.mockReturnValue(orgs);

		coursesClientAdapterMock.createCourse.mockResolvedValueOnce({ courseId: faker.string.uuid() });

		boardsClientAdapterMock.createBoard.mockResolvedValueOnce({ id: boardId });

		return { file, currentUser, column1, column2, card1, card2, element1, element2 };
	};

	describe('importFile', () => {
		describe('when importing a file', () => {
			const setup = () => setupBase();

			it('should create a course', async () => {
				const { file, currentUser } = setup();
				commonCartridgeFileParser.getTitle.mockReturnValue('test course');

				await sut.importFile(file, currentUser);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: 'test course' });
			});

			it('should create a board', async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(boardsClientAdapterMock.createBoard).toHaveBeenCalledWith({
					title: 'Mock Board',
					layout: 'columns',
					parentId: expect.any(String),
					parentType: 'course',
				});
			});

			it('should create a column', async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(boardsClientAdapterMock.createBoardColumn).toHaveBeenCalledWith(expect.any(String));
				expect(boardsClientAdapterMock.createBoardColumn).toHaveBeenCalledTimes(2);
			});

			it('should update column title', async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(columnClientAdapterMock.updateBoardColumnTitle).toHaveBeenCalledTimes(2);
			});

			it('should create cards and update titles', async () => {
				const { file, currentUser, column1, card1, card2 } = setup();

				boardsClientAdapterMock.createBoardColumn.mockResolvedValueOnce({
					id: column1.identifier,
					title: column1.title,
					cards: [
						{
							cardId: card1.identifier,
							height: 100,
						},
						{
							cardId: card2.identifier,
							height: 100,
						},
					],
					timestamps: {
						lastUpdatedAt: new Date().toISOString(),
						createdAt: new Date().toISOString(),
						deletedAt: undefined,
					},
				});

				await sut.importFile(file, currentUser);

				expect(columnClientAdapterMock.createCard).toHaveBeenCalledTimes(2);
			});

			it('should create elements and update titles', async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(cardClientAdapterMock.createCardElement).toHaveBeenCalledTimes(2);
			});
		});

		describe('when no title is given', () => {
			const setup = () => {
				const { file, currentUser } = setupBase();

				commonCartridgeFileParser.getTitle.mockReturnValueOnce(undefined);

				return { file, currentUser };
			};

			it(`should give 'Untitled Course' as title`, async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: 'Untitled Course' });
			});
		});
	});
});
