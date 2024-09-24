export interface CollectionDto {
	authorFreetext?: string;
	childCollectionsCount?: number;
	childReferencesCount?: number;
	color?: string;
	description?: string;

	/**
	 * false
	 */
	fromUser: boolean;

	/**
	 * false
	 */
	level0: boolean;
	orderAscending?: boolean;
	orderMode?: string;
	pinned?: boolean;
	scope?: string;
	title: string;
	type: string;
	viewtype: string;
	x?: number;
	y?: number;
	z?: number;
}
