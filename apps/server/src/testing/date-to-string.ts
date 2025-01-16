export type DateToString<T> = T extends Date ? string : T extends object ? { [K in keyof T]: DateToString<T[K]> } : T;
