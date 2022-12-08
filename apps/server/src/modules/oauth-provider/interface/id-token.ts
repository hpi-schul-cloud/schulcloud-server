export interface IdToken {
	iframe?: string;
	email?: string;
	name?: string;
	userId?: string;
	schoolId: string;
	groups?: GroupNameIdTuple[];
	alias?: string;
	// ToDo: add classes and fed_state, if they are migrated to NEST
	// fed_state?: string;
	// classes?: string[];
}

export interface GroupNameIdTuple {
	displayName: string;
	gid: string;
}
