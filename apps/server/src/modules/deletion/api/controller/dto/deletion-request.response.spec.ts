import { deletionRequestFactory } from '../../../domain/testing';
import { DeletionRequestResponse } from './deletion-request.response';

describe(DeletionRequestResponse.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const deletionRequest = deletionRequestFactory.build();
				const deletionRequestResponse: DeletionRequestResponse = {
					requestId: deletionRequest.id,
					deletionPlannedAt: deletionRequest.deleteAfter,
				};

				return { deletionRequestResponse };
			};

			it('should set the id', () => {
				const { deletionRequestResponse } = setup();

				const deletionRequest = new DeletionRequestResponse(deletionRequestResponse);

				expect(deletionRequest.requestId).toEqual(deletionRequestResponse.requestId);
			});
		});
	});
});
