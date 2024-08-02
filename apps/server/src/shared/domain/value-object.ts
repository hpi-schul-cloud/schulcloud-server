import { TypeGuard, PrimitiveType, PrimitiveTypeArray } from '@shared/common';

type ValueObjectTyp = PrimitiveType | PrimitiveTypeArray;

export abstract class ValueObject<T extends ValueObjectTyp> {
	public readonly value: T;

	constructor(value: T) {
		// TODO: No Test for the execution order exists for now, but we must clarify if we want first the modifcation, or first the validation
		// For operations with truncat before make more sense. Adding before/after modifications are also possible, but it can be overload the interface
		const modifiedValue = this.modified(value);
		this.checkValue(modifiedValue);
		this.value = Object.freeze(modifiedValue);
	}

	/** Use this method with override for add validations. */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected validation(value: unknown): boolean {
		return true;
	}

	/** Use this method with override for add modifications, before execute the validation. */
	protected modified(value: T): T {
		// TODO: Why eslint think that T is from type any is unlear for me.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return value;
	}

	// TODO: make this method sense if we not can add this as static MyValueObject.isValidValue() ?
	// Should it be optional by adding in extended class, or as abstract that it must be implemented?
	public isValidValue(value: unknown): boolean {
		return this.validation(value);
	}

	// TODO: Same questions make it sense without static? If not than we can change it to private for a less overloaded interface at the value object
	public checkValue(value: unknown): void {
		if (!this.validation(value)) {
			throw new Error(`ValueObject ${this.constructor.name} validation is failed for input ${JSON.stringify(value)}`);
		}
	}

	/** The equal methode of ValueObjects check the value is equal not the reference. */
	public equals(vo: ValueObject<T>): boolean {
		if (!TypeGuard.isSameClassTyp(this, vo)) {
			return false;
		}

		let isEqual = false;
		if (TypeGuard.isPrimitiveType(vo.value) && vo.value === this.value) {
			isEqual = true;
		} else if (
			TypeGuard.isArray(vo.value) &&
			TypeGuard.isArray(this.value) &&
			TypeGuard.isShallowEqualArray(this.value, vo.value)
		) {
			isEqual = true;
		}

		return isEqual;
	}
}
