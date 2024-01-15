import { ValidationError } from '@shared/common';
import { customParameterFactory } from '@shared/testing';
import { CustomParameter, CustomParameterEntry, ToolParameterValueMissingLoggableException } from '../../../domain';
import { ParameterEntryValueValidator } from './parameter-entry-value-validator';

describe(ParameterEntryValueValidator.name, () => {
	describe('validate', () => {
		describe('when the parameter has a value', () => {
			const setup = () => {
				const declaration: CustomParameter = customParameterFactory.build({
					name: 'param1',
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

				const result: ValidationError[] = new ParameterEntryValueValidator().validate(entry, declaration);

				expect(result).toHaveLength(0);
			});
		});

		describe('when the parameter value is an empty string', () => {
			const setup = () => {
				const declaration: CustomParameter = customParameterFactory.build({
					name: 'param1',
				});
				const entry: CustomParameterEntry = new CustomParameterEntry({
					name: 'param1',
					value: '',
				});

				return {
					entry,
					declaration,
				};
			};

			it('should return a validation error', () => {
				const { entry, declaration } = setup();

				const result: ValidationError[] = new ParameterEntryValueValidator().validate(entry, declaration);

				expect(result[0]).toBeInstanceOf(ToolParameterValueMissingLoggableException);
			});
		});

		describe('when the parameter value is undefined', () => {
			const setup = () => {
				const declaration: CustomParameter = customParameterFactory.build({
					name: 'param1',
				});
				const entry: CustomParameterEntry = new CustomParameterEntry({
					name: 'param1',
				});

				return {
					entry,
					declaration,
				};
			};

			it('should return a validation error', () => {
				const { entry, declaration } = setup();

				const result: ValidationError[] = new ParameterEntryValueValidator().validate(entry, declaration);

				expect(result[0]).toBeInstanceOf(ToolParameterValueMissingLoggableException);
			});
		});
	});
});
