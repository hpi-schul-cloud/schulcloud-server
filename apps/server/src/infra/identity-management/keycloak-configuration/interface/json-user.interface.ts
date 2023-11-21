export interface JsonUser {
	_id: {
		$oid: string;
	};
	firstName: string;
	lastName: string;
	email: string;
}
