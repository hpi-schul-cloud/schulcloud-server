const rnd = (m) => {
    return Math.floor(Math.random() * Math.floor(m));
};

const rnd36=() => {
    return (rnd(36)).toString(36);
};

const rndSpecial=() => {
    const c = ['!','$','.'];
    return c[rnd(c.length)];
};

const rndChar=() => {
    const x = rnd(10); 
    if(x<3) return rnd36();
    if(x<6) return rnd36().toLocaleLowerCase();
    if(x<9) return rnd36().toLocaleUpperCase();
    return rndSpecial();
};

const generatePass=(m) => {
    let pass = '';
    for(let i=0; i<m; i++){
        pass+=rndChar();
    }
    return pass;
};

const generateSuffix=(m) => {
    let suffix = '';
    for (let i=0; i<m; i++) {
        suffix += rnd36();
    }
    return suffix;
}


exports.randomPass =(max)=>{
    return generatePass(max||36);
};

exports.randomSuffix = (max) => {
    return generateSuffix(max||4);
}