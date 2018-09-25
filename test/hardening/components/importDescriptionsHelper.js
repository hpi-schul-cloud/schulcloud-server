const logger = require('winston');
const fs = require("fs");
const path = require('path');

let def_roles=undefined;
let def_methodes=['GET','FIND','POST','PUT','PATCH','REMOVE'];	
let def_showErrorNotes=true;

const importDescriptions= (service,route)=>{
	try{
		const pathToFile = path.join(path.resolve(__dirname),'../','services',service+'.json');
		const file = fs.readFileSync(pathToFile);
		const json = JSON.parse(file);

		if( validator(json,service)===false ){
			throw new Error('Validation from service file '+service+' is not valid.'+pathToFile);
		}else{
			//Load moongose model 
			//if model is set, then it is mapped as config for create of model
			//otherwise the moongose model is create with default parameter
			if(json.moongose){
				const path  = createModelPath(json.moongose.path);
				let model = require(path);
				if(json.moongose.model){
					model=model[json.moongose.model];
				}
				json.model=new model(json.model||{});					
				delete json.moongose;
			}
			/*
			//mapped all query obj to query strings 
			if(json.query){
				json.query=objToQuery(json.query);
			}
			
			if(json.responses && json.responses.length>0){
				json.responses.forEach((value,index)=>{
					if(value.query){
						json.responses[index].query=objToQuery(value.query)
					}
				});
			} */
			return json
		}
	}
	catch (err){
		logger.error('For service '+service+' exist no config file. It is important to add it!',def_showErrorNotes ? err : '');
		return null
	}
}

const bashForEachRoute= data=>{
	logger.info('Execute bash for reading all services config response files.');
	Object.entries(data.routes).forEach( ([servicename,route])=>{
		data.routes[servicename].config=importDescriptions(servicename,route);
	});
	return data
}


/** input "user/model.js" is mapped for example by windows to C:\SchulCloud\schulcloud-server-route\test\src\services\user\model.js **/
function createModelPath(rel){
	return path.join(path.resolve(__dirname),'..','..','..','src','services',rel);
}

/*
function objToQuery(obj){
	const entries = Object.entries(obj)
	if(entries.length<=0) return ''
	
	let query='?';
	entries.forEach(([key,value])=>{
		query+= key+'='+value+'&';
	});
	
	return query.slice(0, -1);
}
*/

