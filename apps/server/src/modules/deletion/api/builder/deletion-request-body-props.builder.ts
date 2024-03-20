import { EntityId } from '@shared/domain/types';
import { DeletionRequestBodyProps } from '../controller/dto';
import { DomainName } from '../../domain/types';

export class DeletionRequestBodyPropsBuilder {
	static build(domain: DomainName, id: EntityId, deleteInMinutes?: number): DeletionRequestBodyProps {
		const deletionRequestItem = {
			targetRef: { domain, id },
			deleteInMinutes,
		};

		return deletionRequestItem;
	}
}
