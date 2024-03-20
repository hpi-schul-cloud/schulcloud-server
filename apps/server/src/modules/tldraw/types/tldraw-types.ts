export enum TldrawShapeType {
	Sticky = 'sticky',
	Ellipse = 'ellipse',
	Rectangle = 'rectangle',
	Triangle = 'triangle',
	Draw = 'draw',
	Arrow = 'arrow',
	Line = 'line',
	Text = 'text',
	Group = 'group',
	Image = 'image',
	Video = 'video',
}

export type TldrawShape = {
	id: string;
	type: TldrawShapeType;
	assetId?: string;
};

export type TldrawAsset = {
	id: string;
	type: TldrawShapeType;
	name: string;
	src: string;
};
