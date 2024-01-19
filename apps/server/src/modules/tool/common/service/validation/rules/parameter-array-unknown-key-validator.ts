import { ValidationError } from '@shared/common';
import { CustomParameter, CustomParameterEntry, ToolParameterUnknownLoggableException } from '../../../domain';
import { ParameterArrayValidator } from './parameter-array-validator';

export class ParameterArrayUnknownKeyValidator implements ParameterArrayValidator {
	validate(entries: CustomParameterEntry[], declarations: CustomParameter[]): ValidationError[] {
		const errors: ValidationError[] = [];

		for (const entry of entries) {
			const foundParameter: CustomParameter | undefined = declarations.find(
				({ name }: CustomParameter): boolean => name === entry.name
			);

			if (!foundParameter) {
				errors.push(new ToolParameterUnknownLoggableException(entry));
			}
		}

		return errors;
	}
}
