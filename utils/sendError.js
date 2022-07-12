const notion = require('./notion');

const ErrorsMsg = Object.freeze({
    NOT_FOUND: "!No Data found",
});

const sendError = async ({id, ...pageProp}, errorMsg, dev) => {
    const pageTitle = pageProp.properties.Name.title[0].text.content.slice(0,-1);
    await notion.pages.update({
        page_id: id,
        cover: {
            type: "external",
            external: {
                url: 'https://images.unsplash.com/photo-1600754047212-0cf91397fbc6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80'
            }
        },
        properties: {
            Name: {
                title: [
                    {
                        text: {
                            content: !dev ? `${pageTitle} | ${errorMsg}` : pageTitle,
                        }
                    }
                ]
            },
        },
    })
};

module.exports = {
    sendError,
    ...ErrorsMsg,
}