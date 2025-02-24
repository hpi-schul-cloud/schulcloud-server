import { DeletionExecutionParams } from './deletion-execution.params';

describe(DeletionExecutionParams.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const deletionExecutionParams = new DeletionExecutionParams();

				return { deletionExecutionParams };
			};

			it('should be defined', () => {
				const { deletionExecutionParams } = setup();

				expect(deletionExecutionParams).toBeDefined();
			});

			it('should have a limit property', () => {
				const { deletionExecutionParams } = setup();
				expect(deletionExecutionParams.limit).toBeDefined();
			});

			it('limit should be a number with a default value of 100', () => {
				const { deletionExecutionParams } = setup();
				expect(deletionExecutionParams.limit).toBeDefined();
				expect(typeof deletionExecutionParams.limit).toBe('number');
				expect(deletionExecutionParams.limit).toBe(100);
			});

			it('limit should be optional', () => {
				const { deletionExecutionParams } = setup();
				deletionExecutionParams.limit = undefined;
				expect(deletionExecutionParams.limit).toBeUndefined();
			});

			it('limit should be a number when provided', () => {
				const { deletionExecutionParams } = setup();
				const customLimit = 50;
				deletionExecutionParams.limit = customLimit;
				expect(deletionExecutionParams.limit).toBe(customLimit);
			});
		});
	});
});
