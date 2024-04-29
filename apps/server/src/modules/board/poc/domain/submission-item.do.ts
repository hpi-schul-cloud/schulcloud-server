import { EntityId } from '@shared/domain/types';
import { BoardNode } from './board-node.do';
import type { SubmissionItemProps } from './types';

export class SubmissionItem extends BoardNode<SubmissionItemProps> {
	get completed(): boolean {
		return this.props.completed ?? false;
	}

	set completed(value: boolean) {
		this.props.completed = value;
	}

	get userId(): EntityId {
		return this.props.userId ?? '';
	}

	set userId(value: EntityId) {
		this.props.userId = value;
	}

	canHaveChild(): boolean {
		return false;
	}
}
