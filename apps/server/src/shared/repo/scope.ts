import { FilterQuery } from '@mikro-orm/core';
import { EmptyResultQuery } from './query/empty-result.query';

type EmptyResultQueryType = typeof EmptyResultQuery;
type QueryObject<T> = Record<string, Partial<T>>;
type OrQuery<T> = { $or: QueryObject<T>[] };

export function isDefined<T>(input: T): boolean {
	return input !== null && input !== undefined;
}

export function isDefinedQuery<T>(input: T): boolean {
	return isDefined(input) && typeof input === 'object' && Object.keys(input).length > 0;
}

// TODO: EmptyResultQuery only include _id maybe undefined is better in this case
export function useQueryIfValueIsDefined<TT, ST>(testedDefinedvalue: TT, query: ST): ST | EmptyResultQueryType {
	let result: ST | EmptyResultQueryType = query;

	if (!isDefined(testedDefinedvalue)) {
		result = EmptyResultQuery;
	}

	if (!isDefinedQuery(query)) {
		result = EmptyResultQuery;
	}

	return result;
}

export function forceArray<T>(input: Array<T>): Array<T> {
	return Array.isArray(input) ? input : [];
}

function isDefinedObjectValue<T>(object: T, key: string): boolean {
	return isDefined(object) && isDefined(key) && isDefined(object[key]);
}

export function createOrQueryFromList<T>(arrayOfObjects: Array<T>, selectedKey: string, targetKey: string): OrQuery<T> {
	const reducer = (accumulator: QueryObject<T>[], currentValue: T) => {
		if (isDefinedObjectValue(currentValue, selectedKey)) {
			const value = currentValue[selectedKey] as Partial<T>;
			const queryElement = { [targetKey]: value };
			accumulator.push(queryElement);
		}
		return accumulator;
	};

	if (isDefined(selectedKey) && isDefined(targetKey)) {
		const arrayOfQuerys = forceArray(arrayOfObjects).reduce(reducer, []);
		return { $or: arrayOfQuerys };
	}
	return { $or: [] };
}

type ScopeOperator = '$and' | '$or';

export class Scope<T> {
	private _queries: FilterQuery<T | EmptyResultQueryType>[] = [];

	private _operator: ScopeOperator;

	constructor(operator: ScopeOperator = '$and') {
		this._operator = operator;
	}

	get query(): FilterQuery<T> {
		if (this._queries.length === 0) {
			return EmptyResultQuery as FilterQuery<T>;
		}
		const query = this._queries.length > 1 ? { [this._operator]: this._queries } : this._queries[0];
		return query as FilterQuery<T>;
	}

	addQuery(query: FilterQuery<T> | EmptyResultQueryType): void {
		this._queries.push(query);
	}

	buildAndAddOrQuery<TT>(arrayOfObjects: TT[], selectedKey: string, targetKey: string): void {
		if (arrayOfObjects.length > 0) {
			const orQuery = createOrQueryFromList(arrayOfObjects, selectedKey, targetKey) as FilterQuery<T>;
			this.addQuery(orQuery);
		}
	}
}
