export interface ArixSearchCondition {
	// TODO: add more fields
	field: 'text' | 'titel' | 'text_fields' | 'titel_fields';
	value: string;
	operator?: 'or' | 'and';
	option?: 'begin' | 'word';
}
