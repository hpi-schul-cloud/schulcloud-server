import { Test, TestingModule } from '@nestjs/testing';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { FeathersJwtProvider } from './feathers-jwt.provider';

describe('FeathersJwtProvider', () => {
	let jwtProvider: FeathersJwtProvider;

	const userId = new ObjectId().toHexString();
	const defaultJWT = 'JWT.JWT.JWT';

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FeathersJwtProvider,
				{
					provide: FeathersServiceProvider,
					useValue: {
						getService(name) {
							if (name === 'accounts/supportJWT') {
								return {
									create(data, params) {
										const createdJWT = data && params ? defaultJWT : null;
										return Promise.resolve(createdJWT);
									},
								};
							}
							return {};
						},
					},
				},
			],
		}).compile();

		jwtProvider = await module.resolve<FeathersJwtProvider>(FeathersJwtProvider);
	});

	it('should be defined', () => {
		expect(jwtProvider).toBeDefined();
	});

	describe('generateJwt', () => {
		it('should return a JWT', async () => {
			const jwt = await jwtProvider.generateJwt(userId);
			expect(jwt).toBe(defaultJWT);
		});
	});
});
