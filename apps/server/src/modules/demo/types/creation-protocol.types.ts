export type CreationProtocol = {
	id?: string | undefined;
	key?: string | undefined;
	type: string;
	children?: CreationProtocol[] | undefined;
};
