import { ValidationError } from 'class-validator';

export interface MediaQueryBadResponseReport {
	mediumId: string;
	status: number;
	validationErrors: ValidationError[];
}
