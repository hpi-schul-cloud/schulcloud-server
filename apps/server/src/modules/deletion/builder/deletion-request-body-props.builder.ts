import { EntityId } from '@shared/domain';
import { DeletionDomainModel } from '../domain/types';
import { DeletionRequestBodyProps } from '../controller/dto';

export class DeletionRequestBodyPropsBuilder {
	static build(domain: DeletionDomainModel, id: EntityId, deleteInMinutes?: number): DeletionRequestBodyProps {
		const deletionRequestItem = {
			targetRef: { domain, id },
			deleteInMinutes,
		};

		return deletionRequestItem;
	}
}
