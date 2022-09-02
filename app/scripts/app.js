var client;
let headersList = {
  "Notion-Version": "2022-06-28",
  Authorization: "Bearer secret_g8x8qRjQydSjOLWaYSH9X1CdLtQdExfOhAG8k7mFNkv",
  "Content-Type": "application/json",
};

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

        let reply_data = {message:body}; // JSON.stringify({ body: body }); // format for api request
        addTicketReply(reply_data);
      }
    });
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

async function addTicketReply(data){
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

// show notification
// await client.interface.trigger('showNotify', {type:'success' , message : 'yayy'});
