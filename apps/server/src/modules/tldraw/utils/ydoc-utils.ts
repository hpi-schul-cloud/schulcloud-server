export const calculateDiff = (diff: Uint8Array): number =>
	diff.reduce((previousValue, currentValue) => previousValue + currentValue, 0);
