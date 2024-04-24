import { ValidationError } from '@shared/common';
import { CustomParameterEntry, ToolParameterDuplicateLoggableException } from '../../../domain';
import { ParameterArrayDuplicateKeyValidator } from './parameter-array-duplicate-key-validator';

describe(ParameterArrayDuplicateKeyValidator.name, () => {
	describe('validate', () => {
		describe('when there are no duplicate parameters', () => {
			const setup = () => {
				const entries: CustomParameterEntry[] = [
					new CustomParameterEntry({
						name: 'unique1',
					}),
					new CustomParameterEntry({
						name: 'unique2',
					}),
				];

				return {
					entries,
				};
			};

			it('should return an empty array', () => {
				const { entries } = setup();

				const result: ValidationError[] = new ParameterArrayDuplicateKeyValidator().validate(entries, [], undefined);

				expect(result).toHaveLength(0);
			});
		});

		describe('when there are duplicate parameters', () => {
			const setup = () => {
				const entries: CustomParameterEntry[] = [
					new CustomParameterEntry({
						name: 'duplicate',
					}),
					new CustomParameterEntry({
						name: 'duplicate',
					}),
				];

				return {
					entries,
				};
			};

			it('should return a validation error', () => {
				const { entries } = setup();

				const result: ValidationError[] = new ParameterArrayDuplicateKeyValidator().validate(entries, [], undefined);

				expect(result[0]).toBeInstanceOf(ToolParameterDuplicateLoggableException);
			});
		});
	});
});
