import { UserContextProps } from '../domain/interface';

export const userContextPropsFactory = {
	create: (props?: Partial<UserContextProps>): UserContextProps => {
		return {
			userId: 'test-user-id',
			userName: 'Test User',
			userEmail: 'testuser@example.com',
			userRoles: ['student'],
			schoolId: 'test-school-id',
			schoolName: 'Test School',
			instanceName: 'Test Instance',
			...props,
		};
	},
};
