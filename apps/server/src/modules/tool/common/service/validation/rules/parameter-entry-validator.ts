import { ValidationError } from '@shared/common/error';
import { EntityId } from '@shared/domain/types';
import { CustomParameter, CustomParameterEntry } from '../../../domain';

export interface ParameterEntryValidator {
	validate(entry: CustomParameterEntry, declaration: CustomParameter, toolId: EntityId | undefined): ValidationError[];
}
