import { Test, TestingModule } from '@nestjs/testing';
import { SuperheroLtiToolUc } from '@src/modules/tool/uc/superhero-lti-tool.uc';

describe('SuperheroLtiToolUc', () => {
	let module: TestingModule;
	let uc: SuperheroLtiToolUc;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [SuperheroLtiToolUc],
		}).compile();

		uc = module.get(SuperheroLtiToolUc);
	});

	afterAll(async () => {
		await module.close();
	});

	it('uc should be defined', () => {
		expect(uc).toBeDefined();
	});
});
