module.exports={
	"model":{	//if string dann path to model, if object dann key:value
		
	},
	"id":  //???? <-- wie die richtige id identifizieren 
	"response":[
		{
			"methods":["GET","FIND"],
			"roles":["student","teacher"],
			"response":{
				"code":404,					//code seperate aufführen + was im body zurück kommt
				"message":"Page not found"	//??? nicht wichtig oder?
				"body": {}					// optional individuelle Daten
			},
			"query":{				//optional für diese request
				"id":"123",			//optional individuelle Daten
				"age":"18"			//optional individuelle Daten 
			}
		}
		
	]
}

//nachtragen der generischen Daten 
/*
 {{}}


*/