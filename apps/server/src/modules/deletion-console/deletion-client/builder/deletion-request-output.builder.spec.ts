import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequestOutput } from '../interface';
import { DeletionRequestOutputBuilder } from './deletion-request-output.builder';

describe(DeletionRequestOutputBuilder.name, () => {
	describe(DeletionRequestOutputBuilder.build.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const requestId = new ObjectId().toHexString();
				const deletionPlannedAt = new Date();

				const expectedOutput: DeletionRequestOutput = {
					requestId,
					deletionPlannedAt,
				};

				return { requestId, deletionPlannedAt, expectedOutput };
			};

			it('should return valid object with expected values', () => {
				const { requestId, deletionPlannedAt, expectedOutput } = setup();

				const output = DeletionRequestOutputBuilder.build(requestId, deletionPlannedAt);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
