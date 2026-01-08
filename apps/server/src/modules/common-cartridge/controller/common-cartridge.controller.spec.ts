import { LegacyLogger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { HttpStatus, StreamableFile, UnauthorizedException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CommonCartridgeController } from './common-cartridge.controller';
import { ExportCourseParams } from './dto';
import { CourseExportBodyParams } from './dto/course-export.body.params';
import { CourseQueryParams } from './dto/course.query.params';
import { CommonCartridgeStartImportBodyParams } from './dto/common-cartridge-start-import-body.params';

describe('CommonCartridgeController', () => {
	let module: TestingModule;
	let sut: CommonCartridgeController;
	let commonCartridgeUcMock: DeepMocked<CommonCartridgeUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						() => {
							return { FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: 10_000 };
						},
					],
				}),
			],
			controllers: [CommonCartridgeController],
			providers: [
				{
					provide: CommonCartridgeUc,
					useValue: createMock<CommonCartridgeUc>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeController);
		commonCartridgeUcMock = module.get(CommonCartridgeUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('exportCourse', () => {
		const setup = () => {
			const courseId = faker.string.uuid();
			const params = { courseId } as ExportCourseParams;
			const query = { version: CommonCartridgeVersion.V_1_1_0 } as CourseQueryParams;
			const body = {
				topics: [faker.string.uuid(), faker.string.uuid()],
				tasks: [faker.string.uuid()],
				columnBoards: [faker.string.uuid(), faker.string.uuid()],
			} as CourseExportBodyParams;
			const expected: CommonCartridgeExportResponse = {
				data: Readable.from(faker.lorem.paragraphs(100)),
				name: faker.string.alpha(),
			};
			const mockRequest = createMock<Request>();
			const mockResponse = createMock<Response>();

			commonCartridgeUcMock.exportCourse.mockResolvedValue(expected);

			return { params, expected, query, body, mockRequest, mockResponse };
		};

		it('should return a streamable file', async () => {
			const { params, expected, query, body, mockRequest, mockResponse } = setup();

			const result = await sut.exportCourse(params, query, body, mockRequest, mockResponse);

			expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
			expect(result).toBeInstanceOf(StreamableFile);
			expect(result.options.disposition).toBe(
				`attachment; filename="${expected.name}"; filename*=UTF-8''${expected.name}`
			);
		});
	});

	describe('importCourse', () => {
		describe('when importing a course', () => {
			const setup = () => {
				const user = currentUserFactory.build();
				const request = createMock<Request>();
				const startImportParams: CommonCartridgeStartImportBodyParams = {
					fileName: faker.system.fileName(),
					fileRecordId: faker.string.uuid(),
					fileUrl: faker.internet.url(),
				};

				request.headers.cookie = `jwt=${faker.internet.jwt()}`;

				return { user, request, startImportParams };
			};
			it('should call the uc with the correct parameters', async () => {
				const { user, request, startImportParams } = setup();

				await sut.importCourse(user, request, startImportParams);

				expect(commonCartridgeUcMock.startCourseImport).toHaveBeenCalledTimes(1);
			});
		});

		describe('when importing a course without jwt', () => {
			const setup = () => {
				const user = currentUserFactory.build();
				const request = createMock<Request>();
				const startImportParams: CommonCartridgeStartImportBodyParams = {
					fileName: faker.system.fileName(),
					fileRecordId: faker.string.uuid(),
					fileUrl: faker.internet.url(),
				};

				return { user, request, startImportParams };
			};
			it('should throw UnauthorizedException', async () => {
				const { user, request, startImportParams } = setup();

				await expect(sut.importCourse(user, request, startImportParams)).rejects.toThrow(UnauthorizedException);
			});
		});
	});
});
