import { type ValidationError } from '@shared/common/error';
import { type EntityId } from '@shared/domain/types';
import { type CustomParameter, type CustomParameterEntry } from '../../../domain';

export interface ParameterEntryValidator {
	validate(entry: CustomParameterEntry, declaration: CustomParameter, toolId: EntityId | undefined): ValidationError[];
}
