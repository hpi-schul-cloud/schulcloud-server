export type BoardNodeType = 'ROOT' | 'COLUMN' | 'CARD' | 'ELEMENT' | 'TASK';

export type BoardNodeEntity = {
	id: string;
	children: BoardNodeEntity[];
	type: BoardNodeType;
};

export const MockData: BoardNodeEntity = {
	id: '1',
	type: 'ROOT',
	children: [
		{
			id: '2',
			type: 'COLUMN',
			children: [
				{
					id: '3',
					type: 'CARD',
					children: [
						{
							id: '4',
							type: 'ELEMENT',
							children: [],
						},
						{
							id: '5',
							type: 'TASK',
							children: [],
						},
					],
				},
			],
		},
	],
};
