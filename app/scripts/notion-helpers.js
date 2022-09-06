let headersList = {
  "Notion-Version": "2022-06-28",
  Authorization: "Bearer <%= iparam.apiKey %> ", //secret_g8x8qRjQydSjOLWaYSH9X1CdLtQdExfOhAG8k7mFNkv",
  "Content-Type": "application/json",
};
var cursor = null;

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
  console.log({ data });
  cursor = data.next_cursor;
  let notes = await getNotesEntries(data, filter);
  console.log(notes);
  return notes;
}

async function getNotesEntries(data) {
  return data.results.map(row => {
    return {
      question: row.properties.Question.title[0].text.content,
      tags: row.properties.Tags.multi_select.map(tag => tag.name),
      url: row.url.replace(
        "www.notion.so",
        "enchanted-bougon-d59.notion.site"
      )
    }
  })
}

// for old response types 
// async function getNotesEntries(data) {
//   console.log("notes");
//   let client = await app.initialized();
//   const notes = await Promise.all(
//     data.results.map(async (page) => {
//       const properties = { url: page.url };
//       for (let propertyName of Object.keys(page.properties)) {
//         let property_id = page.properties[propertyName].id;
//         let propertyData = await client.request.get(
//           `https://api.notion.com/v1/pages/${page.id}/properties/${property_id}`,
//           {
//             headers: headersList,
//           }
//         );
//         properties[propertyName] = JSON.parse(propertyData.response);
//       }
//       return properties;
//     })
//   );

//   let entries = [];
//   for (note of notes) {
//     let url = note.url.replace(
//       "www.notion.so",
//       "enchanted-bougon-d59.notion.site"
//     );
//     let category = note.Category.select.name;
//     let tags = note.Tags.multi_select.map((tag) => tag.name);
//     let question = note.Question.results[0].title.text.content;
//     let number = note.Number.number;
//     let date_created = note["Date Created"].created_time;
//     entries.push({
//       url,
//       category,
//       tags,
//       question,
//       number,
//       date_created,
//     });
//   }
//   return entries;
// }

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

function handleError(err) {
  console.log({ err });
  document.querySelector(".loader").style.display = "none";
  document.querySelector(
    ".error"
  ).innerHTML = `<div class="card fw-card-1 fw-p-24 fw-flex fw-items-center fw-flex-column">
        Something went Wrong :: ${err.response ? JSON.stringify(err.response) : err.message}  <br> <fw-button class='retry' color='green'>Retry</fw-button>
        </div>`;
}

async function loadMore() {
  try {
    if (cursor == null) {
      document.querySelector(".load-more").style.display = "none";
      return;
    } else {
      let notes = await getNotes({
        page_size: 6,
        start_cursor: cursor,
      });
      setAllTags(notes);
      renderNotes(notes, true);
    }
  } catch (err) {
    handleError(err)
  }
}

