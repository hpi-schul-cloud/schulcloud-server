export class Builder<T> {
	protected readonly product: T;

	constructor(init: T) {
		this.product = init;
	}

	public build(): T {
		return this.product;
	}
}
