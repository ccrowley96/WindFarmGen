const { DefaultAzureCredential } = require("@azure/identity");
const { DigitalTwinsClient } = require("@azure/digital-twins-core");
const { inspect } = require("util");

module.exports = {
  createModel: async function (req, res) {
    process.env.AZURE_DIGITALTWINS_URL = req.body.AZURE_DIGITALTWINS_URL;
    process.env.AZURE_TENANT_ID = req.body.AZURE_TENANT_ID;
    process.env.AZURE_CLIENT_ID = req.body.AZURE_CLIENT_ID;
    const url = process.env.AZURE_DIGITALTWINS_URL;

    const credential = new DefaultAzureCredential();
    const serviceClient = new DigitalTwinsClient(url, credential);

    try {
      const model = await serviceClient.createModels(req.body.dtdlModels);
      console.log(`Model:`);
      console.log(inspect(model));

      res.send(digitalTwin._response.parsedBody);
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  },
  createTwin: async function (req, res) {
    process.env.AZURE_DIGITALTWINS_URL = req.body.AZURE_DIGITALTWINS_URL;
    process.env.AZURE_TENANT_ID = req.body.AZURE_TENANT_ID;
    process.env.AZURE_CLIENT_ID = req.body.AZURE_CLIENT_ID;
    const url = process.env.AZURE_DIGITALTWINS_URL;

    const credential = new DefaultAzureCredential();
    const serviceClient = new DigitalTwinsClient(url, credential);

    try {
      const digitalTwin = await serviceClient.upsertDigitalTwin(
        req.body.digitalTwinId,
        JSON.stringify(req.body.digitalTwinJson)
      );
      console.log(`DigitalTwin:`);
      console.log(inspect(digitalTwin));

      res.send(digitalTwin._response.parsedBody);
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  },
  updateTwin: async function (req, res) {
    process.env.AZURE_DIGITALTWINS_URL = req.body.AZURE_DIGITALTWINS_URL;
    process.env.AZURE_TENANT_ID = req.body.AZURE_TENANT_ID;
    process.env.AZURE_CLIENT_ID = req.body.AZURE_CLIENT_ID;
    const url = process.env.AZURE_DIGITALTWINS_URL;

    const credential = new DefaultAzureCredential();
    const serviceClient = new DigitalTwinsClient(url, credential);

    try {
      const digitalTwinId = req.body.digitalTwinId;
      const jsonPatch = req.body.jsonPatch;
      const response = await serviceClient.updateDigitalTwin(
        digitalTwinId,
        jsonPatch
      );

      res.send(response.parsedBody);
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  },
  publishTelemetry: async function (req, res) {
    process.env.AZURE_DIGITALTWINS_URL = req.body.AZURE_DIGITALTWINS_URL;
    process.env.AZURE_TENANT_ID = req.body.AZURE_TENANT_ID;
    process.env.AZURE_CLIENT_ID = req.body.AZURE_CLIENT_ID;
    const url = process.env.AZURE_DIGITALTWINS_URL;

    const credential = new DefaultAzureCredential();
    const serviceClient = new DigitalTwinsClient(url, credential);

    try {
      const digitalTwinId = req.body.digitalTwinId;
      const telemetryPayload = req.body.telemetryPayload;
      const response = await serviceClient.publishTelemetry(
        digitalTwinId,
        telemetryPayload
      );

      res.send(response.parsedBody);
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  },
};
