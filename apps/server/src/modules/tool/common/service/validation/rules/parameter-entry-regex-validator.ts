import { type ValidationError } from '@shared/common/error';
import { type EntityId } from '@shared/domain/types';
import {
	type CustomParameter,
	type CustomParameterEntry,
	ToolParameterValueRegexLoggableException,
} from '../../../domain';
import { type ParameterEntryValidator } from './parameter-entry-validator';

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
