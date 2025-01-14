// eslint-disable-next-line max-classes-per-file
import { IsString, MaxLength, MinLength, validateSync } from 'class-validator';
import { BaseValueObject, ValueObjectProps, ValueObjectTyp } from './value-object';
import { plainToClassFromExist } from 'class-transformer';

interface ValueObject {
	equals(vo: unknown): boolean;
}

// target ist eigentlich TestName und der return Wert soll TestName.constructor & ValueObject sein.
function ValueObjectTest2(
	// eslint-disable-next-line @typescript-eslint/ban-types
	target: new (...args: any) => {}
): any {
	class SpecificValueObject extends target implements ValueObject {
		public static _type = 'ValueObject';

		constructor(...args: any[]) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			super(...args);
			validateSync(this);
		}

		public equals(vo: SpecificValueObject): boolean {
			return vo.constructor === this.constructor;
		}
	}

	return SpecificValueObject; // as cast?
}

@ValueObjectTest2
class TestName2 {
	@IsString()
	@MaxLength(3)
	@MinLength(1)
	public readonly name: string;
}

const x2 = new TestName2();
console.log(x2);

// ============================================================
function ValueObjectTest3<T extends ValueObjectProps>(propsClass: T) {
	return function ValueObjectConverter(): BaseValueObject<T> {
		class SpecificValueObjectClass extends BaseValueObject<T> {
			public static _type = 'ValueObject';

			constructor() {
				super(propsClass);
				Object.assign(this, plainToClassFromExist(this, propsClass));
				validateSync(this);
			}
		}

		return SpecificValueObjectClass;
	};
}

class TestNameProps {
	@IsString()
	@MaxLength(3)
	@MinLength(1)
	public readonly name!: string;
}

@ValueObjectTest3(TestNameProps)
class TestName {}

const x = new TestName({ name: 'abc'});
console.log(x);
