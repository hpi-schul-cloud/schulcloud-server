 
const isNotEmptyString = (data, trim = false) => {
  const  result = false;
  result = typeof data === 'string';
  if(result) {
    if(trim) {
      result = data.trim().length > 0 ;
    }
    else {
      result = data.length > 0;
    }
  }
  return result;
};
