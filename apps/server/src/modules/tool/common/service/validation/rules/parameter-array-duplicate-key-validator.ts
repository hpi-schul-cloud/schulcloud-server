import { ValidationError } from '@shared/common';
import { CustomParameter, CustomParameterEntry, ToolParameterDuplicateLoggableException } from '../../../domain';
import { ParameterArrayValidator } from './parameter-array-validator';

export class ParameterArrayDuplicateKeyValidator implements ParameterArrayValidator {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	validate(entries: CustomParameterEntry[], declarations: CustomParameter[]): ValidationError[] {
		const caseInsensitiveNames: string[] = entries.map(({ name }: CustomParameterEntry) => name.toLowerCase());

		const duplicates: string[] = caseInsensitiveNames.filter(
			(item, index) => caseInsensitiveNames.indexOf(item) !== index
		);

		const uniqueDuplicates: Set<string> = new Set(duplicates);

		const errors: ValidationError[] = Array.from(uniqueDuplicates).map(
			(parameterName: string) => new ToolParameterDuplicateLoggableException(parameterName)
		);

		return errors;
	}
}
