export interface IJsonUser {
	_id: {
		$oid: string;
	};
	firstName: string;
	lastName: string;
	email: string;
}
