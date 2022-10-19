import { Test, TestingModule } from '@nestjs/testing';
import { CourseExportUc } from './course-export.uc';

describe('CourseExportUc', () => {
	let module: TestingModule;
	let courseExportUc: CourseExportUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CourseExportUc],
		}).compile();
		courseExportUc = module.get(CourseExportUc);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('export', () => {});
});
