export class Builder<T> {
	protected readonly product: T;

	private readonly validator: (product: T) => boolean;

	constructor(init: T, validator: (product: T) => boolean = () => true) {
		this.product = init;
		this.validator = validator;
	}

	build(): T {
		if (!this.validator(this.product)) {
			throw new Error();
		}
		return this.product;
	}
}
