export function isFulfilled<T>(input: PromiseSettledResult<T>): input is PromiseFulfilledResult<T> {
	return input.status === 'fulfilled';
}

export function getResolvedValues<T>(result: PromiseSettledResult<T>[]): T[] {
	const resolvedPromises: PromiseFulfilledResult<T>[] = result.filter(isFulfilled);
	const values = resolvedPromises.map((item) => item.value);

	return values;
}
