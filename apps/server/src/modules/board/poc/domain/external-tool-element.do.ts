import { BoardNode } from './board-node.do';
import type { ExternalToolElementProps } from './types';

export class ExternalToolElement extends BoardNode<ExternalToolElementProps> {
	get contextExternalToolId(): string | undefined {
		return this.props.contextExternalToolId;
	}

	set contextExternalToolId(value: string | undefined) {
		this.props.contextExternalToolId = value;
	}

	canHaveChild(): boolean {
		return false;
	}
}
