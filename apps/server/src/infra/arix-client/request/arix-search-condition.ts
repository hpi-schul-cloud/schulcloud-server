export interface ArixSearchCondition {
	// TODO: add more fields and operators
	field: 'text' | 'titel' | 'text_fields' | 'titel_fields';
	value: string;
	operator: 'or' | 'and';
	option: 'begin' | 'word';
}
