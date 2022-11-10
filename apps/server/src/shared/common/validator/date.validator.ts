import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isBefore', async: false })
export class IsBeforeConstraint implements ValidatorConstraintInterface {
	validate(propertyValue: Date, args: ValidationArguments) {
		return propertyValue < args.object[args.constraints[0] as unknown as string];
	}

	defaultMessage(args: ValidationArguments) {
		return `${args.property} must be before ${args.constraints[0] as unknown as string}`;
	}
}
