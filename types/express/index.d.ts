// This file extends missing type definitions

declare namespace Express {
	export interface Request {
		/** Timestamp as number */
		leadTime: number;
	}
}
