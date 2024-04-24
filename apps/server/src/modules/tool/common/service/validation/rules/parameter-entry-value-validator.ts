import { ValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { CustomParameter, CustomParameterEntry, ToolParameterValueMissingLoggableException } from '../../../domain';
import { ParameterEntryValidator } from './parameter-entry-validator';

export class ParameterEntryValueValidator implements ParameterEntryValidator {
	public validate(
		entry: CustomParameterEntry,
		declaration: CustomParameter,
		toolId: EntityId | undefined
	): ValidationError[] {
		if (entry.value === undefined || entry.value === '') {
			return [new ToolParameterValueMissingLoggableException(toolId, declaration)];
		}

		return [];
	}
}
