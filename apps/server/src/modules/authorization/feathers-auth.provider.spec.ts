import { Test, TestingModule } from '@nestjs/testing';
import { FeathersModule } from '../feathers/feathers.module';
import { FeathersAuthProvider } from './feathers-auth.provider';

describe('FeathersAuthProvider', () => {
	let provider: FeathersAuthProvider;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [FeathersModule],
			providers: [FeathersAuthProvider],
		}).compile();

		provider = await module.resolve<FeathersAuthProvider>(FeathersAuthProvider);
	});

	it('should be defined', () => {
		expect(provider).toBeDefined();
	});
});
