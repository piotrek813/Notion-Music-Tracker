const fetch = require('node-fetch');

const notion = require('./utils/notion');
const { APIErrorCode } = require("@notionhq/client");

const sleep = require('./utils/sleep');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const fetchAlbumData = async (album) => {
    const maQuery = await fetch(`https://www.metal-archives.com/search/ajax-album-search/?field=title&query=${album}`);
    const maResult = await maQuery.json()
    const bandPageLink = maResult.aaData[0][0].split('"')[1];
    const albumPageLink = maResult.aaData[0][1].split('"')[1];

    const bandPage = await fetch(bandPageLink);
    const bandPageBody = await bandPage.text();
    const bandPageDOM = new JSDOM(bandPageBody);

    const bandGenere = bandPageDOM.window.document.querySelector("#band_stats > dl.float_right > dd:nth-child(2)").textContent;

    const albumPage = await fetch(albumPageLink);
    const albumPageBody = await albumPage.text();
    const albumPageDOM = new JSDOM(albumPageBody);

    let albumReleaseDate = albumPageDOM.window.document.querySelector("#album_info > dl.float_left > dd:nth-child(4)").textContent;
    albumReleaseDate = new Date(albumReleaseDate.replace(/(\d+)(st|nd|rd|th|,)/, "")).toISOString();
    albumReleaseDate = albumReleaseDate.substring(0, albumReleaseDate.indexOf('T'))

    const bandName = albumPageDOM.window.document.querySelector("#album_info > h2 > a").textContent;

    const albumCover = albumPageDOM.window.document.querySelector("#cover > img").src;

    return {
        bandGenere,bandName,albumCover,albumReleaseDate
    }
}

const updatePage = async (page) => {
    const cmd = page.properties.Name.title[0].text.content;
    const albumTitle = cmd.slice(0,-1);

    const {bandGenere, bandName, albumCover, albumReleaseDate} = await fetchAlbumData(albumTitle);

    const response = await notion.pages.update({
        page_id: page.id,
        cover: {
            type: "external",
            external: {
                url: albumCover,
            }
        },
        properties: {
            Name: {
                title: [
                    {
                        text: {
                            content: albumTitle,
                        }
                    }
                ]
            },
            Artist: {
                multi_select: [
                    {
                        name: bandName,
                    }
                ]
            },
            "Release date": {
                date: {
                    start: albumReleaseDate
                }
            }
        },
    });
}

const notionQuery = async () => {
    try {
        const databaseId = 'f43649e7c1c747e3929080854b6e2a8f';
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'Name',
                title: {
                    ends_with: ';'
                }
            },
        });

        if(response.results.length !== 0) await updatePage(response.results[0]);
    } catch(err) {
        if(err.code === APIErrorCode.ConflictError) {
            console.log(err.code)
            console.log('waitng...');
            await sleep(500);
            await notionQuery();
        }
        else {
            console.log(err, err.code)
        }
    }
}
notionQuery();
setInterval(async () => {
    console.log('listening...')
    await notionQuery()
    // lastRunCheck = new Date().toISOString();
}, 1000);