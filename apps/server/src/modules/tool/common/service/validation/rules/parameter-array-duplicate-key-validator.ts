import { type ValidationError } from '@shared/common/error';
import { type EntityId } from '@shared/domain/types';
import {
	type CustomParameter,
	type CustomParameterEntry,
	ToolParameterDuplicateLoggableException,
} from '../../../domain';
import { type ParameterArrayValidator } from './parameter-array-validator';

export class ParameterArrayDuplicateKeyValidator implements ParameterArrayValidator {
	public validate(
		entries: CustomParameterEntry[],
		declarations: CustomParameter[],
		toolId: EntityId | undefined
	): ValidationError[] {
		const caseInsensitiveNames: string[] = entries.map(({ name }: CustomParameterEntry) => name.toLowerCase());

		const duplicates: string[] = caseInsensitiveNames.filter(
			(item, index) => caseInsensitiveNames.indexOf(item) !== index
		);

		const uniqueDuplicates: Set<string> = new Set(duplicates);

		const errors: ValidationError[] = Array.from(uniqueDuplicates).map(
			(parameterName: string) => new ToolParameterDuplicateLoggableException(toolId, parameterName)
		);

		return errors;
	}
}
