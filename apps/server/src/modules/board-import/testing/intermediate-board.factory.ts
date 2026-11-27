import { Factory } from 'fishery';
import { INTERMEDIATE_BOARD_VERSION, type IntermediateBoard, IntermediateElementType } from '../domain';

export const intermediateBoardFactory = Factory.define<IntermediateBoard>(({ sequence }) => {
	const board: IntermediateBoard = {
		version: INTERMEDIATE_BOARD_VERSION,
		source: { type: 'test-source', link: `https://source.example/board/${sequence}` },
		title: `Board ${sequence}`,
		description: '',
		sections: [
			{
				title: 'Section',
				cards: [{ title: 'Card', elements: [{ type: IntermediateElementType.TEXT, html: '<p>Text</p>' }] }],
			},
		],
	};

	return board;
});
