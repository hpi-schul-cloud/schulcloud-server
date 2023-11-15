import { DeletionRequestBodyProps } from './deletion-request.body.params';

describe(DeletionRequestBodyProps.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			let deletionRequestBodyProps: DeletionRequestBodyProps;

			beforeEach(() => {
				deletionRequestBodyProps = new DeletionRequestBodyProps();
			});

			it('should be defined', () => {
				expect(deletionRequestBodyProps).toBeDefined();
			});

			it('deleteInMinutes should be a number with default value 43200', () => {
				expect(deletionRequestBodyProps.deleteInMinutes).toBeDefined();
				expect(typeof deletionRequestBodyProps.deleteInMinutes).toBe('number');
				expect(deletionRequestBodyProps.deleteInMinutes).toBe(43200);
			});

			it('deleteInMinutes should be optional', () => {
				deletionRequestBodyProps.deleteInMinutes = undefined;
				expect(deletionRequestBodyProps.deleteInMinutes).toBeUndefined();
			});

			it('deleteInMinutes should be a number when provided', () => {
				const customDeleteInMinutes = 60;
				deletionRequestBodyProps.deleteInMinutes = customDeleteInMinutes;
				expect(deletionRequestBodyProps.deleteInMinutes).toBe(customDeleteInMinutes);
			});
		});
	});
});
