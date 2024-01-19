import { BatchDeletionSummary, BatchDeletionSummaryOverallStatus } from '../uc/interface';
import { BatchDeletionSummaryBuilder } from './batch-deletion-summary.builder';

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
