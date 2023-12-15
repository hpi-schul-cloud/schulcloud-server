import { DeletionExecutionTriggerResult, DeletionExecutionTriggerStatus } from '../interface';
import { DeletionExecutionTriggerResultBuilder } from './deletion-execution-trigger-result.builder';

describe(DeletionExecutionTriggerResultBuilder.name, () => {
	describe(DeletionExecutionTriggerResultBuilder.buildSuccess.name, () => {
		describe('when called', () => {
			const setup = () => {
				const expectedOutput: DeletionExecutionTriggerResult = { status: DeletionExecutionTriggerStatus.SUCCESS };

				return { expectedOutput };
			};

			it('should return valid object indicating success', () => {
				const { expectedOutput } = setup();

				const output = DeletionExecutionTriggerResultBuilder.buildSuccess();

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});

	describe(DeletionExecutionTriggerResultBuilder.buildFailure.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const error = new Error('test error message');

				const expectedOutput: DeletionExecutionTriggerResult = {
					status: DeletionExecutionTriggerStatus.FAILURE,
					error: error.toString(),
				};

				return { error, expectedOutput };
			};

			it('should return valid object with expected values', () => {
				const { error, expectedOutput } = setup();

				const output = DeletionExecutionTriggerResultBuilder.buildFailure(error);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
