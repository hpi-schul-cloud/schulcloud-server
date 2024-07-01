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

export const isExternalToolElement = (reference: unknown): reference is ExternalToolElement =>
	reference instanceof ExternalToolElement;
