export type SchoolExternalToolQueryInput = {
	schoolId?: string;
	toolId?: string;
};

export type SchoolExternalToolQuery = {
	schoolId?: string;
	toolId?: string;
	isDeactivated?: boolean;
};
