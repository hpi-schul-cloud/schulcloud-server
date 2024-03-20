import { ValidationError } from '@shared/common';
import { CustomParameter, CustomParameterEntry } from '../../../domain';

export interface ParameterArrayValidator {
	validate(entries: CustomParameterEntry[], declarations: CustomParameter[]): ValidationError[];
}
