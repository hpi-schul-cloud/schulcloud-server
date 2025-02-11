import { ValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { CustomParameter, CustomParameterEntry } from '../../../domain';

export interface ParameterArrayValidator {
	validate(
		entries: CustomParameterEntry[],
		declarations: CustomParameter[],
		toolId: EntityId | undefined
	): ValidationError[];
}
