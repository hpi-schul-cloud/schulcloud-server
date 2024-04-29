import { ValidationError } from '@shared/common';
import { customParameterFactory } from '@shared/testing';
import {
	CustomParameter,
	CustomParameterEntry,
	ToolParameterRequiredLoggableException,
	ToolParameterValueMissingLoggableException,
} from '../../../domain';
import { ParameterArrayEntryValidator } from './parameter-array-entry-validator';

describe(ParameterArrayEntryValidator.name, () => {
	describe('validate', () => {
		describe('when all parameters are valid', () => {
			const setup = () => {
				const declarations: CustomParameter[] = customParameterFactory.buildList(1, {
					name: 'param1',
				});
				const entries: CustomParameterEntry[] = [
					new CustomParameterEntry({
						name: 'param1',
						value: 'test',
					}),
				];

				return {
					entries,
					declarations,
				};
			};

			it('should return an empty array', () => {
				const { entries, declarations } = setup();

				const result: ValidationError[] = new ParameterArrayEntryValidator().validate(entries, declarations, undefined);

				expect(result).toHaveLength(0);
			});
		});

		describe('when a required parameter is not defined', () => {
			const setup = () => {
				const declarations: CustomParameter[] = customParameterFactory.buildList(1, {
					name: 'param1',
					isOptional: false,
				});
				const entries: CustomParameterEntry[] = [];

				return {
					declarations,
					entries,
				};
			};

			it('should return a validation error', () => {
				const { entries, declarations } = setup();

				const result: ValidationError[] = new ParameterArrayEntryValidator().validate(entries, declarations, undefined);

				expect(result[0]).toBeInstanceOf(ToolParameterRequiredLoggableException);
			});
		});

		describe('when a required parameter fails the validations', () => {
			const setup = () => {
				const declarations: CustomParameter[] = customParameterFactory.buildList(1, {
					name: 'param1',
					isOptional: false,
				});
				const entries: CustomParameterEntry[] = [
					new CustomParameterEntry({
						name: 'param1',
					}),
				];

				return {
					declarations,
					entries,
				};
			};

			it('should return a validation error', () => {
				const { entries, declarations } = setup();

				const result: ValidationError[] = new ParameterArrayEntryValidator().validate(entries, declarations, undefined);

				expect(result[0]).toBeInstanceOf(ToolParameterValueMissingLoggableException);
			});
		});
	});
});
