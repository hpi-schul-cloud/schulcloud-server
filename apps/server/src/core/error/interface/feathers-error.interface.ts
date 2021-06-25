// import { FeathersError } from '@feathersjs/errors';

export interface FeathersError extends Error {
	code: number;
	className: string;
	type: string;
}
