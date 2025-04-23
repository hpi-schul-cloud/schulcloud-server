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
		});
	});
});
