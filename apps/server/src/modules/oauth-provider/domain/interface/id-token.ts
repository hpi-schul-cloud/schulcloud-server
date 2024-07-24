export interface IdToken {
	iframe?: string;

	email?: string;

	name?: string;

	userId?: string;

	schoolId: string;

	groups?: GroupNameIdTuple[];
}

export interface GroupNameIdTuple {
	displayName: string;

	gid: string;
}
