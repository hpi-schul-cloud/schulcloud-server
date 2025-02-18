type BoardNode = {
	traits: Record<string, boolean>;
	properties: Record<string, unknown>;
};

type WithChildren = BoardNode & {
	getChildren: BoardNode[];
};

// const iswithChildren = (reference: unknown): reference is withChildren => reference.withChildren();

const useHasChildren = (obj: BoardNode): WithChildren => {
	obj.traits.withChildren = true;
	obj.getChildren = () => obj.properties.children;
	return obj;
};

const createCard: BoardNode = () => {
	const { withChildren, children } = useHasChildren({ children: [] });

	return {
		withChildren,
		children,
	};
};
