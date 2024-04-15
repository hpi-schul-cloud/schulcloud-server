export type DatesToStrings<T> = {
	[k in keyof T]: T[k] extends Date ? string : DatesToStrings<T[k]>;
};
