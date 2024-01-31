export interface ArixLinkRequest {
	link: {
		user: string; // uuid
		id: string; // id from notch
		value: string; // PHRASE= md5-Hash von angeforderter Notch : Passwort
	};
}
