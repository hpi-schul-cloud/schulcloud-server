export interface JsonAccount {
	_id: {
		$oid: string;
	};
	username: string;
	password: string;
	systemId?: string;
	userId: {
		$oid: string;
	};
}
