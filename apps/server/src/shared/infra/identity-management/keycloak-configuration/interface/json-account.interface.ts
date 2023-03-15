export interface IJsonAccount {
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
