import { EntityId } from '../../../types';
import { BoardComposite, BoardCompositeProps } from '../board-composite.do';
import type { BoardCompositeVisitor, BoardCompositeVisitorAsync } from '../types';

export class MediaExternalToolElement extends BoardComposite<MediaExternalToolElementProps> {
	get contextExternalToolId(): EntityId {
		return this.props.contextExternalToolId;
	}

	set contextExternalToolId(id: EntityId) {
		this.props.contextExternalToolId = id;
	}

	isAllowedAsChild(): boolean {
		return false;
	}

	accept(visitor: BoardCompositeVisitor): void {
		visitor.visitMediaExternalToolElement(this);
	}

	async acceptAsync(visitor: BoardCompositeVisitorAsync): Promise<void> {
		await visitor.visitMediaExternalToolElementAsync(this);
	}
}

export interface MediaExternalToolElementProps extends BoardCompositeProps {
	contextExternalToolId: EntityId;
}

export type MediaExternalToolElementInitProps = Omit<MediaExternalToolElementProps, keyof BoardCompositeProps>;

export function isMediaExternalToolElement(reference: unknown): reference is MediaExternalToolElement {
	return reference instanceof MediaExternalToolElement;
}
