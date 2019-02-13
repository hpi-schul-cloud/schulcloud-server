/*
TODO:
 - put pubsub in context
    import { PubSub } from 'graphql-subscriptions';

    export const pubsub = new PubSub();

 - jwt check, provide current user

 - import relevant models here and share them via context
*/
/*
const options = userId => {
	return {
		uri: `http://localhost:3030/users/${userId}`,
		headers: {
			Authorization: userId,
		},
		json: true,
		method: "get",
		timeout: 2000,
		//	body: {"data": [{"type": "event"}]},
	};
};
*/
function createContext(app) {
	return ({ req }) => {
		return;
		// get the user token from the headers
		console.log("startCheck");
		const token = req.headers.authorization || "";
		console.log(token);

		const check = auth.hooks.authenticate("jwt")({
			type: "before",
			method: "get",
			path: "test/",
			params: { authorization: "dasdas", provider: "rest" },
		});

		// try to retrieve a user with the token
		check
			.then(data => {
				console.log(data);
			})
			.catch(err => {
				console.log("err", err);
			});
		const user = false;
		// optionally block the user
		// we could also check user roles/permissions here
		if (!user) throw new Error("you must be logged in");
		const userData = {
			_id: "0000d213816abba584714c0a",
			__v: 0,
			firstName: "Thorsten",
			lastName: "Test",
			email: "admin@schul-cloud.org",
			updatedAt: "2018-10-18T09:06:20.698+0000",
			birthday: "1977-01-01T11:25:43.556+0000",
			createdAt: "2017-01-01T00:06:37.148+0000",
			preferences: {
				firstLogin: true,
				releaseDate: "2018-10-16T10:34:31.000Z",
			},
			schoolId: "0000d186816abba584714c5f",
			roles: ["0000d186816abba584714c96", "0000d186816abba584714c97"],
			gender: null,
		};

		// add the user to the context
		return {
			account: {
				_id: "0000d213816abba584714caa",
				username: "admin@schul-cloud.org",
				password:
					"$2a$10$AzVOR/1BubLz105zInNDG.Mi.0xUXe3GO1DUO6CqjzZyNzhIhfpQW",
				updatedAt: "2018-09-24T09:07:40.432+0000",
				createdAt: "2017-01-01T00:06:37.148+0000",
				userId: "0000d213816abba584714c0a",
				__v: 0,
				activated: true,
			},
		};
	};
}

module.exports = { createContext };
