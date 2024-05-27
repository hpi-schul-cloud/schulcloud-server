import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

import { ROOT_PATH } from '../path-utils';
import { BoardExternalReference, BoardLayout, BoardNodeProps } from '../types';
import { MediaBoard } from './media-board.do';
import { MediaExternalToolElement } from './media-external-tool-element.do';
import { MediaLine } from './media-line.do';
import { MediaBoardColors } from './types';

@Injectable()
export class MediaBoardNodeFactory {
	buildMediaBoard(props: {
		context: BoardExternalReference;
		layout: BoardLayout;
		backgroundColor: MediaBoardColors;
		collapsed: boolean;
	}): MediaBoard {
		const mediaBoard = new MediaBoard({ ...this.getBaseProps(), ...props });

		return mediaBoard;
	}

	buildMediaLine(props: { title: string; backgroundColor: MediaBoardColors; collapsed: boolean }): MediaLine {
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
