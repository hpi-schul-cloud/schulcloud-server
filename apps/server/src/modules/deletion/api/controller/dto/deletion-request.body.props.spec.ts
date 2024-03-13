import { DeletionRequestBodyProps } from './deletion-request.body.props';

describe(DeletionRequestBodyProps.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const deletionRequestBodyProps = new DeletionRequestBodyProps();

				return { deletionRequestBodyProps };
			};

			it('should be defined', () => {
				const { deletionRequestBodyProps } = setup();
				expect(deletionRequestBodyProps).toBeDefined();
			});

			it('deleteInMinutes should be a number with default value 43200', () => {
				const { deletionRequestBodyProps } = setup();
				expect(deletionRequestBodyProps.deleteInMinutes).toBeDefined();
				expect(typeof deletionRequestBodyProps.deleteInMinutes).toBe('number');
				expect(deletionRequestBodyProps.deleteInMinutes).toBe(43200);
			});

			it('deleteInMinutes should be optional', () => {
				const { deletionRequestBodyProps } = setup();
				deletionRequestBodyProps.deleteInMinutes = undefined;
				expect(deletionRequestBodyProps.deleteInMinutes).toBeUndefined();
			});

			it('deleteInMinutes should be a number when provided', () => {
				const { deletionRequestBodyProps } = setup();
				const customDeleteInMinutes = 60;
				deletionRequestBodyProps.deleteInMinutes = customDeleteInMinutes;
				expect(deletionRequestBodyProps.deleteInMinutes).toBe(customDeleteInMinutes);
			});
		});
	});
});
