import { TriggerDeletionExecutionOptionsBuilder } from './trigger-deletion-execution-options.builder';

describe(TriggerDeletionExecutionOptionsBuilder.name, () => {
	describe(TriggerDeletionExecutionOptionsBuilder.build.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const limit = 1000;
				const runFailed = false;

				return { limit, runFailed };
			};

			it('should return valid object with expected values', () => {
				const { limit, runFailed } = setup();

				const output = TriggerDeletionExecutionOptionsBuilder.build(limit, runFailed);

				expect(output).toStrictEqual({ limit, runFailed });
			});
		});
	});
});
