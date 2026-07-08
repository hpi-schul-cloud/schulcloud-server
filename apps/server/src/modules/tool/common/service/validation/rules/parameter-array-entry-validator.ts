import { type ValidationError } from '@shared/common/error';
import { type EntityId } from '@shared/domain/types';
import {
	type CustomParameter,
	type CustomParameterEntry,
	ToolParameterRequiredLoggableException,
} from '../../../domain';
import { type ParameterArrayValidator } from './parameter-array-validator';
import { ParameterEntryRegexValidator } from './parameter-entry-regex-validator';
import { ParameterEntryTypeValidator } from './parameter-entry-type-validator';
import { type ParameterEntryValidator } from './parameter-entry-validator';
import { ParameterEntryValueValidator } from './parameter-entry-value-validator';

export class ParameterArrayEntryValidator implements ParameterArrayValidator {
	private readonly entryValidators: ParameterEntryValidator[] = [
		new ParameterEntryValueValidator(),
		new ParameterEntryTypeValidator(),
		new ParameterEntryRegexValidator(),
	];

	public validate(
		entries: CustomParameterEntry[],
		declarations: CustomParameter[],
		toolId: EntityId | undefined
	): ValidationError[] {
		const errors: ValidationError[] = [];

		for (const param of declarations) {
			const foundEntry: CustomParameterEntry | undefined = entries.find(
				({ name }: CustomParameterEntry): boolean => name === param.name
			);

			if (foundEntry) {
				this.entryValidators.forEach((validator: ParameterEntryValidator) => {
					const entryErrors: ValidationError[] = validator.validate(foundEntry, param, toolId);

					errors.push(...entryErrors);
				});
			}
			if (!foundEntry && !param.isOptional) {
				errors.push(new ToolParameterRequiredLoggableException(toolId, param));
			}
		}

		return errors;
	}
}
