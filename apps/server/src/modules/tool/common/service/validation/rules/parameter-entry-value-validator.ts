import { ValidationError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import {
	CustomParameter,
	CustomParameterEntry,
	ToolParameterMandatoryValueMissingLoggableException,
} from '../../../domain';
import { ToolParameterOptionalValueMissingLoggableException } from '../../../domain/error/tool-parameter-optional-value-missing-loggable-exception';
import { ParameterEntryValidator } from './parameter-entry-validator';

export class ParameterEntryValueValidator implements ParameterEntryValidator {
	public validate(
		entry: CustomParameterEntry,
		declaration: CustomParameter,
		toolId: EntityId | undefined
	): ValidationError[] {
		if (entry.value === undefined || entry.value === '') {
			if (declaration.isOptional) {
				return [new ToolParameterOptionalValueMissingLoggableException(toolId, declaration)];
			}
			return [new ToolParameterMandatoryValueMissingLoggableException(toolId, declaration)];
		}

		return [];
	}
}
