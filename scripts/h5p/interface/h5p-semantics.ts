// Define the structure of H5P semantics as per the H5P specification
// See: https://h5p-schema.sindre.is/semantics.schema.json

export interface H5PSemanticField {
	name: string;
	type: string;
	label: string;
	description?: string;
	entity?: string;
	options?: any[]; // For fields like 'library', 'select', etc.
	fields?: H5PSemanticField[]; // For group/fieldset types
	widget?: string;
	min?: number;
	max?: number;
	step?: number;
	default?: any;
	placeholder?: string;
	importance?: string;
	tags?: string[];
	semantics?: H5PSemanticField[]; // For nested semantics
	optional?: boolean;
	multiple?: boolean;
	validate?: string;
	regexp?: string;
	subContentTypes?: string[];
	contentTypes?: string[];
	libraryOptions?: string[];
	[key: string]: any; // For additional properties
}

export type H5PSemantics = H5PSemanticField[];
