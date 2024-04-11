import { ObjectId } from '@mikro-orm/mongodb';
import { QueueDeletionRequestOutput } from '../interface';
import { QueueDeletionRequestOutputBuilder } from './queue-deletion-request-output.builder';

describe(QueueDeletionRequestOutputBuilder.name, () => {
	describe(QueueDeletionRequestOutputBuilder.buildSuccess.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const requestId = new ObjectId().toHexString();
				const deletionPlannedAt = new Date();

				const expectedOutput: QueueDeletionRequestOutput = { requestId, deletionPlannedAt };

				return { requestId, deletionPlannedAt, expectedOutput };
			};

			it('should return valid object with expected values', () => {
				const { requestId, deletionPlannedAt, expectedOutput } = setup();

				const output = QueueDeletionRequestOutputBuilder.buildSuccess(requestId, deletionPlannedAt);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});

	describe(QueueDeletionRequestOutputBuilder.buildError.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const error = new Error('test error message');

				const expectedOutput: QueueDeletionRequestOutput = { error: error.toString() };

				return { error, expectedOutput };
			};

			it('should return valid object with expected values', () => {
				const { error, expectedOutput } = setup();

				const output = QueueDeletionRequestOutputBuilder.buildError(error);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
