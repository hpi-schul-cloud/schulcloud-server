import { TriggerDeletionExecutionOptions } from '../interface';
import { TriggerDeletionExecutionOptionsBuilder } from './trigger-deletion-execution-options.builder';

describe(TriggerDeletionExecutionOptionsBuilder.name, () => {
	describe(TriggerDeletionExecutionOptionsBuilder.build.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const limit = 1000;
				const runFailed = false;

				const expectedOutput: TriggerDeletionExecutionOptions = { limit, runFailed };

				return { expectedOutput, limit, runFailed };
			};

			it('should return valid object with expected values', () => {
				const { expectedOutput, limit, runFailed } = setup();

				const output = TriggerDeletionExecutionOptionsBuilder.build(limit, runFailed);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
