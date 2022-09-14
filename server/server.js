exports = {
  // args is a JSON block containing the payload information.
  // args["iparam"] will contain the installation parameter values.
  conversationUpdated: async function(args) {
    console.log({args})
    try{
      let response = await $request.post(args.iparams.webhook_endpoint, {
        json: args
      })
      console.log(JSON.stringify(response))
    }
    catch(e){
      console.log(e);
    }
  }
};
