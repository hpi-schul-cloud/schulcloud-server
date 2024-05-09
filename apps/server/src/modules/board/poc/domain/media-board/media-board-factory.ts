import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

import { ROOT_PATH } from '../path-utils';
import { BoardExternalReference, BoardNodeProps } from '../types';
import { MediaBoard, MediaLine, MediaExternalToolElement } from '.';

@Injectable()
export class MediaBoardFactory {
	buildMediaBoard(props: { context: BoardExternalReference }): MediaBoard {
		const mediaBoard = new MediaBoard({ ...this.getBaseProps(), ...props });

		return mediaBoard;
	}

	buildMediaLine(props: { title: string }): MediaLine {
		const mediaLine = new MediaLine({ ...this.getBaseProps(), ...props });

		return mediaLine;
	}

	buildExternalToolElement(props: { contextExternalToolId: EntityId }): MediaExternalToolElement {
		const mediaExternalToolElement = new MediaExternalToolElement({ ...this.getBaseProps(), ...props });

		return mediaExternalToolElement;
	}

	private getBaseProps(): BoardNodeProps {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
}
