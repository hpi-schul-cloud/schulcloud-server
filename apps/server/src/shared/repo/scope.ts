import { FilterQuery } from '@mikro-orm/core';
import { EmptyResultQuery } from './query/empty-result.query';

const isDefined = (input) => input !== null && input !== undefined;

export function saveSelect<TT, ST>(testedDefinedvalue: TT, selectedValue: ST): ST | typeof EmptyResultQuery {
	return isDefined(testedDefinedvalue) ? selectedValue : EmptyResultQuery;
}

function forceArray<T>(input: Array<T>): Array<T> {
	return Array.isArray(input) ? input : [];
}

export function createOrQueryFromList<T>(
	list: Array<T>,
	selectedKey: string,
	targetKey: string
): { $or: Array<Record<string, Partial<T>>> } {
	function executeMapping(element: T): Record<string, Partial<T>> {
		const value = element[selectedKey] as T;

		return { [targetKey]: value };
	}
	const $or = forceArray(list).map(executeMapping);
	return { $or };
}

export class Scope<T> {
	private _queries: FilterQuery<T>[] = [];

	get query(): FilterQuery<T> {
		if (this._queries.length === 0) {
			return EmptyResultQuery as FilterQuery<T>;
		}
		const query = this._queries.length > 1 ? { $and: this._queries } : this._queries[0];
		return query as FilterQuery<T>;
	}

	addQuery(query: FilterQuery<T>): void {
		this._queries.push(query);
	}

	saveSelect = saveSelect;

	createOrQueryFromList = createOrQueryFromList;
}
