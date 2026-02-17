import { DomainErrorHandler } from '@core/error';
import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BoardsClientAdapter } from '@infra/boards-client';
import { CardClientAdapter } from '@infra/cards-client';
import { ColumnClientAdapter } from '@infra/column-client';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FilesStorageClientAdapter } from '@infra/files-storage-client';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import axios, { InternalAxiosRequestConfig } from 'axios';
import { from } from 'rxjs';
import { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeXmlResourceType } from '../import/common-cartridge-import.enums';
import { commonCartridgeOrganizationPropsFactory as organizationFactory } from '../testing/common-cartridge-organization-props.factory';
import { CommonCartridgeImportService } from './common-cartridge-import.service';
import { CommonCartridgeImportMapper } from './common-cartridge-import.mapper';
import { ImportCourseEvent } from '../domain/events/import-course.event';

jest.mock('../import/common-cartridge-file-parser');
jest.mock('axios');

describe(CommonCartridgeImportService.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let boardsClientAdapterMock: DeepMocked<BoardsClientAdapter>;
	let columnClientAdapterMock: DeepMocked<ColumnClientAdapter>;
	let cardClientAdapterMock: DeepMocked<CardClientAdapter>;
	let filesStorageClientAdapterMock: DeepMocked<FilesStorageClientAdapter>;
	let commonCartridgeFileParser: DeepMocked<CommonCartridgeFileParser>;
	let httpServiceMock: DeepMocked<HttpService>;
	let domainErrorHandler: DeepMocked<DomainErrorHandler>;

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
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeImportService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		boardsClientAdapterMock = module.get(BoardsClientAdapter);
		columnClientAdapterMock = module.get(ColumnClientAdapter);
		cardClientAdapterMock = module.get(CardClientAdapter);
		filesStorageClientAdapterMock = module.get(FilesStorageClientAdapter);
		httpServiceMock = module.get(HttpService);
		domainErrorHandler = module.get(DomainErrorHandler);

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
		const event: ImportCourseEvent = {
			jwt: faker.internet.jwt({
				payload: {
					schoolId,
				},
			}),
			fileName: faker.system.fileName(),
			fileRecordId: faker.string.uuid(),
			fileUrl: faker.internet.url(),
		};

		return { column1, column2, card1, card2, element1, element2, board, event, schoolId };
	};

	describe('importFile', () => {
		describe('when importing a file', () => {
			const setup = () => setupBase();

			it('should create a course', async () => {
				const { event } = setup();

				await sut.importCourse(event);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith(event.jwt, {
					name: 'test course',
					color: '#455B6A',
				});
			});

			it('should create a board', async () => {
				const { event } = setup();

				await sut.importCourse(event);

				expect(boardsClientAdapterMock.createBoard).toHaveBeenCalledWith(event.jwt, {
					title: 'Mock Board',
					layout: 'columns',
					parentId: expect.any(String),
					parentType: 'course',
				});
			});

			it('should create a column', async () => {
				const { event } = setup();

				await sut.importCourse(event);

				expect(boardsClientAdapterMock.createBoardColumn).toHaveBeenCalledWith(event.jwt, expect.any(String));
				expect(boardsClientAdapterMock.createBoardColumn).toHaveBeenCalledTimes(3);
			});

			it('should update column title', async () => {
				const { event } = setup();

				await sut.importCourse(event);

				expect(columnClientAdapterMock.updateBoardColumnTitle).toHaveBeenCalledTimes(3);
			});

			it('should create cards and update titles', async () => {
				const { event } = setup();

				await sut.importCourse(event);

				expect(columnClientAdapterMock.createCard).toHaveBeenCalledTimes(3);
			});

			it('should create an element', async () => {
				const { event } = setup();

				await sut.importCourse(event);

				expect(cardClientAdapterMock.createCardElement).toHaveBeenCalledTimes(3);
			});

			it('should upload files', async () => {
				const { event, schoolId } = setup();

				await sut.importCourse(event);

				expect(filesStorageClientAdapterMock.upload).toHaveBeenCalledWith(
					event.jwt,
					schoolId,
					'school',
					expect.any(String),
					'boardnodes',
					new File([''], 'file-element.pdf')
				);
			});

			it('should upload file folder', async () => {
				const { event, schoolId } = setup();

				await sut.importCourse(event);

				expect(filesStorageClientAdapterMock.upload).toHaveBeenCalledWith(
					event.jwt,
					schoolId,
					'school',
					expect.any(String),
					'boardnodes',
					new File([''], 'file1-folder.pdf')
				);

				expect(filesStorageClientAdapterMock.upload).toHaveBeenCalledWith(
					event.jwt,
					schoolId,
					'school',
					expect.any(String),
					'boardnodes',
					new File([''], 'file2-folder.pdf')
				);
			});

			it('should create card element without resource', async () => {
				const { event } = setup();

				await sut.importCourse(event);

				expect(cardClientAdapterMock.createCardElement).toHaveBeenCalled();
			});

			it('should delete the course file', async () => {
				const { event } = setup();

				await sut.importCourse(event);

				expect(filesStorageClientAdapterMock.deleteFile).toHaveBeenCalledWith(event.jwt, event.fileRecordId);
			});
		});

		describe('when no title is given', () => {
			const setup = () => {
				commonCartridgeFileParser.getTitle.mockReturnValueOnce(undefined);

				return setupBase();
			};

			it(`should give 'Untitled Course' as title`, async () => {
				const { event } = setup();

				await sut.importCourse(event);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith(event.jwt, {
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
				const { event } = setup();

				await sut.importCourse(event);

				expect(coursesClientAdapterMock.createCourse).not.toHaveBeenCalled();
			});
		});

		describe('when axios interceptors are registered', () => {
			const setup = () => {
				const setupData = setupBase();

				const useSpyRequest = jest.spyOn(axios.interceptors.request, 'use');
				const useSpyResponse = jest.spyOn(axios.interceptors.response, 'use');
				const ejectSpyRequest = jest.spyOn(axios.interceptors.request, 'eject');
				const ejectSpyResponse = jest.spyOn(axios.interceptors.response, 'eject');

				// [useSpyRequest, useSpyResponse, ejectSpyRequest, ejectSpyResponse].forEach((mock) => mock.mockClear());

				return { ...setupData, useSpyRequest, useSpyResponse, ejectSpyRequest, ejectSpyResponse };
			};

			it(`should create request and response handlers`, async () => {
				const { event, useSpyRequest, useSpyResponse } = setup();

				await sut.importCourse(event);

				expect(useSpyRequest).toHaveBeenCalled();
				expect(useSpyResponse).toHaveBeenCalled();
			});

			it(`should eject request and response handlers`, async () => {
				const { event, ejectSpyRequest, ejectSpyResponse } = setup();

				await sut.importCourse(event);

				expect(ejectSpyRequest).toHaveBeenCalled();
				expect(ejectSpyResponse).toHaveBeenCalled();
			});

			it(`should passthrough request config`, async () => {
				const { event, useSpyRequest } = setup();

				await sut.importCourse(event);

				const configInterceptor = useSpyRequest.mock.calls[0][0];

				if (!configInterceptor) {
					fail(`Can't find config interceptor`);
				}

				const config = {
					headers: {
						'Content-Type': 'test',
					},
				} as InternalAxiosRequestConfig;

				const result = configInterceptor(config);
				expect(result).toStrictEqual(config);
			});

			it(`should passthrough response`, async () => {
				const { event, useSpyResponse } = setup();

				await sut.importCourse(event);

				const responseInterceptor = useSpyResponse.mock.calls[1][0];

				if (!responseInterceptor) {
					fail(`Can't find response interceptor`);
				}

				const response = axiosResponseFactory.build();

				const result = responseInterceptor(response);
				expect(result).toStrictEqual(response);
			});

			it(`should passthrough request error and call domainErrorHandler`, async () => {
				const { event, useSpyRequest } = setup();

				await sut.importCourse(event);

				const errorInterceptor = useSpyRequest.mock.calls[0][1];

				if (!errorInterceptor) {
					fail(`Can't find error interceptor`);
				}

				const err = new Error('Test');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const result = errorInterceptor(err);
				expect(result).toStrictEqual(err);

				expect(domainErrorHandler.exec).toHaveBeenCalledWith(err);
			});

			it(`should passthrough response error and call domainErrorHandler`, async () => {
				const { event, useSpyResponse } = setup();

				await sut.importCourse(event);

				const errorInterceptor = useSpyResponse.mock.calls[1][1];

				if (!errorInterceptor) {
					fail(`Can't find error interceptor`);
				}

				const err = new Error('Test');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const result = errorInterceptor(err);
				expect(result).toStrictEqual(err);

				expect(domainErrorHandler.exec).toHaveBeenCalledWith(err);
			});
		});
	});
});
