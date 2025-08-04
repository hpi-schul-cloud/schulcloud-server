import { Action, AuthorizationContext } from '@modules/authorization';
import { authorizationContextFactory } from '@modules/authorization/testing';
import { Permission } from '@shared/domain/interface';

describe('AuthorizationContext', () => {
	describe('constructor', () => {
		afterEach(() => {
			jest.resetAllMocks();
		});

		describe('when valid props are provided', () => {
			it('should assign action and requiredPermissions', () => {
				const authorizationContextProps = authorizationContextFactory.build();

				const vo = new AuthorizationContext(authorizationContextProps);

				expect(vo.action).toBe(authorizationContextProps.action);
				expect(vo.requiredPermissions).toEqual(authorizationContextProps.requiredPermissions);
			});
		});

		describe('when props are missing required fields', () => {
			it('should throw when action is missing', () => {
				const props = {};

				expect(() => new AuthorizationContext(props as AuthorizationContext)).toThrow();
			});
		});

		describe('when props are not an object', () => {
			it('should throw when props is null', () => {
				const props = null;

				expect(() => new AuthorizationContext(props as unknown as AuthorizationContext)).toThrow();
			});
		});

		describe('when props is undefined', () => {
			it('should throw when props is undefined', () => {
				const props = undefined;

				expect(() => new AuthorizationContext(props as unknown as AuthorizationContext)).toThrow();
			});
		});

		describe('when props is a primitive', () => {
			it('should throw when props is a string', () => {
				expect(() => new AuthorizationContext('invalid' as unknown as AuthorizationContext)).toThrow();
			});

			it('should throw when props is a number', () => {
				expect(() => new AuthorizationContext(123 as unknown as AuthorizationContext)).toThrow();
			});

			it('should throw when props is a boolean', () => {
				expect(() => new AuthorizationContext(true as unknown as AuthorizationContext)).toThrow();
			});
		});

		describe('when action is invalid', () => {
			it('should throw when action is undefined', () => {
				const props = { requiredPermissions: [Permission.ACCOUNT_CREATE] };

				expect(() => new AuthorizationContext(props as AuthorizationContext)).toThrow();
			});

			it('should throw when action is not a valid enum value', () => {
				const props = { action: 'invalid', requiredPermissions: [Permission.ACCOUNT_CREATE] };

				expect(() => new AuthorizationContext(props as AuthorizationContext)).toThrow();
			});
		});

		describe('when requiredPermissions is invalid', () => {
			it('should throw when requiredPermissions is undefined', () => {
				const props = { action: Action.read };

				expect(() => new AuthorizationContext(props as AuthorizationContext)).toThrow();
			});

			it('should throw when requiredPermissions is not an array', () => {
				const props = { action: Action.read, requiredPermissions: 'not-an-array' };

				expect(() => new AuthorizationContext(props as unknown as AuthorizationContext)).toThrow();
			});

			it('should throw when requiredPermissions contains invalid values', () => {
				const props = { action: Action.read, requiredPermissions: ['invalid'] };

				expect(() => new AuthorizationContext(props as AuthorizationContext)).toThrow();
			});
		});
	});
});
