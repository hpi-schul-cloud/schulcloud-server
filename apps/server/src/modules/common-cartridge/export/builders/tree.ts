export class TNode<T> {
	private readonly _value: T;

	private readonly _parent: TNode<T> | null = null;

	private readonly _children: TNode<T>[] = [];

	constructor(value: T, parent: TNode<T> | null, children?: TNode<T>[]) {
		this._value = value;
		this._parent = parent;
		this._children = children || [];

		if (this._parent) {
			this._parent.addChild(this);
		}
	}

	public get value(): T {
		return this._value;
	}

	public get parent(): TNode<T> | null {
		return this._parent;
	}

	public get children(): TNode<T>[] {
		return this._children;
	}

	public addChild(child: TNode<T>): void {
		this._children.push(child);
	}
}

export class NTree<T> {
	private readonly _root: TNode<T>[];

	constructor(rootValue: T[]) {
		this._root = rootValue.map((value) => new TNode(value, null));
	}

	public get root(): TNode<T> {
		return this._root;
	}

	public addNode(value: T, parent: TNode<T>): TNode<T> {
		return new TNode(value, parent);
	}

	public traverse(): Record<string, Unkown> {
		return this._root.map((node) => this.traverseNode(node));
	}
}
