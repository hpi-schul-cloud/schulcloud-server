export type CreationProtocol = {
	id: string | undefined;
	key?: string;
	type: string;
	children?: CreationProtocol[];
};