/*****	example model	***** 
	! model || moongose || model into moongose
	! query from response > query for all
	
	"model":{	//if string dann path to "user/model.js", if object dann key:value
		
	},
	"moongose: {
		path:string,
		model:string
	},
	"id": "string",
	"query":{}
	"responses":[
		{
			"methods":["GET","FIND"],
			"roles":["student","teacher"],
			"code":404,
			"response":{},
			"query":{				//optional für diese request
				"id":"123",			//optional individuelle Daten
				"age":"18"			//optional individuelle Daten 
			}
		}
		
	],
	//for later maybe code for all
}
****************************/
function validator(json,service) {
	/** primary level 0 keys **/
	const keys = Object.keys(json);
	
	keys.forEach(key=>{
		if(['model','id','responses','moongose','query'].includes(key)===false){
			logger.warn('The file for service '+service+', include the key '+key+' it is not a valid key and is ignored.');
		}
	});
	
	// is needed
	if(json.id===undefined){
		logger.error('The file for service '+service+', need the key id.');
		return false
	}
	
	const id=json.id;
	if(typeof id!=='string'){
		logger.error('The file for service '+service+', has wrong type for key id. Valid is string. Found '+(typeof id)+'.');
		return false
	}
	
	// is needed
	const model = json.model;
	const moongose = json.moongose;
	if( !(model || moongose) ){
		logger.error('The file for service '+service+', need the key model.');
		return false	
	}
	
	if(model){
		if(typeof model!=='object'){
			logger.error('The file for service '+service+', has wrong type for model. Valid is object. Found '+(typeof model)+'.');
			return false	
		}
	}
	
	if(moongose){
		if(typeof moongose!=='object'){
			logger.error('The file for service '+service+', has wrong type for moongose. Valid is object. Found '+(typeof moongose)+'.');
			return false	
		}
		if(moongose.path===undefined){
			logger.error('The file for service '+service+'.moongose, need the key path. For example "user/model.js" to link to service/user/model.js .');
			return false
		}
		if( !(typeof moongose.path==='string' && fs.existsSync(createModelPath(moongose.path))) ){
			logger.error('The file for service '+service+'.moongose.path, is not a valid path to a file.'+moongose.path);
			return false
		}
		if(moongose.model && typeof moongose.model!=='string'){
			logger.error('The file for service '+service+'.moongose.model, has wrong type.Valid is string. Found '+(typeof moongose.model)+'.');
			return false
		}
	}
	
	//is optional
	const query = json.query;
	if(query){
		if(typeof query!=='object'){
			logger.error('The file for service '+service+', has wrong type for query. Valid is object. Found '+(typeof query)+'.');
			return false	
		}
	}
	
	// is optional
	if(json.responses){
		const responses = json.responses;
		
		if(Array.isArray(responses)==false){
			logger.error('The file for service '+service+', has wrong type for key responses. Valid is array. Found '+(typeof responses)+'.');
			return false
		}
		
		responses.forEach( (res,index)=>{
			const rKeys = Object.keys(res);
			rKeys.forEach(key=>{
				if(['methods','roles','code','response','query'].includes(key)===false){
					logger.warn('The file for service '+service+'.responses['+index+'], include the key '+key+' it is not a valid key and is ignored.');
				}
			});
			
			// is needed
			if(res.methods===undefined){
				logger.error('The file for service '+service+'.responses['+index+'], need the key methods.');
				return false
			}
			
			const methods = res.methods;
			if(Array.isArray(methods)===false){
				logger.error('The file for service '+service+'.responses['+index+'], has wrong type for key methods. Valid is array. Found '+(typeof methods)+'.');
				return false
			}
			
			methods.forEach(method=>{
				if(def_methodes.includes(method)===false){
					logger.error('The file for service '+service+'.responses['+index+'].methods, include the value '+method+', it is not valid.');
					return false
				}
			});
			
			// is needed
			if(res.roles===undefined){
				logger.error('The file for service '+service+'.responses['+index+'], need the key roles.');
				return false
			}
			
			const roles = res.roles;
			if(Array.isArray(roles)===false){
				logger.error('The file for service '+service+'.responses['+index+'], has wrong type for key roles. Valid is array. Found '+(typeof roles)+'.');
				return false
			}
			
			if(def_roles){
				roles.forEach(role=>{
					if(def_roles.includes(role)===false){
						logger.error('The file for service '+service+'.responses['+index+'].roles, include the value '+role+', it is not a valid.');
						return false
					}
				});
			}			
			
			// is needed code or response but and is also valid
			const code = res.code;
			const response = res.response;
			if( !(code || response) ){
				logger.error('The file for service '+service+'.responses['+index+'], need the key code, and/or response.');
				return false
			}
			
			if( !(typeof code==='string' || typeof code==='number') ){
				logger.error('The file for service '+service+'.responses['+index+'], has wrong type for key code. Valid is string or number. Found '+(typeof code)+'.');
				return false
			}			
			
			if(typeof response!=='object'){
				logger.error('The file for service '+service+'.responses['+index+'], has wrong type for key response. Valid is object. Found '+(typeof response)+'.');
				return false
			}
			
			// is optional 
			if(res.query){
				const query = res.query;
				if(typeof query!=='object'){
					logger.error('The file for service '+service+'.responses['+index+'], has wrong type for key query. Valid is object. Found '+(typeof query)+'.');
					return false
				}
			}
			
		});
	}
	return true
}

const getRoleNames=(nArray,role)=>{
	nArray.push(role.name);
	return nArray
};

module.exports=({roles,methods,showErrorNotes})=>{
	logger.info('Create description reader...');
	if(roles){
		logger.info('Set roles for validation test...');
		def_roles=roles.reduce(getRoleNames,[]);
	}
	if(methods){
		logger.info('Add new methodes for validation test...');
		def_methodes=methods;
	}
	if(showErrorNotes!==undefined){
		logger.info('Pass showErrorNotes... ');
		def_showErrorNotes=showErrorNotes;
	}
	return bashForEachRoute
}