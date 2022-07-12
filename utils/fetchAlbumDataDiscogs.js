const Discogs = require('disconnect').Client;
const extractParams = require('./extractParams');
require('dotenv').config();

module.exports = async ({album, band}) => {
    const db = new Discogs({
        consumerKey: process.env.DISCOGS_CONSUMER_KEY,
        consumerSecret: process.env.DISCOGS_CONSUMER_SECRET
    }).database();

    try {
        const {results} = await db.search({release_title: album, artist: band});
        if(results.length === 0) return;
        // for some reason there's a bug in discogs db and some releases have same id eg. It's time... to rise from the grave by Undeath
        // maybe add some condition to evaluate if what this gives back might be actually what user is looking
        const {artists, title, released, year, styles, tracklist, images: [cover] } = await db.getRelease(results[0].master_id);
        // const {artists, title, released, year, styles, tracklist, images: [cover] } = await db.getMaster(results[0].master_id);
        return {
            artists: artists.map(artist => ({name: artist.name})),
            title,
            // released,
            generes: [...new Set(styles.join(' ').split(' '))].map(style => ({name: style})),
            cover: cover.uri
        }
    } catch (error) {
        console.error(error);
    }
}