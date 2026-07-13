import { type ValidationError } from '@shared/common/error';
import { type EntityId } from '@shared/domain/types';
import {
	type CustomParameter,
	type CustomParameterEntry,
	ToolParameterMandatoryValueMissingLoggableException,
	ToolParameterOptionalValueMissingLoggableException,
} from '../../../domain';
import { type ParameterEntryValidator } from './parameter-entry-validator';

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
