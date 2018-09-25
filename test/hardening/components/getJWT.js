'use strict';
const logger = require('winston');
const host=process.env.HOST||'http://localhost:3030';
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

module.exports = (data) => { //username, password
	logger.info('Take token for '+data.username+'...');
	const agent = chai.request.agent(host);
	data.strategy = 'local';
    return new Promise((resolve, reject) => {
        agent.post('/authentication')
            .send(data)
            .end((err, response) => {
                if(err){ 
					logger.error('Can not take token for user '+data.username+' throw an error.');
					throw err	
				};
				if(response===undefined){
					throw new Error('Can not take token for user '+data.username+'. The response is undefined');
				}
                resolve({agent,'Authorization':(response.body||{}).accessToken});
            });
    }).catch(err=>{
		logger.error(err);
	});
};