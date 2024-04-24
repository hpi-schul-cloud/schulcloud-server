import { ValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { CustomParameter, CustomParameterEntry, ToolParameterValueRegexLoggableException } from '../../../domain';
import { ParameterEntryValidator } from './parameter-entry-validator';

export class ParameterEntryRegexValidator implements ParameterEntryValidator {
	public validate(
		entry: CustomParameterEntry,
		declaration: CustomParameter,
		toolId: EntityId | undefined
	): ValidationError[] {
		if (entry.value !== undefined && declaration.regex && !new RegExp(declaration.regex).test(entry.value)) {
			return [new ToolParameterValueRegexLoggableException(toolId, declaration)];
		}

		return [];
	}
}
