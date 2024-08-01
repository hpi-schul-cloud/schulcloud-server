import { TypeGuard, PrimitiveType, PrimitiveTypeArray } from '@shared/common';

type ValueObjectTyp = PrimitiveType | PrimitiveTypeArray;

/**
 * DDD Base object type
 */
export abstract class ValueObject<T extends ValueObjectTyp> {
	public readonly value: T;

	constructor(props: T) {
		this.value = Object.freeze(props);
	}

	/** The equal methode check the value not the reference. */
	public equals(vo: ValueObject<T>): boolean {	
		if (!TypeGuard.isSameClassTyp(this, vo)) {
			return false;
		}

		let isEqual = false;
		if (TypeGuard.isPrimitiveType(vo.value) && vo.value === this.value) {
			isEqual = true;
		} 
		else if (TypeGuard.isArray(vo.value) && TypeGuard.isArray(this.value) && TypeGuard.isShallowEqualArray(this.value, vo.value)) {
			isEqual = true;
		}

		return isEqual;
	}
}
