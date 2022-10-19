const fetch = require('node-fetch');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const extractParams = require('./extractParams');

// get album data from metal-archives.com
module.exports = async ({album,band}) => {
    // this is full ajax query from metal archives
    // search/ajax-advanced/searching/albums/?bandName=Invicta&releaseTitle=The+Executioner&releaseYearFrom=&releaseMonthFrom=&releaseYearTo=&releaseMonthTo=&country=&location=&releaseLabelName=&releaseCatalogNumber=&releaseIdentifiers=&releaseRecordingInfo=&releaseDescription=&releaseNotes=&genre=

    const maQuery = await fetch(`https://www.metal-archives.com/search/ajax-advanced/searching/albums/?bandName=${band}&releaseTitle=${album}`);
    const maResult = await maQuery.json()

    if(maResult.aaData.length === 0) return;
    const bandPageLink = maResult.aaData[0][0].split('"')[1];
    const albumPageLink = maResult.aaData[0][1].split('"')[1];

    const bandPage = await fetch(bandPageLink);
    const bandPageBody = await bandPage.text();
    const bandPageDOM = new JSDOM(bandPageBody);

    let bandGenres = bandPageDOM.window.document.querySelector("#band_stats > dl.float_right > dd:nth-child(2)").textContent.split(';');
    if (bandGenres.length === 1) bandGenres = bandGenres[0].replace('/', ' ').split(' ').map(genere => ({name: genere}));
    else bandGenere = undefined;

    const albumPage = await fetch(albumPageLink);
    const albumPageBody = await albumPage.text();
    const albumPageDOM = new JSDOM(albumPageBody);

    let albumReleaseDate = albumPageDOM.window.document.querySelector("#album_info > dl.float_left > dd:nth-child(4)").textContent;
    albumReleaseDate = new Date(albumReleaseDate.replace(/(\d+)(st|nd|rd|th|,)/, "")).toISOString();
    albumReleaseDate = albumReleaseDate.substring(0, albumReleaseDate.indexOf('T'))

    const bandsName = albumPageDOM.window.document.querySelector("#album_info > h2").textContent.replace(/\n/g, '').split(' / ').map(band => ({name: band}));
    const albumTitle = albumPageDOM.window.document.querySelector("#album_info > h1 > a").textContent;

    const albumCover = albumPageDOM.window.document.querySelector("#cover > img").src;
    return {
        title: albumTitle, genres: bandGenres, artists: bandsName,cover:albumCover,released: albumReleaseDate
    }
}