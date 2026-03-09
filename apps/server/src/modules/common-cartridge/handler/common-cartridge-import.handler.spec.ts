import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportCourseEvent } from '../domain/events/import-course.event';
import { CommonCartridgeImportService } from '../service';
import { CommonCartridgeImportHandler } from './common-cartridge-import.handler';

describe(CommonCartridgeImportHandler.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportHandler;
	let importServiceMock: DeepMocked<CommonCartridgeImportService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeImportHandler,
				{
					provide: CommonCartridgeImportService,
					useValue: createMock<CommonCartridgeImportService>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeImportHandler);
		importServiceMock = module.get(CommonCartridgeImportService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('handle', () => {
		describe('when called for an event', () => {
			const setup = () => {
				const jwt = faker.internet.jwt();
				const fileRecordId = faker.string.uuid();
				const fileName = faker.system.fileName();
				const fileUrl = faker.internet.url();

				const event = new ImportCourseEvent(jwt, fileRecordId, fileName, fileUrl);

				return { event };
			};

			it('should delegate to the import service', async () => {
				const { event } = setup();

				await sut.handle(event);

				expect(importServiceMock.importCourse).toHaveBeenCalledWith(event);
			});
		});
	});
});
