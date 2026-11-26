export enum BoardImportSourceType {
	TASKCARDS = 'taskcards',
}

export interface BoardImportSource {
	type: BoardImportSourceType;
	link: string;
}
