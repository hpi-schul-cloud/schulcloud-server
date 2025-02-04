import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { DomainName } from '../types';

export interface DeletionBatchProps extends AuthorizableObject {
	name: string;
	targetRefDomain: DomainName;
	targetRefIds: EntityId[];
	createdAt: Date;
	updatedAt: Date;
}

// TODO: tests missing
export class DeletionBatch extends DomainObject<DeletionBatchProps> {
	public getProps(): DeletionBatchProps {
		// Note: Propagated hotfix. Will be resolved with mikro-orm update. Look at the comment in board-node.do.ts.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { domainObject, ...copyProps } = this.props;

		return copyProps;
	}

	get name(): string {
		return this.props.name;
	}

	get targetRefDomain(): DomainName {
		return this.props.targetRefDomain;
	}

	get targetRefIds(): EntityId[] {
		return this.props.targetRefIds;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
