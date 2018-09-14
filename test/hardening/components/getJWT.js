'use strict';

const host=process.env.HOST||'http://localhost:3030';
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

module.exports = (data) => { //username, password
	const agent = chai.request.agent(host);
	data.strategy = 'local';
    return new Promise((resolve, reject) => {
        agent.post('/authentication')
            .send(data)
            .end((err, response) => {
                if(err) reject(err);		
                resolve({agent,'Authorization':(response.body||{}).accessToken});
            });
    }).catch(err=>{
		throw err
	});
};