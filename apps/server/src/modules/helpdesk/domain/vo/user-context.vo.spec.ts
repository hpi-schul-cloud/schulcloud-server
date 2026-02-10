import { ObjectId } from '@mikro-orm/mongodb';
import { UserContextProps } from '../interface';
import { UserContext } from './user-context.vo';

describe('UserContext', () => {
	describe('when called with valid properties', () => {
		const setup = () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 'Test User',
				userEmail: 'test@example.com',
				userRoles: ['admin', 'user'],
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
				instanceName: 'Test Instance',
			};
			return { props };
		};

		it('should assign all properties correctly', () => {
			const { props } = setup();
			const userContext = new UserContext(props);
			Object.entries(props).forEach(([key, value]) => {
				expect(userContext[key]).toEqual(value);
			});
		});
	});

	describe('when mandatory property is missing', () => {
		it('should throw if userId is missing', () => {
			const props = {
				userName: 'Test User',
				userEmail: 'test@example.com',
				userRoles: ['admin', 'user'],
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});

		it('should throw if userName is missing', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userEmail: 'test@example.com',
				userRoles: ['admin', 'user'],
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});

		it('should throw if userEmail is missing', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 'Test User',
				userRoles: ['admin', 'user'],
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});

		it('should throw if userRoles is missing', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 'Test User',
				userEmail: 'test@example.com',
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});

		it('should throw if schoolId is missing', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 'Test User',
				userEmail: 'test@example.com',
				userRoles: ['admin', 'user'],
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});

		it('should throw if schoolName is missing', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 'Test User',
				userEmail: 'test@example.com',
				userRoles: ['admin', 'user'],
				schoolId: new ObjectId().toHexString(),
			};
			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});
	});

	describe('when called with invalid properties', () => {
		it('should throw if mandatory properties are missing', () => {
			const props = {};
			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});

		it('should throw if userId is not a valid MongoId', () => {
			const props = {
				userId: 'not-a-mongoid',
				userName: 'Test User',
				userEmail: 'test@example.com',
				userRoles: ['admin'],
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
			};

			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});

		it('should throw if userEmail is not a valid email', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 'Test User',
				userEmail: 'not-an-email',
				userRoles: ['admin'],
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});

		it('should throw if userRoles is not an array', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 'Test User',
				userEmail: 'test@example.com',
				userRoles: 'admin',
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as unknown as UserContextProps)).toThrow();
		});

		it('should throw if userRoles is an array of numbers', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 'Test User',
				userEmail: 'test@example.com',
				userRoles: [123],
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as unknown as UserContextProps)).toThrow();
		});

		it('should throw if schoolId is not a valid MongoId', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 'Test User',
				userEmail: 'test@example.com',
				userRoles: ['admin'],
				schoolId: 'not-a-mongoid',
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as UserContextProps)).toThrow();
		});

		it('should throw if userName is not a string', () => {
			const props = {
				userId: new ObjectId().toHexString(),
				userName: 123,
				userEmail: 'test@example.com',
				userRoles: ['admin'],
				schoolId: new ObjectId().toHexString(),
				schoolName: 'Test School',
			};
			expect(() => new UserContext(props as unknown as UserContextProps)).toThrow();
		});
	});
});
