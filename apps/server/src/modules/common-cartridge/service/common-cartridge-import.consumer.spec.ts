import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BoardsClientAdapter } from '@infra/boards-client';
import { CardClientAdapter } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FilesStorageClientAdapter, FilesStorageClientConfig } from '@infra/files-storage-client';
import { ImportCourseParams } from '@infra/rabbitmq';
import { HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { from } from 'rxjs';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeXmlResourceType } from '../import/common-cartridge-import.enums';
import { commonCartridgeOrganizationPropsFactory as organizationFactory } from '../testing/common-cartridge-organization-props.factory';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';
import { CommonCartridgeImportConsumer } from './common-cartridge-import.consumer';

jest.mock('../import/common-cartridge-file-parser');

describe(CommonCartridgeImportConsumer.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportConsumer;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let boardsClientAdapterMock: DeepMocked<BoardsClientAdapter>;
	let columnClientAdapterMock: DeepMocked<ColumnClientAdapter>;
	let cardClientAdapterMock: DeepMocked<CardClientAdapter>;
	let filesStorageClientAdapterMock: DeepMocked<FilesStorageClientAdapter>;
	let commonCartridgeFileParser: DeepMocked<CommonCartridgeFileParser>;
	let httpServiceMock: DeepMocked<HttpService>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeImportConsumer,
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
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						(): FilesStorageClientConfig => {
							return {
								FILES_STORAGE__SERVICE_BASE_URL: faker.internet.url(),
							};
						},
					],
				}),
			],
		}).compile();

		sut = module.get(CommonCartridgeImportConsumer);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		boardsClientAdapterMock = module.get(BoardsClientAdapter);
		columnClientAdapterMock = module.get(ColumnClientAdapter);
		cardClientAdapterMock = module.get(CardClientAdapter);
		filesStorageClientAdapterMock = module.get(FilesStorageClientAdapter);
		httpServiceMock = module.get(HttpService);

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

		const orgs = [board, column1, card1, element1, column2, card2, element2, column3, card3, element3];

		httpServiceMock.get.mockReturnValue(from([axiosResponseFactory.build({ data: file })]));

		commonCartridgeFileParser.getTitle.mockReturnValueOnce('test course');

		commonCartridgeFileParser.getOrganizations.mockReturnValue(orgs);

		coursesClientAdapterMock.createCourse.mockResolvedValueOnce({ courseId: faker.string.uuid() });

		boardsClientAdapterMock.createBoard.mockResolvedValueOnce({ id: boardId });

		commonCartridgeFileParser.getResource
			.mockReturnValueOnce({
				type: CommonCartridgeXmlResourceType.FILE_FOLDER,
				title: faker.lorem.word(),
				files: [new File([''], 'file1-folder.pdf'), new File([''], 'file2-folder.pdf')],
			})
			.mockReturnValue({
				type: CommonCartridgeXmlResourceType.FILE,
				href: faker.internet.url(),
				fileName: faker.system.fileName(),
				file: new File([''], 'file-element.pdf'),
				description: faker.lorem.sentence(),
			});

		cardClientAdapterMock.createCardElement.mockResolvedValue({
			type: 'fileFolder',
			timestamps: {
				createdAt: faker.date.past().toISOString(),
				lastUpdatedAt: faker.date.recent().toISOString(),
			},
			id: faker.string.uuid(),
			content: { title: faker.string.alpha() },
		});

		commonCartridgeFileParser.getTitle.mockReturnValue(undefined);

		const schoolId = faker.string.uuid();
		const payload: ImportCourseParams = {
			jwt: faker.internet.jwt({
				payload: {
					schoolId,
				},
			}),
			fileName: faker.system.fileName(),
			fileRecordId: faker.string.uuid(),
			fileUrl: faker.internet.url(),
		};

		return { column1, column2, card1, card2, element1, element2, board, payload, schoolId };
	};

	describe('importFile', () => {
		describe('when importing a file', () => {
			const setup = () => setupBase();

			it('should create a course', async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith(payload.jwt, {
					name: 'test course',
					color: '#455B6A',
				});
			});

			it('should create a board', async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(boardsClientAdapterMock.createBoard).toHaveBeenCalledWith(payload.jwt, {
					title: 'Mock Board',
					layout: 'columns',
					parentId: expect.any(String),
					parentType: 'course',
				});
			});

			it('should create a column', async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(boardsClientAdapterMock.createBoardColumn).toHaveBeenCalledWith(payload.jwt, expect.any(String));
				expect(boardsClientAdapterMock.createBoardColumn).toHaveBeenCalledTimes(3);
			});

			it('should update column title', async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(columnClientAdapterMock.updateBoardColumnTitle).toHaveBeenCalledTimes(3);
			});

			it('should create cards and update titles', async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(columnClientAdapterMock.createCard).toHaveBeenCalledTimes(3);
			});

			it('should create an element', async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(cardClientAdapterMock.createCardElement).toHaveBeenCalledTimes(3);
			});

			it('should upload files', async () => {
				const { payload, schoolId } = setup();

				await sut.importFile(payload);

				expect(filesStorageClientAdapterMock.upload).toHaveBeenCalledWith(
					payload.jwt,
					schoolId,
					'school',
					expect.any(String),
					'boardnodes',
					new File([''], 'file-element.pdf')
				);
			});

			it('should upload file folder', async () => {
				const { payload, schoolId } = setup();

				await sut.importFile(payload);

				expect(filesStorageClientAdapterMock.upload).toHaveBeenCalledWith(
					payload.jwt,
					schoolId,
					'school',
					expect.any(String),
					'boardnodes',
					new File([''], 'file1-folder.pdf')
				);

				expect(filesStorageClientAdapterMock.upload).toHaveBeenCalledWith(
					payload.jwt,
					schoolId,
					'school',
					expect.any(String),
					'boardnodes',
					new File([''], 'file2-folder.pdf')
				);
			});

			it('should create card element without resource', async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(cardClientAdapterMock.createCardElement).toHaveBeenCalled();
			});

			it('should delete the course file', async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(filesStorageClientAdapterMock.deleteFile).toHaveBeenCalledWith(payload.jwt, payload.fileRecordId);
			});
		});

		describe('when no title is given', () => {
			const setup = () => {
				commonCartridgeFileParser.getTitle.mockReturnValueOnce(undefined);

				return setupBase();
			};

			it(`should give 'Untitled Course' as title`, async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith(payload.jwt, {
					name: 'Untitled Course',
					color: '#455B6A',
				});
			});
		});

		describe('when no file can be retrieved', () => {
			const setup = () => {
				const setupData = setupBase();

				httpServiceMock.get.mockReturnValue(from([axiosResponseFactory.build({ data: null })]));

				return setupData;
			};

			it(`should stop processing`, async () => {
				const { payload } = setup();

				await sut.importFile(payload);

				expect(coursesClientAdapterMock.createCourse).not.toHaveBeenCalled();
			});
		});
	});
});
