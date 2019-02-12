const auth = require('feathers-authentication');
const { importSchema } = require('graphql-import');
const { ApolloServer, gql } = require('apollo-server-express');
const request = require('request-promise-native');

const typeDefs = importSchema('./src/services/editor/model/schema.graphql'); // startpoint is the root folder from server

const { userModel } = require('../user/model');

const options = (userId) => {
	return {
		uri: `http://localhost:3030/users/${userId}`,
		headers: {
			Authorization: userId,
		},
		json: true,
		method: 'get',
		timeout: 2000,
		//	body: {"data": [{"type": "event"}]},
	};
};

const configureResolvers = (app) => {
	return {
		Query: {
			hello: (root, args, context) => `${args.firstpart} hello world!`,
			model: (root, args, context) => userModel.findOne({ _id: args.id }),
			useService: (root, args, context) => app.service('resolve/users/').get(args.id),
			req: (root, args, context) => (() => {
				return {bla:'string'}
				/* return request(options(args.id)).then((data) => {
					return data;
				}),	 */
			})(),
		},
	};
};

module.exports = function () {
	const app = this;

	const server = new ApolloServer({
		typeDefs,
		resolvers: configureResolvers(app),
		context: ({ req }) => {
			// get the user token from the headers
			console.log("startCheck");
			const token = req.headers.authorization || '';
			console.log(token);

			const check = auth.hooks.authenticate('jwt')({
				type: 'before',
				method: 'get',
				path:'test/',
				params: {authorization:'dasdas', provider:'rest'}
			});

			

			// try to retrieve a user with the token
			check.then(data=>{
				console.log(data);
			}).catch(err=>{
				console.log('err',err);
			});
			const user = false;
		   
			// optionally block the user
			// we could also check user roles/permissions here
			if (!user) throw new Error('you must be logged in'); 
		   
			const userData = { 
				"_id" : ObjectId("0000d213816abba584714c0a"), 
				"__v" : NumberInt(0), 
				"firstName" : "Thorsten", 
				"lastName" : "Test", 
				"email" : "admin@schul-cloud.org", 
				"updatedAt" : ISODate("2018-10-18T09:06:20.698+0000"), 
				"birthday" : ISODate("1977-01-01T11:25:43.556+0000"), 
				"createdAt" : ISODate("2017-01-01T00:06:37.148+0000"), 
				"preferences" : {
					"firstLogin" : true, 
					"releaseDate" : "2018-10-16T10:34:31.000Z"
				}, 
				"schoolId" : ObjectId("0000d186816abba584714c5f"), 
				"roles" : [
					ObjectId("0000d186816abba584714c96"), 
					ObjectId("0000d186816abba584714c97")
				], 
				"gender" : null
			}; 

			// add the user to the context
			return {account:{ 
					"_id" : ObjectId("0000d213816abba584714caa"), 
					"username" : "admin@schul-cloud.org", 
					"password" : "$2a$10$AzVOR/1BubLz105zInNDG.Mi.0xUXe3GO1DUO6CqjzZyNzhIhfpQW", 
					"updatedAt" : ISODate("2018-09-24T09:07:40.432+0000"), 
					"createdAt" : ISODate("2017-01-01T00:06:37.148+0000"), 
					"userId" : ObjectId("0000d213816abba584714c0a"), 
					"__v" : NumberInt(0), 
					"activated" : true
				}
		   }
		}
	});


	server.applyMiddleware({ app });

	app.listen({ port: 4000 }, () => console.log(`GraphQL endpoint ready at port 4000, ${server.graphqlPath}`))
};
