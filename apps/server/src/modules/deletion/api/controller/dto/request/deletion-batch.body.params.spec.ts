import { CreateDeletionBatchBodyParams } from './create-deletion-batch.body.params';
import { DeletionRequestBodyParams } from './deletion-request.body.params';

describe(CreateDeletionBatchBodyParams.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const deletionBatchBodyProps = new CreateDeletionBatchBodyParams();
				const sampleDeletionRequest = new DeletionRequestBodyParams();

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
				expect(deletionBatchBodyProps.deletionRequests[0]).toBeInstanceOf(DeletionRequestBodyParams);
			});

			it('should handle multiple deletion requests', () => {
				const { deletionBatchBodyProps, sampleDeletionRequest } = setup();
				const anotherDeletionRequest = new DeletionRequestBodyParams();

				deletionBatchBodyProps.deletionRequests = [sampleDeletionRequest, anotherDeletionRequest];

				expect(deletionBatchBodyProps.deletionRequests).toHaveLength(2);
				expect(deletionBatchBodyProps.deletionRequests[0]).toBeInstanceOf(DeletionRequestBodyParams);
				expect(deletionBatchBodyProps.deletionRequests[1]).toBeInstanceOf(DeletionRequestBodyParams);
			});
		});
	});
});
