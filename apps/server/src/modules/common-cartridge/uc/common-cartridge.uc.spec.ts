import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeProducer } from '../service';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CommonCartridgeUc } from './common-cartridge.uc';

describe('CommonCartridgeUc', () => {
	let module: TestingModule;
	let sut: CommonCartridgeUc;
	let commonCartridgeExportServiceMock: DeepMocked<CommonCartridgeExportService>;
	let commonCartridgeProducerMock: DeepMocked<CommonCartridgeProducer>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeUc,
				{
					provide: CommonCartridgeExportService,
					useValue: createMock<CommonCartridgeExportService>(),
				},
				{
					provide: CommonCartridgeProducer,
					useValue: createMock<CommonCartridgeProducer>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeUc);
		commonCartridgeExportServiceMock = module.get(CommonCartridgeExportService);
		commonCartridgeProducerMock = module.get(CommonCartridgeProducer);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('exportCourse', () => {
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

			commonCartridgeExportServiceMock.exportCourse.mockResolvedValue(expected);

			return { jwt, courseId, version, topics, tasks, columnBoards, expected };
		};

		it('should return a course export response with file IDs and metadata of a course', async () => {
			const { jwt, courseId, expected, version, tasks, columnBoards, topics } = setup();

			expect(await sut.exportCourse(jwt, courseId, version, topics, tasks, columnBoards)).toEqual(expected);
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

	describe('importCourse', () => {
		const setup = () => {
			const jwt = faker.internet.jwt();
			const fileRecordId = faker.string.uuid();
			const fileName = faker.system.fileName();
			const fileUrl = faker.internet.url();

			return { jwt, fileRecordId, fileName, fileUrl };
		};

		it('should call the import service', async () => {
			const { jwt, fileRecordId, fileName, fileUrl } = setup();

			await sut.startCourseImport(jwt, fileRecordId, fileName, fileUrl);

			expect(commonCartridgeProducerMock.importCourse).toHaveBeenCalledWith({
				jwt,
				fileRecordId,
				fileName,
				fileUrl,
			});
		});
	});
});
