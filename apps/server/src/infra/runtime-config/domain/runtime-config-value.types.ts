export interface RuntimeConfigValueLike {
	getKey(): string;
	getTypeAndValue(): { type: 'string' | 'number' | 'boolean' };
}
