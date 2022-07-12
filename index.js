const notion = require('./utils/notion');
// const { APIErrorCode } = require("@notionhq/client");

const sleep = require('./utils/sleep');
const {sendError, NOT_FOUND} = require('./utils/sendError');

const fetchAlbumDataMA = require('./utils/fetchAlbumDataMA');
const fetchAlbumDataDiscogs = require('./utils/fetchAlbumDataDiscogs');
const extractParams = require('./utils/extractParams');

const updatePage = async (page) => {
    const {source, ...params} = extractParams(page.properties.Name.title[0].text.content)
    let album;
    console.log(source, params);
    switch (source) {
        case 'metal-archives':
            album = await fetchAlbumDataMA(params)
            break;

        default:
            album = await fetchAlbumDataDiscogs(params);
            break;
    }

    if(!album || !album.title) return await sendError(page, NOT_FOUND, false);
    await notion.pages.update({
        page_id: page.id,
        ...(
            album.cover &&
            {cover: {
                type: "external",
                external: {
                    url: album.cover,
                }
            }}
        ),
        properties: {
            Name: {
                title: [
                    {
                        text: {
                            content: album.title,
                        }
                    }
                ]
            },
            ...(
                album.artists &&
                {Artist: {
                    multi_select: album.artists
                }}
            ),
            ...(
                album.geners &&
                {Genere: {
                    multi_select: album.generes
                }}
            ),
            ...(
                album.released &&
                {"Release date": {
                    date: {
                        start: album.released
                    }
                }}
            )
        }
    });
}


// Listen for changes
const notionQuery = async () => {
    try {
        const databaseId = process.env.NOTION_DATABASE_ID;
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
        console.error(err);
        // in this particular example I don't think I have to leave it here
        // if(err.code === APIErrorCode.ConflictError) {
        //     console.log(err.code)
        //     console.log('waitng...');
        //     await sleep(500);
        //     await notionQuery();
        // }
        // else {
        //     console.log(err, err.code)
        // }
    }
}

setInterval(() => {
    console.log('listening...');
    notionQuery();
}, 1500);