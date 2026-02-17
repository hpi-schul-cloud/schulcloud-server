import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CommonCartridgeUc } from './common-cartridge.uc';
import { EventBus } from '@nestjs/cqrs';
import { REQUEST } from '@nestjs/core';
import { ImportCourseEvent } from '../domain/events/import-course.event';
import { ImportCourseParams } from '../domain/import-course.params';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

describe('CommonCartridgeUc', () => {
	let module: TestingModule;
	let sut: CommonCartridgeUc;
	let commonCartridgeExportServiceMock: DeepMocked<CommonCartridgeExportService>;
	let eventBusMock: DeepMocked<EventBus>;
	let requestMock: DeepMocked<Request>;

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
			],
		}).compile();

		sut = module.get(CommonCartridgeUc);
		commonCartridgeExportServiceMock = module.get(CommonCartridgeExportService);
		eventBusMock = module.get(EventBus);
		requestMock = module.get(REQUEST);
	});

	afterAll(async () => {
		await module.close();
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
});
