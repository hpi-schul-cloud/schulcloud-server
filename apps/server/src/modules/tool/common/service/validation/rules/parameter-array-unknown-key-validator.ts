import { ValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { CustomParameter, CustomParameterEntry, ToolParameterUnknownLoggableException } from '../../../domain';
import { ParameterArrayValidator } from './parameter-array-validator';

export class ParameterArrayUnknownKeyValidator implements ParameterArrayValidator {
	validate(
		entries: CustomParameterEntry[],
		declarations: CustomParameter[],
		toolId: EntityId | undefined
	): ValidationError[] {
		const errors: ValidationError[] = [];

		for (const entry of entries) {
			const foundParameter: CustomParameter | undefined = declarations.find(
				({ name }: CustomParameter): boolean => name === entry.name
			);

			if (!foundParameter) {
				errors.push(new ToolParameterUnknownLoggableException(toolId, entry));
			}
		}

		return errors;
	}
}
