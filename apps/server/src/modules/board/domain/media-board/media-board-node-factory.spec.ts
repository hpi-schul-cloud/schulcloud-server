import { ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReference, BoardExternalReferenceType, BoardLayout } from '../types';
import { MediaBoardNodeFactory } from './media-board-node-factory';
import { MediaBoardColors } from './types';

describe(MediaBoardNodeFactory.name, () => {
	const setup = () => {
		const factory = new MediaBoardNodeFactory();
		const context: BoardExternalReference = {
			id: new ObjectId().toHexString(),
			type: BoardExternalReferenceType.User,
		};
		const layout = BoardLayout.GRID;
		const backgroundColor = MediaBoardColors.BLUE;

		return { factory, context, layout, backgroundColor };
	};

	it('build media board', () => {
		const { factory, context, layout, backgroundColor } = setup();

		const mediaBoard = factory.buildMediaBoard({
			context,
			layout,
			backgroundColor,
			collapsed: false,
		});

		expect(mediaBoard).toBeDefined();
	});

	it('build media line', () => {
		const { factory, backgroundColor } = setup();

		const mediaLine = factory.buildMediaLine({ title: 'media line', backgroundColor, collapsed: true });

		expect(mediaLine).toBeDefined();
	});

	it('build external tool element', () => {
		const { factory } = setup();

		const toolElement = factory.buildExternalToolElement({ contextExternalToolId: new ObjectId().toHexString() });

		expect(toolElement).toBeDefined();
	});
});
