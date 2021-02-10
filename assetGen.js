class AssetSimulation {
    constructor(seedTimeMillis, intervalMillis){
        this.assets = []; this.usedIds = {};
        this.seedTimeMillis = seedTimeMillis;
        this.intervalMillis = intervalMillis;
        this.assets.push(new Asset('Car', this));
        this.assets.push(new Asset('Windmill', this));
        this.assets.push(new Asset('Pasteurization Machine', this));
        this.assets.push(new Asset('HVAC System', this));

        this.typeIds = {'Car': '6fbe23a0-c676-44e2-b018-192d1b8cb0a6', 'Windmill': '28f203d6-c9b4-4ccd-90b0-9b7d9989684e',
        'Pasteurization Machine': 'a259fb24-3359-4252-9bc8-c3c8583edc67', 'HVAC System': '04bb3d5b-2b3e-4d45-933e-fb0087be3685'};
    }

    tick(){
        this.seedTimeMillis += this.intervalMillis;
        var self = this;
        var events = [];
        this.assets.forEach(function(asset){
            asset.devices.forEach(function(d){
                events.push(d.tick((new Date(self.seedTimeMillis).toISOString())));
            });
        });
        return events;
    }

    generateTsmInstances(download = true){
        var instancesArray = [];
        var typeArray = [];
        this.assets.forEach((asset) => {
            var instance = {
                timeSeriesId: [asset.name],
                hierarchyIds: [],
                typeId: this.typeIds[asset.name],
                description: asset.name,
                instanceFields: {
                }
            }
            instancesArray.push(instance);

            var variables = {};
            asset.devices.forEach(device => {
                variables[device.deviceName] = {
                    kind: 'numeric',
                    value: {
                        tsx: "$event['" + device.deviceName + "'].Double"
                    },
                    aggregation: {
                        tsx: 'avg($value)'
                    }
                }
            })

            var type = {
                id: this.typeIds[asset.name],
                name: asset.name,
                description: 'Type for an ' + asset.name,
                variables: variables
            }
            typeArray.push(type);
        });
        if(download){
            downloadText(JSON.stringify({put: instancesArray}));
            downloadText(JSON.stringify({put: typeArray}), 'Types.json');
        }
    }
}

class Asset{
    constructor(name, assetSimulation){
        this.devices = [];
        this.name = name
        this.assetSimulation = assetSimulation;
        switch(name) {
            case 'Car': 
                this.devices.push(new AssetDevice('Speed', this, Math.floor(Math.random() * 20) + 40, 0, 100, {Units: 'MPH'}));
                this.devices.push(new AssetDevice('Outdoor Temperature', this, Math.floor(Math.random()) + 40, 20, 80, {Units: 'DegF'}));
                this.devices.push(new AssetDevice('Oil Pressure', this,  Math.floor(Math.random()) + 30, 28, 32, {Units: 'KPA'}));
                break;
            case 'Windmill': 
                this.devices.push(new AssetDevice('Outdoor Temperature', this, Math.floor(Math.random() * 20) + 40, 0, 100, {Units: 'degF'}));
                this.devices.push(new AssetDevice('Atmospheric Pressure', this, Math.floor(Math.random()) + 30, 29, 31, {Units: 'in'}));
                this.devices.push(new AssetDevice('Wind Velocity', this,  Math.floor(Math.random() * 30), 0, 70, {Units: 'mph'}));
                this.devices.push(new AssetDevice('Bearing Temperature', this, Math.floor(Math.random() * 30) + 90, 90, 200, {Units: 'degF'}));
                this.devices.push(new AssetDevice('Oil Viscosity', this, Math.floor(Math.random() * 5) + 10, 10, 80, {Units: 'cSt'}));
                break;
            case 'Pasteurization Machine': 
                this.devices.push(new AssetDevice('In-Flow', this, Math.floor(Math.random() * 300) + 50, 50, 600, {Units: 'Gallons'}));
                this.devices.push(new AssetDevice('Out-Flow', this, Math.floor(Math.random() * 300) + 50, 50, 600, {Units: 'Gallons'}));
                this.devices.push(new AssetDevice('Temperature', this, Math.floor(Math.random()) + 120, 110, 250, {Units: 'DegF'}));
                this.devices.push(new AssetDevice('Percent Full', this,  Math.floor(Math.random()), 0, 1, {Units: 'Percent'}));
                break;
            case 'HVAC System': 
                this.devices.push(new AssetDevice('Fan Speed', this, Math.floor(Math.random() * 20) + 40, 0, 100, {Units: 'MPH'}));
                this.devices.push(new AssetDevice('Cooler Temperature', this, Math.floor(Math.random()) + 40, 20, 60, {Units: 'DegF'}));
                this.devices.push(new AssetDevice('Heater Temperature', this, Math.floor(Math.random()) + 50, 40, 100, {Units: 'DegF'}));
                break;
            default:
                break;
        }
    }
}

class AssetDevice{
    constructor(deviceName, asset, seedValue, minValue, maxValue, properties){
        this.deviceName = deviceName;
        this.seedValue = seedValue;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.properties = properties;
        this.id = asset.name;
    }

    tick(timestamp){
        var direction = this.seedValue > this.maxValue ? -1 : (this.seedValue < this.minValue ? 1 : (Math.random() < .5 ? -1 : 1));
        var step = direction * (Math.random() * (this.maxValue - this.minValue) * .02);
        this.seedValue += step;
        var status = Math.random() > .95 ? 'Bad' : 'Good';
        var event = {Timestamp: timestamp, Id: this.id, [this.deviceName]: this.seedValue, Status: status};
        Object.keys(this.properties).forEach(p => event[p] = this.properties[p]);
        return event;
    }
}