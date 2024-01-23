import { ValidationError } from '@shared/common';
import { CustomParameter, CustomParameterEntry, ToolParameterValueMissingLoggableException } from '../../../domain';
import { ParameterEntryValidator } from './parameter-entry-validator';

export class ParameterEntryValueValidator implements ParameterEntryValidator {
	public validate(entry: CustomParameterEntry, declaration: CustomParameter): ValidationError[] {
		if (entry.value === undefined || entry.value === '') {
			return [new ToolParameterValueMissingLoggableException(declaration)];
		}

		return [];
	}
}
