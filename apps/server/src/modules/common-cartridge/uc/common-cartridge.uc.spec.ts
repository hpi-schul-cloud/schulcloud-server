import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CommonCartridgeUc } from './common-cartridge.uc';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';

describe('CommonCartridgeUc', () => {
	let module: TestingModule;
	let sut: CommonCartridgeUc;
	let commonCartridgeExportServiceMock: DeepMocked<CommonCartridgeExportService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeUc,
				{
					provide: CommonCartridgeExportService,
					useValue: createMock<CommonCartridgeExportService>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeUc);
		commonCartridgeExportServiceMock = module.get(CommonCartridgeExportService);
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
			const version = CommonCartridgeVersion.V_1_1_0;
			const topics = [faker.lorem.sentence(), faker.lorem.sentence()];
			const tasks = [faker.lorem.sentence(), faker.lorem.sentence()];
			const columnBoards = [faker.lorem.sentence(), faker.lorem.sentence()];
			const expected = Buffer.alloc(0);

			commonCartridgeExportServiceMock.exportCourse.mockResolvedValue(expected);

			return { courseId, version, topics, tasks, columnBoards, expected };
		};

		it('should return a course export response with file IDs and metadata of a course', async () => {
			const { courseId, expected, version, tasks, columnBoards, topics } = setup();

			expect(await sut.exportCourse(courseId, version, topics, tasks, columnBoards)).toEqual(expected);
			expect(commonCartridgeExportServiceMock.exportCourse).toHaveBeenCalledWith(
				courseId,
				version,
				topics,
				tasks,
				columnBoards
			);
		});
	});
});
