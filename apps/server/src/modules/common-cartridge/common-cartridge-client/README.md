# how to filter the swagger specification of the schulcloud using filter-spec.js script? 

you can run the script with a parameter that is the path to the controller you want to filter. 

```bash
for example:
node ./scripts/filter-spec.js /courses 
```
The execution of the script will generate in scripts ordner a new file called **filtered-spec.json** with the filtered specification to the controller you passed as a parameter. This file should be used to generate the client code for the controller you want to use and **deleted** after that.
This script is also able to just select used models and operations from the swagger specification. Unused models will be irgnored.

# how to generate the Api client code using openapi-generator-cli?

use this command to generate the client and delete the filtered spec file

for example:
```bash
npx openapi-generator-cli generate -i './scripts/filtered-spec.json' -g typescript-axios -o "apps/server/src/modules/common-cartridge/common-cartridge-client/courses-api-client" --skip-validate-spec -c 'openapitools-config.json' && rm .\scripts\filtered-spec.json
```
The input file in this command is the file genreated by the filter-spec.js script. The output folder is the folder where the client code will be generated. The openapitools-config.json file is the configuration file for the openapi-generator-cli. After generating the client code, the filtered-spec.json file will be deleted with the command **rm .\scripts\filtered-spec.json**.

***make sure*** to delete the filtered-spec.json file after generating the client code, before commiting the changes.




