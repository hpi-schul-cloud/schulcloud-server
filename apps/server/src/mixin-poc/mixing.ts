/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BoardNodeEntity, BoardNodeType, MockData } from './poc-data';

type Constructor<T extends Base> = new (...args: any[]) => T;

// This can live anywhere in your codebase:
function applyMixins(derivedCtor: any, constructors: any[]) {
	constructors.forEach((baseCtor) => {
		Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
			Object.defineProperty(
				derivedCtor.prototype,
				name,
				Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
			);
		});
	});
}

abstract class Base {
	protected id: string;

	public type: BoardNodeType;

	constructor(props: BoardNodeEntity) {
		this.id = props.id;
		this.type = props.type;
	}
}

class Taskable extends Base {
	public isTask() {
		return this.type === 'TASK';
	}
}

class Elementable extends Base {
	public isElement() {
		return this.type === 'ELEMENT';
	}
}

class Cardable extends Base {
	public isCard() {
		return this.type === 'CARD';
	}
}

class Columnable extends Base {
	public isColumn() {
		return this.type === 'COLUMN';
	}
}

class Rootable extends Base {
	public isRoot() {
		return this.type === 'ROOT';
	}
}

export class BoardNode extends Base {
	public children: BoardNode[];

	public static load() {
		return new BoardNode(MockData);
	}

	constructor(props: BoardNodeEntity) {
		super(props);
		this.children = props.children.map((child) => new BoardNode(child));
	}
}

export interface BoardNode extends Rootable, Columnable, Cardable, Elementable, Taskable {}

applyMixins(BoardNode, [Rootable, Columnable, Cardable, Elementable, Taskable]);
