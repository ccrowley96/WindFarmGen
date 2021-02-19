class AssetSimulation {
  constructor(seedTimeMillis, intervalMillis) {
    this.assets = [];
    this.usedIds = {};
    this.seedTimeMillis = seedTimeMillis;
    this.intervalMillis = intervalMillis;
    this.assets.push(new Asset("Car", this));
    this.assets.push(new Asset("Windmill", this));
    this.assets.push(new Asset("PasteurizationMachine", this));
    this.assets.push(new Asset("HVACSystem", this));

    this.typeIds = {
      Car: "6fbe23a0-c676-44e2-b018-192d1b8cb0a6",
      Windmill: "28f203d6-c9b4-4ccd-90b0-9b7d9989684e",
      PasteurizationMachine: "a259fb24-3359-4252-9bc8-c3c8583edc67",
      HVACSystem: "04bb3d5b-2b3e-4d45-933e-fb0087be3685",
    };
  }

  tick(pusherType) {
    this.seedTimeMillis += this.intervalMillis;
    var self = this;
    var events = [];
    if (pusherType === "tsi") {
      this.assets.forEach(function (asset) {
        asset.devices.forEach(function (d) {
          events.push(
            d.tick(new Date(self.seedTimeMillis).toISOString(), pusherType)
          );
        });
      });
    } else {
      this.assets.forEach(function (asset) {
        let updateTwin = {};
        updateTwin.digitalTwinId = asset.name + "Twin";
        updateTwin.jsonPatch = [];
        asset.devices.forEach(function (d) {
          updateTwin.jsonPatch.push(
            d.tick(new Date(self.seedTimeMillis).toISOString(), pusherType)
          );
        });
        events.push(updateTwin);
      });
    }
    return events;
  }

  generateTsmInstances(download = true) {
    var instancesArray = [];
    var typeArray = [];
    this.assets.forEach((asset) => {
      var instance = {
        timeSeriesId: [asset.name],
        hierarchyIds: [],
        typeId: this.typeIds[asset.name],
        description: asset.name,
        instanceFields: {},
      };
      instancesArray.push(instance);

      var variables = {};
      asset.devices.forEach((device) => {
        variables[device.deviceName] = {
          kind: "numeric",
          value: {
            tsx: "$event['" + device.deviceName + "'].Double",
          },
          aggregation: {
            tsx: "avg($value)",
          },
        };
      });

      var type = {
        id: this.typeIds[asset.name],
        name: asset.name,
        description: "Type for an " + asset.name,
        variables: variables,
      };
      typeArray.push(type);
    });
    if (download) {
      downloadText(JSON.stringify({ put: instancesArray }));
      downloadText(JSON.stringify({ put: typeArray }), "Types.json");
    }
  }

  generateDTModels(download = true) {
    let dtdlModels = this.assets.map((asset) => {
      let model = {};
      model["@id"] = `dtmi:assetGen:${asset.name};1`;
      model["@type"] = "Interface";
      model["@context"] = "dtmi:dtdl:context;2";
      model["displayName"] = asset.name;
      model["contents"] = asset.devices.map((device) => ({
        "@type": "Property",
        name: device.deviceName,
        schema: "double",
      }));
      return model;
    });
    if (download) {
      downloadText(JSON.stringify(dtdlModels), "DT_Models.json");
    }
    return dtdlModels;
  }

  generateDTwins(download = true) {
    let twins = this.assets.map((asset) => {
      let twin = {};
      twin["$dtId"] = `${asset.name}Twin`;
      twin["$metadata"] = { $model: `dtmi:assetGen:${asset.name};1` };
      asset.devices.forEach((device) => {
        twin[`${device.deviceName}`] = device.minValue;
      });
      return twin;
    });
    if (download) {
      downloadText(JSON.stringify(twins), "DT_Twins.json");
    }
    return twins;
  }
}

class Asset {
  constructor(name, assetSimulation) {
    this.devices = [];
    this.name = name;
    this.assetSimulation = assetSimulation;
    switch (name) {
      case "Car":
        this.devices.push(
          new AssetDevice(
            "Speed",
            this,
            Math.floor(Math.random() * 20) + 40,
            0,
            100,
            { Units: "MPH" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "OutdoorTemperature",
            this,
            Math.floor(Math.random()) + 40,
            20,
            80,
            { Units: "DegF" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "OilPressure",
            this,
            Math.floor(Math.random()) + 30,
            28,
            32,
            { Units: "KPA" }
          )
        );
        break;
      case "Windmill":
        this.devices.push(
          new AssetDevice(
            "OutdoorTemperature",
            this,
            Math.floor(Math.random() * 20) + 40,
            0,
            100,
            { Units: "degF" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "AtmosphericPressure",
            this,
            Math.floor(Math.random()) + 30,
            29,
            31,
            { Units: "in" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "WindVelocity",
            this,
            Math.floor(Math.random() * 30),
            0,
            70,
            { Units: "mph" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "BearingTemperature",
            this,
            Math.floor(Math.random() * 30) + 90,
            90,
            200,
            { Units: "degF" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "OilViscosity",
            this,
            Math.floor(Math.random() * 5) + 10,
            10,
            80,
            { Units: "cSt" }
          )
        );
        break;
      case "PasteurizationMachine":
        this.devices.push(
          new AssetDevice(
            "InFlow",
            this,
            Math.floor(Math.random() * 300) + 50,
            50,
            600,
            { Units: "Gallons" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "OutFlow",
            this,
            Math.floor(Math.random() * 300) + 50,
            50,
            600,
            { Units: "Gallons" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "Temperature",
            this,
            Math.floor(Math.random()) + 120,
            110,
            250,
            { Units: "DegF" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "PercentFull",
            this,
            Math.floor(Math.random()),
            0,
            1,
            { Units: "Percent" }
          )
        );
        break;
      case "HVACSystem":
        this.devices.push(
          new AssetDevice(
            "FanSpeed",
            this,
            Math.floor(Math.random() * 20) + 40,
            0,
            100,
            { Units: "MPH" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "CoolerTemperature",
            this,
            Math.floor(Math.random()) + 40,
            20,
            60,
            { Units: "DegF" }
          )
        );
        this.devices.push(
          new AssetDevice(
            "HeaterTemperature",
            this,
            Math.floor(Math.random()) + 50,
            40,
            100,
            { Units: "DegF" }
          )
        );
        break;
      default:
        break;
    }
  }
}

class AssetDevice {
  constructor(deviceName, asset, seedValue, minValue, maxValue, properties) {
    this.deviceName = deviceName;
    this.seedValue = seedValue;
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.properties = properties;
    this.id = asset.name;
  }

  tick(timestamp, pusherType) {
    var direction =
      this.seedValue > this.maxValue
        ? -1
        : this.seedValue < this.minValue
        ? 1
        : Math.random() < 0.5
        ? -1
        : 1;
    var step =
      direction * (Math.random() * (this.maxValue - this.minValue) * 0.02);
    this.seedValue += step;
    var event;

    if (pusherType === "tsi") {
      var status = Math.random() > 0.95 ? "Bad" : "Good";
      event = {
        Timestamp: timestamp,
        Id: this.id,
        [this.deviceName]: this.seedValue,
        Status: status,
      };
      Object.keys(this.properties).forEach(
        (p) => (event[p] = this.properties[p])
      );
    } else {
      event = {
        op: "replace",
        path: `/${this.deviceName}`,
        value: this.seedValue,
      };
    }
    return event;
  }
}
