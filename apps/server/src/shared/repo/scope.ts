import { FilterQuery } from '@mikro-orm/core';
import { EmptyResultQuery } from './query/empty-result.query';

type EmptyResultQueryType = typeof EmptyResultQuery;

export function isDefined<T>(input: T): boolean {
	return input !== null && input !== undefined;
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
}
