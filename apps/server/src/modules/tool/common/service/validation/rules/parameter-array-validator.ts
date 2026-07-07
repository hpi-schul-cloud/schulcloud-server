import { type ValidationError } from '@shared/common/error';
import { type EntityId } from '@shared/domain/types';
import { type CustomParameter, type CustomParameterEntry } from '../../../domain';

export interface ParameterArrayValidator {
	validate(
		entries: CustomParameterEntry[],
		declarations: CustomParameter[],
		toolId: EntityId | undefined
	): ValidationError[];
}
