import { Action } from '@modules/authorization';
import { Permission } from '@shared/domain/interface';
import { authorizationContextFactory } from '../../testing';
import { AuthorizationContext } from './authorization-context.vo';

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
			const setup = () => {
				const props = {};

				return { props };
			};

			it('should throw when action is missing', () => {
				const { props } = setup();

				expect(() => new AuthorizationContext(props)).toThrow();
			});
		});

		describe('when props are not an object', () => {
			const setup = () => {
				const props = null;

				return { props };
			};

			it('should throw when props is null', () => {
				const { props } = setup();

				expect(() => new AuthorizationContext(props)).toThrow();
			});
		});

		describe('when props is undefined', () => {
			const setup = () => {
				const props = undefined;

				return { props };
			};

			it('should throw when props is undefined', () => {
				const { props } = setup();

				expect(() => new AuthorizationContext(props)).toThrow();
			});
		});

		describe('when props is a primitive', () => {
			it('should throw when props is a string', () => {
				expect(() => new AuthorizationContext('invalid')).toThrow();
			});

			it('should throw when props is a number', () => {
				expect(() => new AuthorizationContext(123)).toThrow();
			});

			it('should throw when props is a boolean', () => {
				expect(() => new AuthorizationContext(true)).toThrow();
			});
		});

		describe('when action is invalid', () => {
			it('should throw when action is undefined', () => {
				const props = { requiredPermissions: [Permission.ACCOUNT_CREATE] };

				expect(() => new AuthorizationContext(props)).toThrow();
			});

			it('should throw when action is not a valid enum value', () => {
				const props = { action: 'invalid', requiredPermissions: [Permission.ACCOUNT_CREATE] };

				expect(() => new AuthorizationContext(props)).toThrow();
			});
		});

		describe('when requiredPermissions is invalid', () => {
			it('should throw when requiredPermissions is undefined', () => {
				const props = { action: Action.read };

				expect(() => new AuthorizationContext(props)).toThrow();
			});

			it('should throw when requiredPermissions is not an array', () => {
				const props = { action: Action.read, requiredPermissions: 'not-an-array' };

				expect(() => new AuthorizationContext(props)).toThrow();
			});

			it('should throw when requiredPermissions contains invalid values', () => {
				const props = { action: Action.read, requiredPermissions: ['invalid'] };

				expect(() => new AuthorizationContext(props)).toThrow();
			});
		});
	});
});
