import { ObjectId } from '@mikro-orm/mongodb';
import { QueueDeletionRequestInput } from '../interface';
import { QueueDeletionRequestInputBuilder } from './queue-deletion-request-input.builder';

describe(QueueDeletionRequestInputBuilder.name, () => {
	describe(QueueDeletionRequestInputBuilder.build.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const targetRefDomain = 'user';
				const targetRefId = new ObjectId().toHexString();
				const deleteInMinutes = 60;

				const expectedOutput: QueueDeletionRequestInput = { targetRefDomain, targetRefId, deleteInMinutes };

				return { targetRefDomain, targetRefId, deleteInMinutes, expectedOutput };
			};

			it('should return valid object with expected values', () => {
				const { targetRefDomain, targetRefId, deleteInMinutes, expectedOutput } = setup();

				const output = QueueDeletionRequestInputBuilder.build(targetRefDomain, targetRefId, deleteInMinutes);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
