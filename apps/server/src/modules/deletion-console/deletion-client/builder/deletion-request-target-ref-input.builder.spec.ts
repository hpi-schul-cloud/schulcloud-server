import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequestTargetRefInput } from '../interface';
import { DeletionRequestTargetRefInputBuilder } from './deletion-request-target-ref-input.builder';

describe(DeletionRequestTargetRefInputBuilder.name, () => {
	describe(DeletionRequestTargetRefInputBuilder.build.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const domain = 'user';
				const id = new ObjectId().toHexString();

				const expectedOutput: DeletionRequestTargetRefInput = { domain, id };

				return { domain, id, expectedOutput };
			};

			it('should return valid object with expected values', () => {
				const { domain, id, expectedOutput } = setup();

				const output = DeletionRequestTargetRefInputBuilder.build(domain, id);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
