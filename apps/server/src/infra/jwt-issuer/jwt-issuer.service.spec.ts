import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { JwtPayloadBuilder } from '@infra/auth-guard';
import { JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { JwtIssuerService } from './jwt-issuer.service';

describe(JwtIssuerService.name, () => {
	let module: TestingModule;
	let service: JwtIssuerService;

	let jwtService: DeepMocked<JwtService>;
	let jwtWhitelistAdapter: DeepMocked<JwtWhitelistAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				JwtIssuerService,
				{
					provide: JwtService,
					useValue: createMock<JwtService>(),
				},
				{
					provide: JwtWhitelistAdapter,
					useValue: createMock<JwtWhitelistAdapter>(),
				},
			],
		}).compile();

		service = module.get(JwtIssuerService);
		jwtService = module.get(JwtService);
		jwtWhitelistAdapter = module.get(JwtWhitelistAdapter);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('generateJwtAndAddToWhitelist', () => {
		describe('when a payload is given', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const payload = new JwtPayloadBuilder(currentUser).build();
				const expiresIn = 150;
				const jwt = 'jwt';

				jwtService.sign.mockReturnValueOnce(jwt);

				return { payload, expiresIn, jwt };
			};

			it('should sign the payload with the account as subject, a token id and the lifetime', async () => {
				const { payload, expiresIn } = setup();

				await service.generateJwtAndAddToWhitelist(payload, expiresIn);

				expect(jwtService.sign).toHaveBeenCalledWith(payload, {
					subject: payload.accountId,
					jwtid: expect.any(String),
					expiresIn,
				});
			});

			it('should add the token id of the jwt to the whitelist', async () => {
				const { payload, expiresIn } = setup();

				await service.generateJwtAndAddToWhitelist(payload, expiresIn);

				const jwtid = jwtService.sign.mock.calls[0][1]?.jwtid;
				expect(jwtid).toEqual(expect.any(String));
				expect(jwtWhitelistAdapter.addToWhitelist).toHaveBeenCalledWith(payload.accountId, jwtid);
			});

			it('should return the jwt', async () => {
				const { payload, expiresIn, jwt } = setup();

				const result = await service.generateJwtAndAddToWhitelist(payload, expiresIn);

				expect(result).toEqual(jwt);
			});
		});

		describe('when a prefix for the token id is given', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const payload = new JwtPayloadBuilder(currentUser).build();
				const expiresIn = 150;
				const jtiPrefix = 'prefix_';

				jwtService.sign.mockReturnValueOnce('jwt');

				return { payload, expiresIn, jtiPrefix };
			};

			it('should add a token id with the prefix to the whitelist', async () => {
				const { payload, expiresIn, jtiPrefix } = setup();

				await service.generateJwtAndAddToWhitelist(payload, expiresIn, jtiPrefix);

				const jwtid = jwtService.sign.mock.calls[0][1]?.jwtid;
				expect(jwtid).toEqual(expect.stringMatching(new RegExp(`^${jtiPrefix}.+`)));
				expect(jwtWhitelistAdapter.addToWhitelist).toHaveBeenCalledWith(payload.accountId, jwtid);
			});
		});
	});
});
