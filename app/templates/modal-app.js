var context, cursor;

async function init() {
  try {
    // retry event listener
    document.querySelector("body").addEventListener("click", function (e) {
      if (e.target.classList.contains("retry")) {
        document.querySelector(".error").innerHTML = "";
        document.querySelector(".loader").style.display = "flex";
        search();
      }else if(e.target.classList.contains('reset')){
        document.querySelector(".error").innerHTML = "";
        document.querySelector(".loader").style.display = "flex";
        document.querySelector('fw-input.search').value = "";
        search();
      }
    });

    // get already initialized client and get context sent to modal
    let client = await app.initialized();
    context = await client.instance.context();
    console.log(context);
    // document.body.append(JSON.stringify(context));
    let notes = await getNotes({ page_size: 6 });
    setAllTags(notes);
    renderNotes(notes);

    // TODO :: Call reply ticket endpoint and than toggle show activies to show the reply with page refresh

    // adding search feature
    document
      .querySelector(".search-wrapper fw-button")
      .addEventListener("click", async function () {
        document.querySelector(".loader").style.display = "flex";
        search();
      });

    // adding ticket reply feature
    document
      .querySelector(".table")
      .addEventListener("click", async function (e) {
        if (
          e.target.tagName == "FW-BUTTON" &&
          e.target.classList.contains("add-article")
        ) {
          let body = e.target
            .closest("div.card")
            .querySelector(".question").innerHTML;
          body +=
            "<br> Tags :: " +
            Array.from(
              e.target
                .closest("div.card")
                .querySelector(".note-footer")
                .querySelectorAll(".tags-wrapper fw-pill")
            )
              .map((tag) => tag.innerText)
              .join(", ");

          let reply_data = body; // JSON.stringify({ body: body }); // format for api request
          replytoTicket(reply_data);
        }
      });

    // load-more button
    document.querySelector(".load-more").addEventListener("click", function () {
      console.log("loading...");
      loadMore();
    });
  } catch (err) {
    handleError(err)
  }
}

init();

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


function renderNotes(notes, append = false) {
  let markUp = "";
  console.log({ notes });
  if (notes.length > 0) {
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
  } else {
    markUp = `<div class="card fw-card-1 fw-p-24 fw-flex fw-items-center fw-flex-column">
      No Results Found!! <br>
      <fw-button class='reset' color='green'>Reset</fw-button>
    </div>`;
  }

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

function setAllTags() {
  // let newTags = notes.reduce(function (acc, elem, i, arr) {
  //   acc.push(...elem.tags);
  //   return acc;
  // }, []);
  // console.log({ allTags });
  // allTags = Array.from(new Set([...allTags, ...newTags]));
  // console.log({ allTags });
  var selectDataSource = allTags.map((tag) => {
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

async function replytoTicket(reply_data) {
  let client = await app.initialized();
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

async function search() {
  try {
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
            property: "Tags",
            multi_select: {
              contains: keyword,
            },
          },
        ],
      },
      page_size: 6,
    });
    setAllTags(notes);
    renderNotes(notes);
  } catch (err) {
    handleError(err)
  }
}

