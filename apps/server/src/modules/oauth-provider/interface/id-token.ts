export interface IdToken {
	iframe?: string;
	email?: string;
	name?: string;
	userId?: string;
	schoolId: string;
	groups?: GroupNameIdTuple[];
	userRole?: string[];
	// ToDo: add fedState, if the federalState is migrated to NEST
	// fedState?: string;
}

export interface GroupNameIdTuple {
	displayName: string;
	gid: string;
}
