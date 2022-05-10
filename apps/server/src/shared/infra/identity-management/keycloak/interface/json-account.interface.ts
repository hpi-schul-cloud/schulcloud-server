export interface IJsonAccount {
	_id: {
		$oid: string;
	};
	username: string;
	password: string;
	userId: {
		$oid: string;
	};
}
