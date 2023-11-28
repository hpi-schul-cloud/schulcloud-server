import { BatchDeletionSummaryBuilder } from '.';
import { BatchDeletionSummary, BatchDeletionSummaryOverallStatus } from '../interface';

describe(BatchDeletionSummaryBuilder.name, () => {
	describe(BatchDeletionSummaryBuilder.build.name, () => {
		describe('when called with proper arguments', () => {
			const setup = () => {
				const executionTimeMilliseconds = 142;

				const expectedOutput: BatchDeletionSummary = {
					executionTimeMilliseconds: 142,
					overallStatus: BatchDeletionSummaryOverallStatus.FAILURE,
					successCount: 0,
					failureCount: 0,
					details: [],
				};

				return { executionTimeMilliseconds, expectedOutput };
			};

			it('should return valid object with expected values', () => {
				const { executionTimeMilliseconds, expectedOutput } = setup();

				const output = BatchDeletionSummaryBuilder.build(executionTimeMilliseconds);

				expect(output).toStrictEqual(expectedOutput);
			});
		});
	});
});
