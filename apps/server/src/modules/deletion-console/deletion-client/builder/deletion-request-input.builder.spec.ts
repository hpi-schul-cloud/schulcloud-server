import { ObjectId } from '@mikro-orm/mongodb';
import { DeletionRequestInput } from '../interface';
import { DeletionRequestInputBuilder } from './deletion-request-input.builder';

describe(DeletionRequestInputBuilder.name, () => {
	describe(DeletionRequestInputBuilder.build.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const targetRefDomain = 'school';
				const targetRefId = new ObjectId().toHexString();
				const deleteInMinutes = 43200;

				const expectedOutput: DeletionRequestInput = {
					targetRef: {
						domain: targetRefDomain,
						id: targetRefId,
					},
					deleteInMinutes,
				};

				return { targetRefDomain, targetRefId, deleteInMinutes, expectedOutput };
			};

			it('should return valid object with expected values', () => {
				const { targetRefDomain, targetRefId, deleteInMinutes, expectedOutput } = setup();

				const output = DeletionRequestInputBuilder.build(targetRefDomain, targetRefId, deleteInMinutes);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
