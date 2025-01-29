import { DeletionBatchBodyProps } from './deletion-batch.body.props';
import { DeletionRequestBodyProps } from './deletion-request.body.props';

describe(DeletionBatchBodyProps.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const deletionBatchBodyProps = new DeletionBatchBodyProps();
				const sampleDeletionRequest = new DeletionRequestBodyProps();

				return { deletionBatchBodyProps, sampleDeletionRequest };
			};

			it('should be defined', () => {
				const { deletionBatchBodyProps } = setup();
				expect(deletionBatchBodyProps).toBeDefined();
			});

			it('deletionRequests should be defined as empty array by default', () => {
				const { deletionBatchBodyProps } = setup();
				expect(deletionBatchBodyProps.deletionRequests).toBeDefined();
				expect(Array.isArray(deletionBatchBodyProps.deletionRequests)).toBe(true);
				expect(deletionBatchBodyProps.deletionRequests).toHaveLength(0);
			});

			it('should accept an array of DeletionRequestBodyProps', () => {
				const { deletionBatchBodyProps, sampleDeletionRequest } = setup();
				deletionBatchBodyProps.deletionRequests = [sampleDeletionRequest];

				expect(deletionBatchBodyProps.deletionRequests).toHaveLength(1);
				expect(deletionBatchBodyProps.deletionRequests[0]).toBeInstanceOf(DeletionRequestBodyProps);
			});

			it('should handle multiple deletion requests', () => {
				const { deletionBatchBodyProps, sampleDeletionRequest } = setup();
				const anotherDeletionRequest = new DeletionRequestBodyProps();

				deletionBatchBodyProps.deletionRequests = [sampleDeletionRequest, anotherDeletionRequest];

				expect(deletionBatchBodyProps.deletionRequests).toHaveLength(2);
				expect(deletionBatchBodyProps.deletionRequests[0]).toBeInstanceOf(DeletionRequestBodyProps);
				expect(deletionBatchBodyProps.deletionRequests[1]).toBeInstanceOf(DeletionRequestBodyProps);
			});
		});
	});
});
