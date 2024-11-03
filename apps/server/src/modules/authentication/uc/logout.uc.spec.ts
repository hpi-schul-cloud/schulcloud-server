import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { currentUserFactory, JwtTestFactory } from '@shared/testing';
import { AuthenticationService } from '../services';
import { LogoutUc } from './logout.uc';

describe(LogoutUc.name, () => {
	let module: TestingModule;
	let logoutUc: LogoutUc;

	let authenticationService: DeepMocked<AuthenticationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LogoutUc,
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
			],
		}).compile();

		logoutUc = await module.get(LogoutUc);
		authenticationService = await module.get(AuthenticationService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('logout', () => {
		describe('when a jwt is given', () => {
			const setup = () => {
				const jwt = JwtTestFactory.createJwt();

				return {
					jwt,
				};
			};

			it('should remove the user from the whitelist', async () => {
				const { jwt } = setup();

				await logoutUc.logout(jwt);

				expect(authenticationService.removeJwtFromWhitelist).toHaveBeenCalledWith(jwt);
			});
		});
	});

	describe('externalSystemLogout', () => {
		describe('when the current user provided is signed in from an external system', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build({ isExternalUser: true });

				return {
					currentUser,
				};
			};

			it('should log out the user from the external system', async () => {
				const { currentUser } = setup();

				await logoutUc.externalSystemLogout(currentUser);

				expect(authenticationService.logoutFromExternalSystem).toHaveBeenCalledWith(
					currentUser.userId,
					currentUser.systemId
				);
			});
		});

		describe('when the current user provided is not signed in from an external system', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build({ isExternalUser: false, systemId: undefined });

				return {
					currentUser,
				};
			};

			it('should not log out the user from the external system', async () => {
				const { currentUser } = setup();

				await logoutUc.externalSystemLogout(currentUser);

				expect(authenticationService.logoutFromExternalSystem).not.toHaveBeenCalled();
			});
		});
	});
});
