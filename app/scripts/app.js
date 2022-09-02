var client;
let headersList = {
  "Notion-Version": "2022-06-28",
  Authorization: "Bearer secret_g8x8qRjQydSjOLWaYSH9X1CdLtQdExfOhAG8k7mFNkv",
  "Content-Type": "application/json",
};

init();

async function init() {
  client = await app.initialized();

  // receive data from modal
  client.instance.receive(async function (event) {
    var data = event.helper.getData();
    let contact = await client.data.get('contact')
    let greeting = `
    Hello ${contact.contact.first_name}, <br>
      Thank you for reaching out. Sharing reference article/articles with you which will help you with your query.
      <br><br>
      --Solutions--
      <br><br>
    `;
    console.log({contact,greeting})
    try {
      await client.interface.trigger("click", {
        id: "reply",
        text: greeting + data.message,
      });
      await client.interface.trigger('showNotify', {type:'success' , message : 'Created Reply with Article Link'});
    } catch (err) {
      client.interface.trigger("setValue", {
        id: "editor",
        text: "<br>" + data.message,
      });
      await client.interface.trigger('showNotify', {type:'success' , message : 'Added Article Link to Reply' , position:"end"});
    }
  });
  client.events.on("app.activated", onAppActivated);
}

async function onAppActivated() {
  // let notes = await getNotes({ page_size: 3 });
  console.log("Event Registered");
  document.querySelector(".toggle-btn").addEventListener("click", function () {
    launchModal("Article Repositoriess", "templates/index.html", {
      key: "value",
    });
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

// show notification
// await client.interface.trigger('showNotify', {type:'success' , message : 'yayy'});
