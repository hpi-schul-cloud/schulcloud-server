export interface IJsonUser {
	// please check if the legacy $oid is still needed and remove as cast from used places
	_id: {
		$oid: string;
	};
	firstName: string;
	lastName: string;
	email: string;
}
