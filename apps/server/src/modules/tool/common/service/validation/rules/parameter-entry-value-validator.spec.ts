import { ValidationError } from '@shared/common';
import { customParameterFactory } from '@shared/testing/factory';
import {
	CustomParameter,
	CustomParameterEntry,
	ToolParameterMandatoryValueMissingLoggableException,
	ToolParameterOptionalValueMissingLoggableException,
} from '../../../domain';
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

				const result: ValidationError[] = new ParameterEntryValueValidator().validate(entry, declaration, undefined);

				expect(result).toHaveLength(0);
			});
		});

		describe('when parameter is mandatory', () => {
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

					const result: ValidationError[] = new ParameterEntryValueValidator().validate(entry, declaration, undefined);

					expect(result[0]).toBeInstanceOf(ToolParameterMandatoryValueMissingLoggableException);
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

					const result: ValidationError[] = new ParameterEntryValueValidator().validate(entry, declaration, undefined);

					expect(result[0]).toBeInstanceOf(ToolParameterMandatoryValueMissingLoggableException);
				});
			});
		});

		describe('when parameter is optional', () => {
			describe('when the parameter value is an empty string', () => {
				const setup = () => {
					const declaration: CustomParameter = customParameterFactory.build({
						name: 'param1',
						isOptional: true,
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

					const result: ValidationError[] = new ParameterEntryValueValidator().validate(entry, declaration, undefined);

					expect(result[0]).toBeInstanceOf(ToolParameterOptionalValueMissingLoggableException);
				});
			});

			describe('when the parameter value is undefined', () => {
				const setup = () => {
					const declaration: CustomParameter = customParameterFactory.build({
						name: 'param1',
						isOptional: true,
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

					const result: ValidationError[] = new ParameterEntryValueValidator().validate(entry, declaration, undefined);

					expect(result[0]).toBeInstanceOf(ToolParameterOptionalValueMissingLoggableException);
				});
			});
		});
	});
});
