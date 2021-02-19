function createModels() {
  var adtUrl = document.getElementById("adtUrl").value;
  var adtTenantId = document.getElementById("adtTenantId").value;
  var adtClientId = document.getElementById("adtClientId").value;
  var info = document.getElementById("info");
  let livePushFrequency = document.getElementById("livePushFrequency").value;

  let assetSimulation = new AssetSimulation(
    new Date().valueOf(),
    livePushFrequency
  );

  axios
    .post("http://localhost:3000/createModel", {
      AZURE_DIGITALTWINS_URL: adtUrl,
      AZURE_TENANT_ID: adtTenantId,
      AZURE_CLIENT_ID: adtClientId,
      dtdlModels: assetSimulation.generateDTModels(),
    })
    .then((response) => {
      let result = response.data;
      if (result.code) {
        info.innerText = result.details.error.message;
      } else {
        info.innerText = "Created successfully!";
      }
    })
    .catch((error) => {
      info.innerText = error;
    });
}

function createTwins() {
  var adtUrl = document.getElementById("adtUrl").value;
  var adtTenantId = document.getElementById("adtTenantId").value;
  var adtClientId = document.getElementById("adtClientId").value;
  var info = document.getElementById("info");
  let livePushFrequency = document.getElementById("livePushFrequency").value;

  let assetSimulation = new AssetSimulation(
    new Date().valueOf(),
    livePushFrequency
  );

  let twins = assetSimulation.generateDTwins();
  debugger;
  console.log(twins);
  twins.forEach((twin) => {
    let id = twin["$dtId"];
    delete twin["$dtId"];
    axios
      .post("http://localhost:3000/createTwin", {
        AZURE_DIGITALTWINS_URL: adtUrl,
        AZURE_TENANT_ID: adtTenantId,
        AZURE_CLIENT_ID: adtClientId,
        digitalTwinId: id,
        digitalTwinJson: twin,
      })
      .then((response) => {
        debugger;
        let result = response.data;
        if (result.code) {
          info.innerText += `\nError in ${id}: ${result.details.error.message}`;
        } else {
          info.innerText += `\n${id} created successfully!`;
        }
      })
      .catch((error) => {
        info.innerText = error;
      });
  });
}

function updateTwins(twins, packetNumber) {
  var adtUrl = document.getElementById("adtUrl").value;
  var adtTenantId = document.getElementById("adtTenantId").value;
  var adtClientId = document.getElementById("adtClientId").value;
  var info = document.getElementById("info");
  var resultText = document.getElementById("result");

  twins.forEach((twin) => {
    axios
      .patch("http://localhost:3000/updateTwin", {
        AZURE_DIGITALTWINS_URL: adtUrl,
        AZURE_TENANT_ID: adtTenantId,
        AZURE_CLIENT_ID: adtClientId,
        digitalTwinId: twin.digitalTwinId,
        jsonPatch: twin.jsonPatch,
      })
      .then((response) => {
        let result = response.data;
        if (result.code) {
          info.innerText += `\nError in ${id}: ${result.details.error.message}`;
        } else {
          resultText.innerHTML =
            "<b>" +
            result +
            "</b><br/> Message " +
            packetNumber +
            "<br/><br/><b>Payload example</b><br/> " +
            JSON.stringify(twin);
        }
      })
      .catch((error) => {
        info.innerText = error;
      });
  });
}
