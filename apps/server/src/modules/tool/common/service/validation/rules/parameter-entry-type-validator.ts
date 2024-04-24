import { BusinessError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { CustomParameter, CustomParameterEntry, ToolParameterTypeMismatchLoggableException } from '../../../domain';
import { ToolParameterTypeValidationUtil } from '../tool-parameter-type-validation.util';
import { ParameterEntryValidator } from './parameter-entry-validator';

export class ParameterEntryTypeValidator implements ParameterEntryValidator {
	public validate(
		entry: CustomParameterEntry,
		declaration: CustomParameter,
		toolId: EntityId | undefined
	): BusinessError[] {
		if (
			entry.value !== undefined &&
			!ToolParameterTypeValidationUtil.isValueValidForType(declaration.type, entry.value)
		) {
			return [new ToolParameterTypeMismatchLoggableException(toolId, declaration)];
		}

		return [];
	}
}
