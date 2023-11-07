import { ObjectId } from '@mikro-orm/mongodb';
import { BatchDeletionSummaryDetail } from '@modules/deletion/uc';
import { QueueDeletionRequestInput, QueueDeletionRequestOutput } from '../../services';
import { BatchDeletionSummaryDetailBuilder } from './batch-deletion-summary-detail.builder';

describe(BatchDeletionSummaryDetailBuilder.name, () => {
	describe(BatchDeletionSummaryDetailBuilder.build.name, () => {
		describe('when called with proper arguments for', () => {
			describe('a successful output case', () => {
				const setup = () => {
					const deletionRequestInput: QueueDeletionRequestInput = {
						targetRefDomain: 'user',
						targetRefId: new ObjectId().toHexString(),
						deleteInMinutes: 1440,
					};

					const deletionRequestOutput: QueueDeletionRequestOutput = {
						requestId: new ObjectId().toHexString(),
						deletionPlannedAt: new Date(),
					};

					const expectedOutput: BatchDeletionSummaryDetail = {
						input: deletionRequestInput,
						output: deletionRequestOutput,
					};

					return { deletionRequestInput, deletionRequestOutput, expectedOutput };
				};

				it('should return valid object with expected values', () => {
					const { deletionRequestInput, deletionRequestOutput, expectedOutput } = setup();

					const output = BatchDeletionSummaryDetailBuilder.build(deletionRequestInput, deletionRequestOutput);

					expect(output).toStrictEqual(expectedOutput);
				});
			});

			describe('an error output case', () => {
				const setup = () => {
					const deletionRequestInput: QueueDeletionRequestInput = {
						targetRefDomain: 'user',
						targetRefId: new ObjectId().toHexString(),
						deleteInMinutes: 1440,
					};

					const deletionRequestOutput: QueueDeletionRequestOutput = {
						error: 'some error occurred...',
					};

					const expectedOutput: BatchDeletionSummaryDetail = {
						input: deletionRequestInput,
						output: deletionRequestOutput,
					};

					return { deletionRequestInput, deletionRequestOutput, expectedOutput };
				};

				it('should return valid object with expected values', () => {
					const { deletionRequestInput, deletionRequestOutput, expectedOutput } = setup();

					const output = BatchDeletionSummaryDetailBuilder.build(deletionRequestInput, deletionRequestOutput);

					expect(output).toStrictEqual(expectedOutput);
				});
			});
		});
	});
});
