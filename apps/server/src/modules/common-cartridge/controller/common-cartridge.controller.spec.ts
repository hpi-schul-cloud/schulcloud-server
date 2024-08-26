import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CommonCartridgeController } from './common-cartridge.controller';
import { CourseFileIdsResponse, ExportCourseParams } from './dto';

describe('CommonCartridgeController', () => {
	let module: TestingModule;
	let sut: CommonCartridgeController;
	let commonCartridgeUcMock: DeepMocked<CommonCartridgeUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			controllers: [CommonCartridgeController],
			providers: [
				{
					provide: CommonCartridgeUc,
					useValue: createMock<CommonCartridgeUc>(),
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
			const request = new ExportCourseParams();
			const expected = new CourseFileIdsResponse([]);

			Reflect.set(request, 'parentId', courseId);
			commonCartridgeUcMock.exportCourse.mockResolvedValue(expected);

			return { request, expected };
		};

		it('should return a list of found FileRecords', async () => {
			const { request, expected } = setup();

			const result = await sut.exportCourse(request);

			expect(result).toEqual(expected);
		});
	});
});
