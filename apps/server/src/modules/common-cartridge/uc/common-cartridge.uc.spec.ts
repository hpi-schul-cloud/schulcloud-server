import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { FileRecordParentType, FilesStorageClientAdapter, StorageLocation } from '@infra/common-cartridge-clients';
import { fileRecordResponseFactory } from '@infra/files-storage-client/testing';
import { UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import busboy from 'busboy';
import { EventEmitter } from 'events';
import { Request } from 'express';
import { PassThrough, Readable } from 'stream';
import { COMMON_CARTRIDGE_CONFIG_TOKEN } from '../common-cartridge.config';
import { ImportCourseEvent } from '../domain/events/import-course.event';
import { ImportCourseParams } from '../domain/import-course.params';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import {
	CC_VALIDATION_ERROR_EVENT,
	CcValidationErrorType,
	CommonCartridgeValidatorTransform,
} from '../util/common-cartridge-validator.transform';
import { CommonCartridgeUc } from './common-cartridge.uc';

jest.mock('busboy');
jest.mock('../util/common-cartridge-validator.transform');

describe(CommonCartridgeUc.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeUc;
	let commonCartridgeExportServiceMock: DeepMocked<CommonCartridgeExportService>;
	let eventBusMock: DeepMocked<EventBus>;
	let requestMock: DeepMocked<Request>;
	let fileClientMock: DeepMocked<FilesStorageClientAdapter>;
	let currentReqEmitter: EventEmitter | null = null;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeUc,
				{
					provide: CommonCartridgeExportService,
					useValue: createMock<CommonCartridgeExportService>(),
				},
				{
					provide: EventBus,
					useValue: createMock<EventBus>(),
				},
				{
					provide: REQUEST,
					useValue: createMock<Request>(),
				},
				{
					provide: FilesStorageClientAdapter,
					useValue: createMock<FilesStorageClientAdapter>(),
				},
				{
					provide: COMMON_CARTRIDGE_CONFIG_TOKEN,
					useValue: { courseImportMaxFileSize: 1024 * 1024 * 100 },
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeUc);
		commonCartridgeExportServiceMock = module.get(CommonCartridgeExportService);
		fileClientMock = module.get(FilesStorageClientAdapter);
		eventBusMock = module.get(EventBus);
		requestMock = module.get(REQUEST);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetAllMocks();
		jest.restoreAllMocks();

		currentReqEmitter?.removeAllListeners();
		currentReqEmitter = null;
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('exportCourse', () => {
		describe('when jwt is given', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const courseId = faker.string.uuid();
				const version = CommonCartridgeVersion.V_1_1_0;
				const topics = [faker.lorem.sentence(), faker.lorem.sentence()];
				const tasks = [faker.lorem.sentence(), faker.lorem.sentence()];
				const columnBoards = [faker.lorem.sentence(), faker.lorem.sentence()];
				const expected: CommonCartridgeExportResponse = {
					name: faker.string.alpha(),
					data: Readable.from(''),
				};

				requestMock.headers.cookie = `jwt=${jwt}`;
				commonCartridgeExportServiceMock.exportCourse.mockResolvedValue(expected);

				return { jwt, courseId, version, topics, tasks, columnBoards, expected };
			};

			it('should return a course export response with file IDs and metadata of a course', async () => {
				const { jwt, courseId, expected, version, tasks, columnBoards, topics } = setup();

				expect(await sut.exportCourse(courseId, version, topics, tasks, columnBoards)).toEqual(expected);
				expect(commonCartridgeExportServiceMock.exportCourse).toHaveBeenCalledWith(
					jwt,
					courseId,
					version,
					topics,
					tasks,
					columnBoards
				);
			});
		});

		describe('when jwt is missing in request', () => {
			const setup = () => {
				const courseId = faker.string.uuid();
				const version = CommonCartridgeVersion.V_1_1_0;
				const topics = [faker.lorem.sentence(), faker.lorem.sentence()];
				const tasks = [faker.lorem.sentence(), faker.lorem.sentence()];
				const columnBoards = [faker.lorem.sentence(), faker.lorem.sentence()];

				requestMock.headers.cookie = undefined;

				return { courseId, version, topics, tasks, columnBoards };
			};

			it('should throw UnauthorizedException', async () => {
				const { courseId, version, tasks, columnBoards, topics } = setup();

				await expect(sut.exportCourse(courseId, version, topics, tasks, columnBoards)).rejects.toThrow(
					UnauthorizedException
				);
			});
		});
	});

	describe('startCourseImport', () => {
		describe('when jwt is given', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const fileUrl = faker.internet.url();

				const params: ImportCourseParams = {
					fileRecordId,
					fileName,
					fileUrl,
				};

				requestMock.headers.cookie = `jwt=${jwt}`;

				return { params, jwt };
			};

			it('should call the import service', () => {
				const { params, jwt } = setup();

				sut.startCourseImport(params);

				expect(eventBusMock.publish).toHaveBeenCalledWith(
					new ImportCourseEvent(jwt, params.fileRecordId, params.fileName, params.fileUrl)
				);
			});
		});

		describe('when jwt is missing in request', () => {
			const setup = () => {
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const fileUrl = faker.internet.url();

				const params: ImportCourseParams = {
					fileRecordId,
					fileName,
					fileUrl,
				};

				requestMock.headers.cookie = undefined;

				return { params };
			};

			it('should throw UnauthorizedException', () => {
				const { params } = setup();

				expect(() => sut.startCourseImport(params)).toThrow(UnauthorizedException);
			});
		});
	});

	describe('uploadFileFromRequestToTemp', () => {
		const setupValidatorMock = () => {
			const mockValidator = new PassThrough();
			(CommonCartridgeValidatorTransform as unknown as jest.Mock) = jest.fn().mockImplementation(() => mockValidator);

			return mockValidator;
		};

		const createMockBusboy = () => {
			const busboyEmitter = new EventEmitter();
			(busboy as jest.Mock).mockReturnValue(busboyEmitter);

			return busboyEmitter;
		};

		const setupRequestMock = (jwt: string, complete: boolean, contentDisposition?: string) => {
			const reqEmitter = new EventEmitter();
			reqEmitter.setMaxListeners(0);
			currentReqEmitter = reqEmitter;

			requestMock.headers.cookie = `jwt=${jwt}`;
			if (contentDisposition) {
				requestMock.headers['content-disposition'] = contentDisposition;
			} else {
				requestMock.headers['content-disposition'] = undefined;
			}

			(requestMock.on as jest.Mock).mockImplementation((event: string, listener: (...args: unknown[]) => void) => {
				reqEmitter.on(event, listener);
				return requestMock;
			});
			requestMock.pipe.mockImplementation(jest.fn());
			requestMock.unpipe.mockImplementation(jest.fn());
			requestMock.complete = complete;

			return reqEmitter;
		};

		describe('when jwt is missing', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				requestMock.headers.cookie = undefined;

				return { currentUser };
			};

			it('should throw UnauthorizedException', async () => {
				const { currentUser } = setup();

				await expect(sut.uploadFileFromRequestToTemp(currentUser)).rejects.toThrow(UnauthorizedException);
			});
		});

		describe('when jwt is given and file is uploaded successfully', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const fileRecord = fileRecordResponseFactory.build();
				const busboyEmitter = createMockBusboy();
				const reqEmitter = setupRequestMock(jwt, true, 'attachment; filename="test-course.imscc"');
				setupValidatorMock();

				fileClientMock.uploadTempFile.mockResolvedValue(fileRecord);

				return { currentUser, fileRecord, busboyEmitter, reqEmitter, jwt };
			};

			it('should return the file record response', async () => {
				const { currentUser, fileRecord, busboyEmitter } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				const fileStream = new PassThrough();
				busboyEmitter.emit('file', 'file', fileStream, { filename: 'test.imscc' });
				fileStream.end();

				busboyEmitter.emit('close');

				const result = await promise;

				expect(result).toEqual(fileRecord);
				expect(requestMock.pipe).toHaveBeenCalledWith(busboyEmitter);
			});
		});

		describe('when content-disposition header is missing', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const fileRecord = fileRecordResponseFactory.build();
				const busboyEmitter = createMockBusboy();
				setupRequestMock(jwt, true);

				setupValidatorMock();

				fileClientMock.uploadTempFile.mockResolvedValue(fileRecord);

				return { currentUser, fileRecord, busboyEmitter, jwt };
			};

			it('should use default filename upload.imscc', async () => {
				const { currentUser, busboyEmitter, jwt } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				const fileStream = new PassThrough();
				busboyEmitter.emit('file', 'file', fileStream, { filename: 'test.imscc' });
				fileStream.end();
				busboyEmitter.emit('close');

				await promise;

				expect(fileClientMock.uploadTempFile).toHaveBeenCalledWith(
					jwt,
					currentUser.schoolId,
					StorageLocation.SCHOOL,
					currentUser.userId,
					FileRecordParentType.USERS,
					expect.anything(),
					'upload.imscc',
					expect.any(Number)
				);
			});
		});

		describe('when content-disposition header has no filename match', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const fileRecord = fileRecordResponseFactory.build();
				const busboyEmitter = createMockBusboy();
				setupRequestMock(jwt, true, 'attachment');
				setupValidatorMock();

				fileClientMock.uploadTempFile.mockResolvedValue(fileRecord);

				return { currentUser, fileRecord, busboyEmitter, jwt };
			};

			it('should use default filename upload.imscc', async () => {
				const { currentUser, busboyEmitter, jwt } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				const fileStream = new PassThrough();
				busboyEmitter.emit('file', 'file', fileStream, { filename: 'test.imscc' });
				fileStream.end();
				busboyEmitter.emit('close');

				await promise;

				expect(fileClientMock.uploadTempFile).toHaveBeenCalledWith(
					jwt,
					currentUser.schoolId,
					StorageLocation.SCHOOL,
					currentUser.userId,
					FileRecordParentType.USERS,
					expect.anything(),
					'upload.imscc',
					expect.any(Number)
				);
			});
		});

		describe('when request is closed prematurely', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const busboyEmitter = createMockBusboy();
				const reqEmitter = setupRequestMock(jwt, false);

				return { currentUser, busboyEmitter, reqEmitter };
			};

			it('should reject with request closed prematurely error', async () => {
				const { currentUser, reqEmitter } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				reqEmitter.emit('close');

				await expect(promise).rejects.toThrow('Request closed prematurely');
			});
		});

		describe('when request is aborted', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const busboyEmitter = createMockBusboy();
				const reqEmitter = setupRequestMock(jwt, true);

				return { currentUser, busboyEmitter, reqEmitter };
			};

			it('should reject with request aborted error', async () => {
				const { currentUser, reqEmitter } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				reqEmitter.emit('aborted');

				await expect(promise).rejects.toThrow('Request aborted by client');
			});
		});

		describe('when no file is provided', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const busboyEmitter = createMockBusboy();
				setupRequestMock(jwt, true);

				return { currentUser, busboyEmitter };
			};

			it('should reject with no file provided error', async () => {
				const { currentUser, busboyEmitter } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				busboyEmitter.emit('close');

				await expect(promise).rejects.toThrow('No file provided');
			});
		});

		describe('when file upload fails', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const busboyEmitter = createMockBusboy();
				const uploadError = new Error('Upload failed');
				setupRequestMock(jwt, true);
				setupValidatorMock();

				fileClientMock.uploadTempFile.mockRejectedValue(uploadError);

				return { currentUser, busboyEmitter, uploadError };
			};

			it('should reject with upload error', async () => {
				const { currentUser, busboyEmitter, uploadError } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				const fileStream = new PassThrough();
				busboyEmitter.emit('file', 'file', fileStream, { filename: 'test.imscc' });
				fileStream.end();
				busboyEmitter.emit('close');

				await expect(promise).rejects.toThrow(uploadError.message);
			});
		});

		describe('when validator emits NotAZipFile error', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const busboyEmitter = createMockBusboy();
				const mockValidator = setupValidatorMock();
				setupRequestMock(jwt, true);

				fileClientMock.uploadTempFile.mockImplementation(() => Promise.resolve(fileRecordResponseFactory.build()));

				return { currentUser, busboyEmitter, mockValidator };
			};

			it('should reject with not a zip archive error', async () => {
				const { currentUser, busboyEmitter, mockValidator } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				const fileStream = new PassThrough();
				busboyEmitter.emit('file', 'file', fileStream, { filename: 'test.imscc' });

				mockValidator.emit(CC_VALIDATION_ERROR_EVENT, CcValidationErrorType.NotAZipFile);

				await expect(promise).rejects.toThrow('Given file is not a zip archive');
			});
		});

		describe('when validator emits MaximumSizeExceeded error', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const busboyEmitter = createMockBusboy();
				const mockValidator = setupValidatorMock();
				setupRequestMock(jwt, true);

				fileClientMock.uploadTempFile.mockImplementation(() => Promise.resolve(fileRecordResponseFactory.build()));

				return { currentUser, busboyEmitter, mockValidator };
			};

			it('should reject with maximum file size exceeded error', async () => {
				const { currentUser, busboyEmitter, mockValidator } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				const fileStream = new PassThrough();
				busboyEmitter.emit('file', 'file', fileStream, { filename: 'test.imscc' });

				mockValidator.emit(CC_VALIDATION_ERROR_EVENT, CcValidationErrorType.MaximumSizeExceeded);

				await expect(promise).rejects.toThrow('Maximum file size exceeded');
			});
		});

		describe('when isResolved is already true during close event', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const fileRecord = fileRecordResponseFactory.build();
				const busboyEmitter = createMockBusboy();
				setupRequestMock(jwt, true);
				setupValidatorMock();

				fileClientMock.uploadTempFile.mockResolvedValue(fileRecord);

				return { currentUser, fileRecord, busboyEmitter };
			};

			it('should only resolve once even if close is called multiple times', async () => {
				const { currentUser, fileRecord, busboyEmitter } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				const fileStream = new PassThrough();
				busboyEmitter.emit('file', 'file', fileStream, { filename: 'test.imscc' });
				fileStream.end();

				busboyEmitter.emit('close');
				busboyEmitter.emit('close');

				const result = await promise;

				expect(result).toEqual(fileRecord);
			});
		});

		describe('when fileRecordPromise catch handler is triggered', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const currentUser = currentUserFactory.build();
				const busboyEmitter = createMockBusboy();
				const uploadError = new Error('Upload failed in catch');
				setupRequestMock(jwt, true);
				setupValidatorMock();

				fileClientMock.uploadTempFile.mockImplementation(() => Promise.reject(uploadError));

				return { currentUser, busboyEmitter, uploadError };
			};

			it('should reject via the catch handler', async () => {
				const { currentUser, busboyEmitter, uploadError } = setup();

				const promise = sut.uploadFileFromRequestToTemp(currentUser);

				const fileStream = new PassThrough();
				busboyEmitter.emit('file', 'file', fileStream, { filename: 'test.imscc' });
				fileStream.end();

				await expect(promise).rejects.toThrow(uploadError);
			});
		});
	});
});
