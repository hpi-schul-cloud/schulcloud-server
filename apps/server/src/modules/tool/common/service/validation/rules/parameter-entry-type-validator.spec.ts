import { ValidationError } from '@shared/common';
import { customParameterFactory } from '@shared/testing';
import { CustomParameter, CustomParameterEntry, ToolParameterTypeMismatchLoggableException } from '../../../domain';
import { CustomParameterType } from '../../../enum';
import { ParameterEntryTypeValidator } from './parameter-entry-type-validator';

describe(ParameterEntryTypeValidator.name, () => {
	describe('validate', () => {
		describe('when the parameter has the correct type', () => {
			const setup = () => {
				const declaration: CustomParameter = customParameterFactory.build({
					name: 'param1',
					type: CustomParameterType.NUMBER,
				});
				const entry: CustomParameterEntry = new CustomParameterEntry({
					name: 'param1',
					value: '123',
				});

				return {
					entry,
					declaration,
				};
			};

			it('should return an empty array', () => {
				const { entry, declaration } = setup();

				const result: ValidationError[] = new ParameterEntryTypeValidator().validate(entry, declaration);

				expect(result).toHaveLength(0);
			});
		});

		describe('when the parameter does not have the correct type', () => {
			const setup = () => {
				const declaration: CustomParameter = customParameterFactory.build({
					name: 'param1',
					type: CustomParameterType.NUMBER,
				});
				const entry: CustomParameterEntry = new CustomParameterEntry({
					name: 'param1',
					value: 'NaN',
				});

				return {
					entry,
					declaration,
				};
			};

			it('should return a validation error', () => {
				const { entry, declaration } = setup();

				const result: ValidationError[] = new ParameterEntryTypeValidator().validate(entry, declaration);

				expect(result[0]).toBeInstanceOf(ToolParameterTypeMismatchLoggableException);
			});
		});
	});
});
