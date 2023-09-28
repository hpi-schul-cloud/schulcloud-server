export const calculateDiff = (diff: Uint8Array) =>
	diff.reduce((previousValue, currentValue) => previousValue + currentValue, 0);
