export interface IJsonAccount {
	// please check if the legacy $oid is still needed and remove as cast from used places
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
