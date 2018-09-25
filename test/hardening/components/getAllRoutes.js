const docs = require('../../../src/app').docs.paths;
const logger = require('winston');



module.exports = getAllRoutes = ()=>{
	logger.info('Fetch all routes and methodes from server app...');
	let convert={};
	Object.keys(docs).forEach(path=>{
		
		const methods = Object.keys(docs[path]);
		const modle   = path.indexOf('/{_id}')>-1 ? true : false;
		
		if( !(path.includes('/{_id}') || path.includes('/{id}')) ){
			const index = methods.indexOf('get');
			if(index!==-1){
				methods[index]='find';
			}
		}
		
		const route   = path.replace('/{id}','').replace('/{_id}','').substr(1);
		
		if(convert[route]){
			convert[route].methods=convert[route].methods.concat(methods);
			if(modle) convert[route].modle=modle;
		}else{
			convert[route]={
				modle:modle,
				methods:methods
			}
		}
		convert[route].route='/'+route;
		convert[route].name=route;
	});
	return convert
}