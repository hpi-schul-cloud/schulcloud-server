import { ObjectId } from '@mikro-orm/mongodb';
import { InputFormat } from '@shared/domain/types';
import { BoardNodeType, RichTextElementProps, ROOT_PATH } from '../../domain';
import { BoardNodeEntityFactory, PropsWithType } from './board-node-entity.factory';

export const richTextElementEntityFactory = BoardNodeEntityFactory.define<PropsWithType<RichTextElementProps>>(
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			title: `rich-text #${sequence}`,
			position: 0,
			children: [],
			text: `<p><b>text</b> #${sequence}</p>`,
			inputFormat: InputFormat.RICH_TEXT_CK5,
			createdAt: new Date(),
			updatedAt: new Date(),
			type: BoardNodeType.RICH_TEXT_ELEMENT,
		};
	}
);
