import { roleFactory } from '@modules/role/testing';
import { AddSecondarySchoolToUsersRoleErrorLoggableException } from './add-secondary-school-to-user-error.loggable';

describe('AddSecondarySchoolToUsersRoleErrorLoggableException', () => {
	it('should implement Loggable interface', () => {
		const exception = new AddSecondarySchoolToUsersRoleErrorLoggableException({ roles: [] });
		expect(typeof exception.getLogMessage).toBe('function');
	});

	it('should return correct log message', () => {
		const roles = roleFactory.buildListWithId(2);
		const exception = new AddSecondarySchoolToUsersRoleErrorLoggableException({ roles });

		expect(exception.getLogMessage()).toEqual({
			type: 'INTERNAL_ERROR',
			message: 'could not recognize any of the users roles when adding a secondary school',
			stack: exception.stack,
			data: {
				roleNames: 'role1, role2',
			},
		});
	});
});
