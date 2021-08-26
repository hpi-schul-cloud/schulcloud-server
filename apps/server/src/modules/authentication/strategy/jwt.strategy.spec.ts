import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../constants';
import { UserFacade } from '../../user';
import { JwtStrategy } from './jwt.strategy';
import { JwtValidationAdapter } from './jwt-validation.adapter';
import { JwtPayload } from '../interface/jwt-payload';
import { ICurrentUser } from '../../../shared/domain';
import { ResolvedUser } from '../../user/controller/dto';

describe('jwt strategy', () => {
	let adapter: JwtValidationAdapter;
	let strategy: JwtStrategy;
	let facade: UserFacade;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [PassportModule, JwtModule.register(jwtConstants)],
			providers: [
				JwtStrategy,
				{
					provide: JwtValidationAdapter,
					useValue: {
						isWhitelisted(accountId: string, jti: string) {
							return Promise.resolve();
						},
					},
				},
				{
					provide: UserFacade,
					useValue: {
						resolveUser(payload: ICurrentUser) {
							return new ResolvedUser();
						},
					},
				},
			],
		}).compile();

		strategy = module.get<JwtStrategy>(JwtStrategy);
		facade = module.get<UserFacade>(UserFacade);
		adapter = module.get<JwtValidationAdapter>(JwtValidationAdapter);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(strategy).toBeDefined();
		expect(adapter).toBeDefined();
		expect(facade).toBeDefined();
	});

	describe('when authenticate a user with jwt', () => {
		it('should check jwt for being whitelisted', async () => {
			const accountId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			const isWhitelistedSpy = jest.spyOn(adapter, 'isWhitelisted');
			await strategy.validate({ accountId, jti } as JwtPayload);
			expect(isWhitelistedSpy).toHaveBeenCalledWith(accountId, jti);
		});
		it('should load the defined user', async () => {
			const accountId = new ObjectId().toHexString();
			const jti = new ObjectId().toHexString();
			const resolveUserSpy = jest.spyOn(facade, 'resolveUser');
			const payload = { accountId, jti } as JwtPayload;
			await strategy.validate(payload);
			expect(resolveUserSpy).toHaveBeenCalledWith(payload);
		});
	});
});
