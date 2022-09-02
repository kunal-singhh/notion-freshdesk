let headersList = {
  "Notion-Version": "2022-06-28",
  Authorization: "Bearer secret_g8x8qRjQydSjOLWaYSH9X1CdLtQdExfOhAG8k7mFNkv",
  "Content-Type": "application/json",
};

var client, context, cursor;

async function init() {
  try {
    // get already initialized client and get context sent to modal
    client = await app.initialized();
    context = await client.instance.context();
    console.log(context);
    // document.body.append(JSON.stringify(context));
    let notes = await getNotes({ page_size: 3 });
    localStorage.notes = JSON.stringify(notes);
    setAllTags(notes);
    renderNotes(notes);

    // TODO :: Call reply ticket endpoint and than toggle show activies to show the reply with page refresh

    // adding search feature
    document
      .querySelector(".search-wrapper fw-button")
      .addEventListener("click", async function (e) {
        let keyword = document.querySelector(".search").value;
        console.log(keyword);
        let notes = await getNotes({
          filter: {
            or: [
              {
                property: "Question",
                rich_text: {
                  contains: keyword,
                },
              },
              {
                property: "Tag",
                multi_select: {
                  contains: keyword,
                },
              }
            ],
          },
          page_size: 2,
        });
        setAllTags(notes);
        renderNotes(notes);
      });

    // adding ticket reply feature
    document
      .querySelector(".table")
      .addEventListener("click", async function (e) {
        if (
          e.target.tagName == "FW-BUTTON" &&
          e.target.classList.contains("add-article")
        ) {
          let ticket = await client.data.get("ticket");
          let body = e.target
            .closest("div.card")
            .querySelector(".question").innerHTML;
          body +=
            "<br> Tags :: " +
            Array.from(
              e.target
                .closest("div.card")
                .querySelector(".note-footer")
                .querySelectorAll(".tags-wrapper span")
            )
              .map((tag) => tag.innerText)
              .join(", ");

          let reply_data = body; // JSON.stringify({ body: body }); // format for api request
          replytoTicket(ticket.ticket.id, reply_data);
        }
      });

    // load-more button
    document
      .querySelector(".load-more")
      .addEventListener("click", function (e) {
        console.log("loading...");
        loadMore();
      });
  } catch (err) {
    console.log(err);
  }
}

init();

async function getNotes(filter = {}, append = false) {
  document.querySelector(".loader").style.display = "flex";
  let bodyContent = JSON.stringify(filter);
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

async function loadMore() {
  if (cursor == null) {
    document.querySelector(".load-more").style.display = "none";
    return;
  } else {
    let notes = await getNotes({
      page_size: 2,
      start_cursor: cursor,
    });
    setAllTags(notes);
    renderNotes(notes, true);
  }
}

function parseTags(tags) {
  let tagsMarkup = tags.reduce((acc, curr, index, arr) => {
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

function renderNotes(notes, append = false) {
  let markUp = "";
  notes.map((note, index) => {
    return (markUp += `
    <div class='card fw-card-1 fw-p-24 fw-flex fw-flex-column' data-note-id='${
      index + 1
    }'>
        <div class="question-wrapper">
          <div class="question"> <a href="${note.url}" target="_blank"> ${
      note.question
    } </a> </div>
        </div>
        <div class="note-footer">
          <div class="tags-wrapper"> ${parseTags(note.tags)} </div>

          <fw-button class="add-article" color='link' data-note-id='${
            index + 1
          }'>Add in Reply </fw-button>

          </div>
        </div>
`);
  });
  document.querySelector(".table").innerHTML = append
    ? document.querySelector(".table").innerHTML + markUp
    : markUp;
  document.querySelector(".loader").style.display = "none";
  document.querySelector(".load-more").style.display = cursor ? "flex" : "none";
}

var allTags = [
  "notion",
  "problem",
  "custom",
  "hack",
  "code",
  "css",
  "design",
  "api",
  "growth",
];
function setAllTags(notes) {
  // let newTags = notes.reduce(function (acc, elem, i, arr) {
  //   acc.push(...elem.tags);
  //   return acc;
  // }, []);
  // console.log({ allTags });
  // allTags = Array.from(new Set([...allTags, ...newTags]));
  // console.log({ allTags });
  var selectDataSource = allTags.map((tag, index) => {
    return {
      value: tag,
      text: tag,
    };
  });

  var fwSelect = document.querySelector("fw-select");
  fwSelect.options = selectDataSource;
  console.log({ fW: fwSelect.options });
}

document.querySelector("fw-select").addEventListener("fwChange", function (e) {
  console.log(e.detail.value);
});

async function replytoTicket(ticket_id, reply_data) {
  let headersList = {
    Authorization: "Basic QU16cno0em93UkZTTTJvUjRXOlg6",
    "Content-Type": "application/json",
  };
  try {
    // send data to parent and then using product events send open reply editor and append reply data
    await client.instance.send({
      message: reply_data,
      receiver: [context.parent_id], // set by default
    });
    await client.instance.close();
  } catch (error) {
    console.log(error);
    document.querySelector(".error").innerHTML = JSON.stringify(error);
    document.querySelector(".loader").style.display = "none";
  }
}
