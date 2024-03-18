import { ObjectId } from '@mikro-orm/mongodb';
import { DomainName, EntityId, StatusModel } from '@shared/domain/types';
import { DataDeletionDomainOperationLoggable } from './data-deletion-domain-operation-loggable';

describe(DataDeletionDomainOperationLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const user: EntityId = new ObjectId().toHexString();
			const message = 'Test message.';
			const domain = DomainName.USER;
			const status = StatusModel.FINISHED;
			const modifiedCount = 0;
			const deletedCount = 1;

			const loggable: DataDeletionDomainOperationLoggable = new DataDeletionDomainOperationLoggable(
				message,
				domain,
				user,
				status,
				modifiedCount,
				deletedCount
			);

			return {
				loggable,
				message,
				domain,
				user,
				status,
				modifiedCount,
				deletedCount,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, message, domain, user, status, modifiedCount, deletedCount } = setup();

			expect(loggable.getLogMessage()).toEqual({
				message,
				data: {
					domain,
					user,
					status,
					modifiedCount,
					deletedCount,
				},
			});
		});
	});
});
