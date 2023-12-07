import { EntityId } from '@shared/domain/types';
import { DeletionRequestBodyProps } from '../controller/dto';
import { DeletionDomainModel } from '../domain/types';

export class DeletionRequestBodyPropsBuilder {
	static build(domain: DeletionDomainModel, id: EntityId, deleteInMinutes?: number): DeletionRequestBodyProps {
		const deletionRequestItem = {
			targetRef: { domain, id },
			deleteInMinutes,
		};

		return deletionRequestItem;
	}
}
