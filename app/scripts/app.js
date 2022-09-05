var client , contentLoaded=false , notes;

init();

async function init() {
  client = await app.initialized();
  client.events.on("app.activated", onAppActivated);
}

async function onAppActivated() {
  console.log("Event Registered");
  document.querySelector(".toggle-btn").addEventListener("click", function () {
    launchModal("Article Repositoriess", "templates/index.html", {
      key: "value",
    });
  });

  notes = !contentLoaded ? await getNotes({ page_size: 3 }) : notes;
  contentLoaded = true;
  console.log({ notes })
  renderNotes(notes);


  // receive data from modal
  client.instance.receive(async function (event) {
    var data = event.helper.getData();
    addTicketReply(data);
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

        let reply_data = { message: body }; // JSON.stringify({ body: body }); // format for api request
        addTicketReply(reply_data);
      } else if(e.target.classList.contains('reset')){
        console.log('resetting');
        let notes = await getNotes({ page_size: 3 });
        console.log({ notes })
        renderNotes(notes);
      }
    })
}

async function launchModal(title, template, data) {
  try {
    let modal = await client.interface.trigger("showModal", {
      title,
      template,
      data,
    });
    console.log(modal);
    return modal;
  } catch (err) {
    console.log(err);
  }
}

async function showNotify(type, message) {
  await client.interface.trigger("showNotify", {
    type,
    message,
  });
}

async function addTicketReply(data) {
  let contact = await client.data.get("contact");
  let greeting = `
    Hello ${contact.contact.first_name}, <br>
      Thank you for reaching out. Sharing reference article/articles with you which will help you with your query.
      <br><br>
      --Solutions--
      <br><br>
    `;
  console.log({ contact, greeting });
  try {

    await client.interface.trigger("click", {
      id: "reply",
      text: greeting + data.message,
    });
    showNotify("success", "Created Reply and Added Link!");

  } catch (err) {

    await client.interface.trigger("setValue", {
      id: "editor",
      text: "<br><br>" + data.message,
      position: "end",
    });
    showNotify("success", "Added Article Link to Reply");
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
            <div class="tags-wrapper" hidden> ${parseTags(note.tags)} </div>

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
}
