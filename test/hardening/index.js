/** 

	execute with mocha ----delay and force test run with run()
	
**/
const mongoose = require('mongoose');

const host=process.env.HOST||'http://localhost:3030';
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const should = chai.should();
const c = require('./components/');

let tests={};

//methods: [ 'find', 'post', 'get', 'put', 'patch', 'delete' ]
tests.find = (route,login)=>{ 	
		const code    = route.code||200;
		const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
		it(message, done=>{		//replace with which code is expected 
			login.agent
			.get(route.route)
			.set('Authorization',login.Authorization)
			.query(route.query||{})
			.end((err, response)=>{
				if(err) done(err);
				//console.log('<------------------------------------------------>');
				//console.log( response.status );
				
				
				if(response.body.data){
					response.body.data.should.be.a('array');
				//	console.log( response.body.data.length );
				}
				should.not.exist(err);
				response.should.have.status(code);
				done();
			});
		})
}

tests.post = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}

tests.get = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}

tests.put = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}

tests.patch = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}

tests.delete = (route,login)=>{
	const code    = route.code||200;
	const message = 'route='+route.name+' methode=get role='+login.name+(code!=200 ? ' code='+code : '');
	it(message, done=>{
		done();
	});
}



//create login accounts
new Promise( (resolve,reject)=>{
	mongoose.model('role').find({},(err,roles)=>{
		if(err){
			console.log('Can not read roles.',err);
			reject(err);
		}
		resolve(roles);
	});
}).then(roles=>{	
	return c.createLogins({
		roles:roles,
		routes:c.getAllRoutes()
	}).catch(err =>{
		console.log('Can not create login data',err);
		throw err
	});		
}).catch(err=>{
	console.log('test data can not create.',err);
})
.then(data=>{		
	//execute tests
	describe('route testing.. \n', ()=> {
		const routeKeys = Object.entries( data.routes );
		const loginKeys = Object.entries( data.logins );
		routeKeys.forEach( ([routeKey,route])=>{	
			describe('['+route.name+']\n', ()=> {
					//execute every role for every existing methods 
					route.methods.forEach(method=>{
						describe('		<'+method+'>\n', ()=> {
							loginKeys.forEach(([loginKey,login])=>{
								if(tests[method]){						
									tests[method](route,login);
								}else{
									throw new Error('The methode '+method+' is not defined. Only '+Object.keys(tests).join(',')+' are defined.');
								}
							});
						}); //describe close
					});	
				
			}); //describe close	
		});	

		after( ()=>{
			return c.clearLogins(data);
		});
	});
	
	
	run();	//force to start tests 
	
}).catch(err=>{
	console.log('Test can not execute.',err);
});
