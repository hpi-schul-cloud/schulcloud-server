import { type BusinessError } from '@shared/common/error';
import { type EntityId } from '@shared/domain/types';
import {
	type CustomParameter,
	type CustomParameterEntry,
	ToolParameterTypeMismatchLoggableException,
} from '../../../domain';
import { ToolParameterTypeValidationUtil } from '../tool-parameter-type-validation.util';
import { type ParameterEntryValidator } from './parameter-entry-validator';

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
