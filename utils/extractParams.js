// Okay so notion's devs or designers thought that this ‘ looks better than normal ' and that's why this...
module.exports = cmd => {
    const paramsArr = cmd.slice(0,-1).split('[')

    params = {
        album: '',
        band: '',
        source: 'Discogs'
    };
    paramsArr.forEach((param, index) => {
        if(!param) return;
        param = param.replace(/[\u2018\u2019]/g, "'");
        if (param === 'm') params.source = 'metal-archives';
        else if (index === 0) params.album = param;
        else params.band = param;
    })

    return {
        ...params
    }
}