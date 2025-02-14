import { DeletionRequestBodyParams } from './deletion-request.body.params';

describe(DeletionRequestBodyParams.name, () => {
	describe('constructor', () => {
		describe('when passed properties', () => {
			const setup = () => {
				const deletionRequestBodyProps = new DeletionRequestBodyParams();

				return { deletionRequestBodyProps };
			};

			it('should be defined', () => {
				const { deletionRequestBodyProps } = setup();
				expect(deletionRequestBodyProps).toBeDefined();
			});

			it('deleteAfterMinutes should be optional', () => {
				const { deletionRequestBodyProps } = setup();
				deletionRequestBodyProps.deleteAfterMinutes = undefined;
				expect(deletionRequestBodyProps.deleteAfterMinutes).toBeUndefined();
			});

			it('deleteAfterMinutes should be a number when provided', () => {
				const { deletionRequestBodyProps } = setup();
				const customdeleteAfterMinutes = 60;
				deletionRequestBodyProps.deleteAfterMinutes = customdeleteAfterMinutes;
				expect(deletionRequestBodyProps.deleteAfterMinutes).toBe(customdeleteAfterMinutes);
				expect(typeof deletionRequestBodyProps.deleteAfterMinutes).toBe('number');
			});
		});
	});
});
