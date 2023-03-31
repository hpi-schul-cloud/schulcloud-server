import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { FeathersServiceProvider } from '@shared/infra/feathers/feathers-service.provider';
import { FeathersJwtProvider } from './feathers-jwt.provider';

describe('FeathersJwtProvider', () => {
	let jwtProvider: FeathersJwtProvider;
	let module: TestingModule;
	let feathersJWTService;
	const userId = new ObjectId().toHexString();
	const defaultJWT = 'JWT.JWT.JWT';

	beforeAll(async () => {
		feathersJWTService = {
			create: jest.fn((data, params) => {
				const createdJWT = data && params ? defaultJWT : null;
				return Promise.resolve(createdJWT);
			}),
		};
		module = await Test.createTestingModule({
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

	afterAll(async () => {
		await module.close();
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
