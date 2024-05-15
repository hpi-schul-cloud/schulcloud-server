import { ValidationError } from '@shared/common';
import { customParameterFactory } from '@shared/testing/factory';
import { CustomParameter, CustomParameterEntry, ToolParameterUnknownLoggableException } from '../../../domain';
import { ParameterArrayUnknownKeyValidator } from './parameter-array-unknown-key-validator';

describe(ParameterArrayUnknownKeyValidator.name, () => {
	describe('validate', () => {
		describe('when there are no unknown parameters', () => {
			const setup = () => {
				const declarations: CustomParameter[] = customParameterFactory.buildList(1, {
					name: 'param1',
				});
				const entries: CustomParameterEntry[] = [
					new CustomParameterEntry({
						name: 'param1',
					}),
				];

				return {
					entries,
					declarations,
				};
			};

			it('should return an empty array', () => {
				const { entries, declarations } = setup();

				const result: ValidationError[] = new ParameterArrayUnknownKeyValidator().validate(
					entries,
					declarations,
					undefined
				);

				expect(result).toHaveLength(0);
			});
		});

		describe('when there are unknown parameters', () => {
			const setup = () => {
				const declarations: CustomParameter[] = customParameterFactory.buildList(1, {
					name: 'param1',
				});
				const entries: CustomParameterEntry[] = [
					new CustomParameterEntry({
						name: 'unknownParameter',
					}),
				];

				return {
					declarations,
					entries,
				};
			};

			it('should return a validation error', () => {
				const { entries, declarations } = setup();

				const result: ValidationError[] = new ParameterArrayUnknownKeyValidator().validate(
					entries,
					declarations,
					undefined
				);

				expect(result[0]).toBeInstanceOf(ToolParameterUnknownLoggableException);
			});
		});
	});
});
