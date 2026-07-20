export interface SchoolReferenceLike {
	id?: string;
}

export interface SystemReferenceLike {
	id?: string;
}

export interface SchoolSystemOptionsLike {
	school?: SchoolReferenceLike;
	system?: SystemReferenceLike;
}

export interface UserLoginMigrationLike {
	school?: SchoolReferenceLike;
}
