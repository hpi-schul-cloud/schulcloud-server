import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CommonCartridgeUc } from './common-cartridge.uc';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeImportService } from '../service';
import { currentUserFactory } from '@testing/factory/currentuser.factory';

describe('CommonCartridgeUc', () => {
	let module: TestingModule;
	let sut: CommonCartridgeUc;
	let commonCartridgeExportServiceMock: DeepMocked<CommonCartridgeExportService>;
	let commonCartridgeImportServiceMock: DeepMocked<CommonCartridgeImportService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeUc,
				{
					provide: CommonCartridgeExportService,
					useValue: createMock<CommonCartridgeExportService>(),
				},
				{
					provide: CommonCartridgeImportService,
					useValue: createMock<CommonCartridgeImportService>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeUc);
		commonCartridgeExportServiceMock = module.get(CommonCartridgeExportService);
		commonCartridgeImportServiceMock = module.get(CommonCartridgeImportService);
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

	describe('importCourse', () => {
		const setup = () => {
			const file = Buffer.from(faker.lorem.paragraphs());
			const currentUser = currentUserFactory.build();

			return { file, currentUser };
		};

		it('should call the import service', async () => {
			const { file, currentUser } = setup();

			await sut.importCourse(file, currentUser);

			expect(commonCartridgeImportServiceMock.importFile).toHaveBeenCalledWith(file, currentUser);
		});
	});
});
