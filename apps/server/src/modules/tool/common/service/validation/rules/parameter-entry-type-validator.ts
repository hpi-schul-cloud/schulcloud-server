import { ValidationError } from '@shared/common';
import { CustomParameter, CustomParameterEntry, ToolParameterTypeMismatchLoggableException } from '../../../domain';
import { ToolParameterTypeValidationUtil } from '../tool-parameter-type-validation.util';
import { ParameterEntryValidator } from './parameter-entry-validator';

export class ParameterEntryTypeValidator implements ParameterEntryValidator {
	public validate(entry: CustomParameterEntry, declaration: CustomParameter): ValidationError[] {
		if (
			entry.value !== undefined &&
			!ToolParameterTypeValidationUtil.isValueValidForType(declaration.type, entry.value)
		) {
			return [new ToolParameterTypeMismatchLoggableException(declaration)];
		}

		return [];
	}
}
