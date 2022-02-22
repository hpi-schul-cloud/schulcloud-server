import { Test, TestingModule } from '@nestjs/testing';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { ObjectId } from '@mikro-orm/mongodb';
import { FeathersJwtProvider } from './feathers-jwt.provider';

describe('FeathersJwtProvider', () => {
	let jwtProvider: FeathersJwtProvider;

	let feathersJWTService;
	const userId = new ObjectId().toHexString();
	const defaultJWT = 'JWT.JWT.JWT';

	beforeEach(async () => {
		feathersJWTService = {
			create: jest.fn((data, params) => {
				const createdJWT = data && params ? defaultJWT : null;
				return Promise.resolve(createdJWT);
			}),
		};
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FeathersJwtProvider,
				{
					provide: FeathersServiceProvider,
					useValue: {
						getService(name) {
							if (name === 'accounts/supportJWT') {
								// eslint-disable-next-line @typescript-eslint/no-unsafe-return
								return feathersJWTService;
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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(feathersJWTService.create).toHaveBeenCalled();
		});
	});
});
