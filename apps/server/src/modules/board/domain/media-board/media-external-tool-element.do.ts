import { EntityId } from '@shared/domain/types';
import type { MediaExternalToolElementProps } from '../types';
import { BoardNode } from '../board-node.do';

export class MediaExternalToolElement extends BoardNode<MediaExternalToolElementProps> {
	get contextExternalToolId(): EntityId {
		return this.props.contextExternalToolId;
	}

	canHaveChild(): boolean {
		return false;
	}
}

// export type MediaExternalToolElementInitProps = Omit<MediaExternalToolElementProps, keyof BoardCompositeProps>;

export const isMediaExternalToolElement = (reference: unknown): reference is MediaExternalToolElement =>
	reference instanceof MediaExternalToolElement;
