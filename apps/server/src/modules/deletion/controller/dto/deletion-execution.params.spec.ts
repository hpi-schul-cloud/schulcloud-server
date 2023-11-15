import { DeletionExecutionParams } from './deletion-execution.params';

describe(DeletionExecutionParams.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			let deletionExecutionParams: DeletionExecutionParams;

			beforeEach(() => {
				deletionExecutionParams = new DeletionExecutionParams();
			});

			it('should be defined', () => {
				expect(deletionExecutionParams).toBeDefined();
			});

			it('should have a limit property', () => {
				expect(deletionExecutionParams.limit).toBeDefined();
			});

			it('limit should be a number with a default value of 100', () => {
				expect(deletionExecutionParams.limit).toBeDefined();
				expect(typeof deletionExecutionParams.limit).toBe('number');
				expect(deletionExecutionParams.limit).toBe(100);
			});

			it('limit should be optional', () => {
				deletionExecutionParams.limit = undefined;
				expect(deletionExecutionParams.limit).toBeUndefined();
			});

			it('limit should be a number when provided', () => {
				const customLimit = 50;
				deletionExecutionParams.limit = customLimit;
				expect(deletionExecutionParams.limit).toBe(customLimit);
			});
		});
	});
});
