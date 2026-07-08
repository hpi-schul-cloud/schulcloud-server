import { type EntityId } from '@shared/domain/types';
import { type AnyProvisioningOptions } from '../domain';

export interface ProvisioningOptionsUpdateHandler<T extends AnyProvisioningOptions = AnyProvisioningOptions> {
	handleUpdate(schoolId: EntityId, systemId: EntityId, newOptions: T, oldOptions: T): Promise<void>;
}
