export interface SchoolReferenceLike {
	id?: string;
}

export interface SystemReferenceLike {
	id?: string;
	type?: string;
	ldapConfig?: {
		active?: boolean;
	};
}

export interface SchoolSystemOptionsLike {
	school?: SchoolReferenceLike;
	system?: SystemReferenceLike;
}

export interface UserLoginMigrationLike {
	id?: string;
	school?: SchoolReferenceLike;
	externalId?: string;
	previousExternalId?: string;
	lastLoginSystemChange?: Date;
	outdatedSince?: Date;
}
