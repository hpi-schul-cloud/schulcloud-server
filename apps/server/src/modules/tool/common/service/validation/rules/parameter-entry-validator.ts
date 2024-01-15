import { ValidationError } from '@shared/common';
import { CustomParameter, CustomParameterEntry } from '../../../domain';

export interface ParameterEntryValidator {
	validate(entry: CustomParameterEntry, declaration: CustomParameter): ValidationError[];
}
