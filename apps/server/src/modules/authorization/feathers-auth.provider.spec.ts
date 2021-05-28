import { Test, TestingModule } from '@nestjs/testing';
import { FeathersAuthProvider } from './feathers-auth.provider';

describe('FeathersAuthProvider', () => {
	let provider: FeathersAuthProvider;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [FeathersAuthProvider],
		}).compile();

		provider = await module.resolve<FeathersAuthProvider>(FeathersAuthProvider);
	});

	it('should be defined', () => {
		expect(provider).toBeDefined();
	});
});
