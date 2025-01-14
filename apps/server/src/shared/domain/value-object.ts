import { PrimitiveType, PrimitiveTypeArray } from '@shared/common';
import { plainToClassFromExist } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

export type ValueObjectTyp = PrimitiveType | PrimitiveTypeArray;

export interface ValueObjectProps {
	[index: string]: unknown;
}

export abstract class BaseValueObject<T extends ValueObjectProps | ValueObjectTyp> {
	constructor(props: T) {
		Object.assign(this, plainToClassFromExist(this, props));
		console.log('Ich bin im constructor');
		//this.isValid();
	}

	public validate(): ValidationError[] {
		const result = validateSync(this);
		return result;
	}

	public isValid(): boolean {
		const result = this.validate();
		return result.length === 0;
	}

	public checkValue(): void {
		if (!this.isValid()) {
			throw new Error(`ValueObject ${this.constructor.name} validation is failed for input ${JSON.stringify(this)}`);
		}
	}

	public equals(vo: BaseValueObject<T>): boolean {
		const thisKeys = Object.keys(this);

		for (const key of thisKeys) {
			if (typeof vo !== 'object' || vo === null || !(key in vo) || this[key] !== vo[key]) return false;
		}

		if (vo === this) return true;
		if (vo == null || vo.constructor !== this.constructor) return false;

		return true;
	}
}
