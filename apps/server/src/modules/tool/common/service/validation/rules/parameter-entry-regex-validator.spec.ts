import { ValidationError } from '@shared/common';
import { customParameterFactory } from '@shared/testing/factory';
import { CustomParameter, CustomParameterEntry, ToolParameterValueRegexLoggableException } from '../../../domain';
import { ParameterEntryRegexValidator } from './parameter-entry-regex-validator';

describe(ParameterEntryRegexValidator.name, () => {
	describe('validate', () => {
		describe('when the parameter fulfills the regex', () => {
			const setup = () => {
				const declaration: CustomParameter = customParameterFactory.build({
					name: 'param1',
					regex: '^123$',
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

				const result: ValidationError[] = new ParameterEntryRegexValidator().validate(entry, declaration, undefined);

				expect(result).toHaveLength(0);
			});
		});

		describe('when the parameter does not fulfills the regex', () => {
			const setup = () => {
				const declaration: CustomParameter = customParameterFactory.build({
					name: 'param1',
					regex: '^123$',
				});
				const entry: CustomParameterEntry = new CustomParameterEntry({
					name: 'param1',
					value: '456',
				});

				return {
					entry,
					declaration,
				};
			};

			it('should return a validation error', () => {
				const { entry, declaration } = setup();

				const result: ValidationError[] = new ParameterEntryRegexValidator().validate(entry, declaration, undefined);

				expect(result[0]).toBeInstanceOf(ToolParameterValueRegexLoggableException);
			});
		});
	});
});
