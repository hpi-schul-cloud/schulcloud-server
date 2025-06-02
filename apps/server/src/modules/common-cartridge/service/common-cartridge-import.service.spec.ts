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
import { CommonCartridgeResourceTypeV1P1 } from '../import/common-cartridge-import.enums';

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
				{
					provide: CommonCartridgeFileParser,
					useValue: createMock<CommonCartridgeFileParser>(),
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

		const columnId3 = faker.string.uuid();
		const column3 = organizationFactory.withIdentifier(columnId3).withParent(board).build();
		const cardId3 = faker.string.uuid();
		const card3 = organizationFactory.withIdentifier(cardId3).withParent(column3).build();
		card3.isResource = false;
		card3.pathDepth = 2;
		const element3 = organizationFactory.withIdentifier(faker.string.uuid()).withParent(card3).build();
		element3.isResource = true;
		element3.pathDepth = 3;

		const currentUser = currentUserFactory.build();

		const orgs = [board, column1, card1, element1, column2, card2, element2, column3, card3, element3];

		commonCartridgeFileParser.getTitle.mockReturnValueOnce('test course');

		commonCartridgeFileParser.getOrganizations.mockReturnValue(orgs);

		coursesClientAdapterMock.createCourse.mockResolvedValueOnce({ courseId: faker.string.uuid() });

		boardsClientAdapterMock.createBoard.mockResolvedValueOnce({ id: boardId });

		commonCartridgeFileParser.getResource.mockReturnValue({
			type: CommonCartridgeResourceTypeV1P1.FILE,
			href: faker.internet.url(),
			fileName: faker.system.fileName(),
			file: new File([''], 'file.pdf', { type: faker.system.mimeType() }),
			description: faker.lorem.sentence(),
		});

		commonCartridgeFileParser.getTitle.mockReturnValue(undefined);

		return { file, currentUser, column1, column2, card1, card2, element1, element2, board };
	};

	describe('importFile', () => {
		describe('when importing a file', () => {
			const setup = () => setupBase();

			it('should create a course', async () => {
				const { file, currentUser } = setup();

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
				expect(boardsClientAdapterMock.createBoardColumn).toHaveBeenCalledTimes(3);
			});

			it('should update column title', async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(columnClientAdapterMock.updateBoardColumnTitle).toHaveBeenCalledTimes(3);
			});

			it('should create cards and update titles', async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(columnClientAdapterMock.createCard).toHaveBeenCalledTimes(3);
			});

			it('should create an element', async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(cardClientAdapterMock.createCardElement).toHaveBeenCalledTimes(3);
			});

			it('should upload files', async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(filesStorageClientAdapterMock.upload).toHaveBeenCalled();
			});

			it('should create card element without resource', async () => {
				const { file, currentUser } = setup();

				await sut.importFile(file, currentUser);

				expect(cardClientAdapterMock.createCardElement).toHaveBeenCalled();
			});
		});

		describe('when no title is given', () => {
			const setup = () => {
				commonCartridgeFileParser.getTitle.mockReturnValueOnce(undefined)
				const { file, currentUser } = setupBase();

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
