import { TriggerDeletionExecutionOptions } from '../interface';
import { TriggerDeletionExecutionOptionsBuilder } from './trigger-deletion-execution-options.builder';

describe(TriggerDeletionExecutionOptionsBuilder.name, () => {
	describe(TriggerDeletionExecutionOptionsBuilder.build.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const limit = 1000;

				const expectedOutput: TriggerDeletionExecutionOptions = { limit };

				return { limit, expectedOutput };
			};

			it('should return valid object with expected values', () => {
				const { limit, expectedOutput } = setup();

				const output = TriggerDeletionExecutionOptionsBuilder.build(limit);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
