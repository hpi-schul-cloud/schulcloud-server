import { BatchStatus } from '../../domain/types';
import { CantCreateDeletionRequestsForBatchErrorLoggable } from './cant-create-deletion-requests-for-batch-error.loggable';

describe(CantCreateDeletionRequestsForBatchErrorLoggable.name, () => {
	it('should get log message', () => {
		const id = '0000dcfbfb5c7a3f00bf21ab';
		const batchStatus = BatchStatus.CREATED;

		const loggable = new CantCreateDeletionRequestsForBatchErrorLoggable(id, batchStatus);

		expect(loggable.getLogMessage()).toEqual(
			expect.objectContaining({
				type: 'CANT_CREATE_DELETION_REQUESTS_FOR_BATCH',
				data: {
					id,
					batchStatus,
					errorMessage: expect.any(String),
				},
			})
		);
	});
});
