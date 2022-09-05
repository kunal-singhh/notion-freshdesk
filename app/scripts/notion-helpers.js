let headersList = {
    "Notion-Version": "2022-06-28",
    Authorization: "Bearer <%= iparam.api_key %>  ", //secret_g8x8qRjQydSjOLWaYSH9X1CdLtQdExfOhAG8k7mFNkv",
    "Content-Type": "application/json",
};

async function getNotes(filter = {}) {
  document.querySelector(".loader").style.display = "flex";
  let bodyContent = JSON.stringify(filter);
  let client = await app.initialized();
  let results = await client.request.post(
    "https://api.notion.com/v1/databases/be0f2b02b980412488cf9552b721e8da/query",
    {
      body: bodyContent,
      headers: headersList,
    }
  );
  let data = JSON.parse(results.response);
  cursor = data.next_cursor;
  let notes = await getNotesEntries(data, filter);
  console.log(notes);
  return notes;
}

async function getNotesEntries(data) {
  console.log("notes");
  let client = await app.initialized();
  const notes = await Promise.all(
    data.results.map(async (page) => {
      const properties = { url: page.url };
      for (let propertyName of Object.keys(page.properties)) {
        let property_id = page.properties[propertyName].id;
        let propertyData = await client.request.get(
          `https://api.notion.com/v1/pages/${page.id}/properties/${property_id}`,
          {
            headers: headersList,
          }
        );
        properties[propertyName] = JSON.parse(propertyData.response);
      }
      return properties;
    })
  );

  let entries = [];
  for (note of notes) {
    let url = note.url.replace(
      "www.notion.so",
      "enchanted-bougon-d59.notion.site"
    );
    let category = note.Category.select.name;
    let tags = note.Tags.multi_select.map((tag) => tag.name);
    let question = note.Question.results[0].title.text.content;
    let number = note.Number.number;
    let date_created = note["Date Created"].created_time;
    entries.push({
      url,
      category,
      tags,
      question,
      number,
      date_created,
    });
  }
  return entries;
}

function parseTags(tags) {
    let tagsMarkup = tags.reduce((acc, curr) => {
      return (
        acc +
        `
        <fw-pill color="blue">
          ${curr}
        </fw-pill>
        `
      );
    }, "");
    return tagsMarkup;
}