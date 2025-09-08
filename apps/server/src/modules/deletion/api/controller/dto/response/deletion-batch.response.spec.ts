import { DeletionBatchResponse } from './deletion-batch.response';

describe(DeletionBatchResponse.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const batchResponse = {
					batchId: 'batch-123',
					deletionRequests: [],
				};

				return { batchResponse };
			};

			it('should set batch id', () => {
				const { batchResponse } = setup();

				const response = new DeletionBatchResponse(batchResponse);

				expect(response.batchId).toBe(batchResponse.batchId);
			});
		});
	});
});
