export class Builder<T> {
	protected readonly product: T;

	constructor(init: T) {
		this.product = init;
	}

	build(): T {
		return this.product;
	}
}
