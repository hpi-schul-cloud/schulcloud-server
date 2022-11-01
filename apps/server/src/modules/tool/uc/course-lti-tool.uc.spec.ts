import { Test, TestingModule } from '@nestjs/testing';
import { CourseLtiToolUc } from '@src/modules/tool/uc/course-lti-tool.uc';

describe('CourseLtiToolUc', () => {
	let module: TestingModule;
	let uc: CourseLtiToolUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CourseLtiToolUc],
		}).compile();

		uc = module.get(CourseLtiToolUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('uc should be defined', () => {
		expect(uc).toBeDefined();
	});
});
