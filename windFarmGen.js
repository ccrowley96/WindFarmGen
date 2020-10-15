class WindSimulation {
    constructor(seedTimeMillis, intervalMillis){
        this.windFarms = []; this.usedIds = {};
        this.seedTimeMillis = seedTimeMillis;
        this.intervalMillis = intervalMillis;
        this.windFarms.push(new WindFarm('Laconia', this, 3));
        this.windFarms.push(new WindFarm('Somerville', this, 5));
        this.windFarms.push(new WindFarm('Bristol', this, 2));
        this.windFarms.push(new WindFarm('Franklin', this, 6));
    }

    tick(){
        this.seedTimeMillis += this.intervalMillis;
        var self = this;
        var events = [];
        this.windFarms.forEach(function(wf){
            wf.windMills.forEach(function(wm){
                wm.systems.forEach(function(sys){
                    sys.devices.forEach(function(d){
                        events.push(d.tick((new Date(self.seedTimeMillis).toISOString())));
                    })
                })
            });
        });
        return events;
    }

    generateTsmInstances(){
        var instancesArray = [];
        this.windFarms.forEach(function(wf){
            wf.windMills.forEach(function(wm){
                wm.systems.forEach(function(sys){
                    sys.devices.forEach(function(d){
                        var instance = {
                            timeSeriesId: [d.id],
                            hierarchyIds: ['hTBD'],
                            typeId: 'tTBD',
                            description: d.windMillSystem.windMill.name + ' ' + d.windMillSystem.name +  ' ' + d.name,
                            instanceFields: {
                                Name: d.name,
                                Group: sys.name,
                                Windmill: wm.name,
                                Location: wf.name
                            }
                        }
                        Object.keys(d.properties).forEach(prop => instance.instanceFields[prop] = d.properties[prop]);
                        instancesArray.push(instance);
                    });
                });
            });
        });
        downloadText(JSON.stringify({put: instancesArray}));
    }

    generateId(){
        
        // IDS WITH SHORT GUIDS
        // var id = this.shortGuid();
        // while(this.usedIds[id]){
        //     id = this.shortGuid;
        // }
        // this.usedIds[id] = true;

        // STABLE MONOTONICALLY INCREASING IDS
        var id = Object.keys(this.usedIds).length.toString();

        this.usedIds[id] = true;
        return "Sensor_" + id;
    }

    shortGuid() {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + '-' + s4();
      }
}

class WindFarm{
    constructor(name, windSimulation, windmillNumber){
        this.windMills = [];
        this.name = name;
        this.windSimulation = windSimulation;
        for(var i = 0; i < windmillNumber; i++){
            this.windMills.push(new WindMill('WM' + (i + 1), this));
        }
    }
}

class WindMill{
    constructor(name, windFarm){
        this.systems = [];
        this.name = name
        this.windFarm = windFarm;
        this.systems.push(new WindMillSystem('Environment', this));
        this.systems.push(new WindMillSystem('Internals', this));    
        this.systems.push(new WindMillSystem('Grid', this));    
    }
}

class WindMillSystem{
    constructor(name, windMill){
        this.devices = [];
        this.name = name;
        this.windMill = windMill;
        switch(name) {
            case 'Environment': 
                this.devices.push(new WindMillDevice('Outdoor Temperature', this, Math.floor(Math.random() * 20) + 40, 0, 100, {Units: 'degF'}));
                this.devices.push(new WindMillDevice('Atmospheric Pressure', this, Math.floor(Math.random()) + 30, 29, 31, {Units: 'in'}));
                this.devices.push(new WindMillDevice('Wind Velocity', this,  Math.floor(Math.random() * 30), 0, 70, {Units: 'mph'}));
                break;
            case 'Internals': 
                this.devices.push(new WindMillDevice('Bearing Temperature', this, Math.floor(Math.random() * 30) + 90, 90, 200, {Units: 'degF'}));
                this.devices.push(new WindMillDevice('Oil Viscosity', this, Math.floor(Math.random() * 5) + 10, 10, 80, {Units: 'cSt'}));
                break;
            case 'Grid': 
                this.devices.push(new WindMillDevice('Total Power Output', this, Math.floor(Math.random() * 300) + 50, 50, 600, {Units: 'kwH'}));
                this.devices.push(new WindMillDevice('Available Grid Capacity', this, Math.floor(Math.random() * 300) + 50, 50, 600, {Units: 'kwH'}));
                break;
            default:
                break;
        }
    }
}

class WindMillDevice{
    constructor(name, windMillSystem, seedValue, minValue, maxValue, properties){
        this.name = name;
        this.windMillSystem = windMillSystem;
        this.seedValue = seedValue;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.properties = properties;
        this.id = this.windMillSystem.windMill.windFarm.windSimulation.generateId();
    }

    tick(timestamp){
        var direction = this.seedValue > this.maxValue ? -1 : (this.seedValue < this.minValue ? 1 : (Math.random() < .5 ? -1 : 1));
        var step = direction * (Math.random() * (this.maxValue - this.minValue) * .02);
        this.seedValue += step;
        var description = this.windMillSystem.windMill.name + ' ' + this.windMillSystem.name +  ' ' + this.name;
        var status = Math.random() > .95 ? 'Bad' : 'Good';
        var event = {Description: description, Timestamp: timestamp, Group: this.windMillSystem.name, Windmill: this.windMillSystem.windMill.name, Location: this.windMillSystem.windMill.windFarm.name, Name: this.name, Id: this.id, Value: this.seedValue, Status: status};
        Object.keys(this.properties).forEach(p => event[p] = this.properties[p]);
        return event;
    }
}

var packetNumber = 0;
function simulate(){

    // create event hub client from input connection string
    var connectionString = document.getElementById('ehcs').value;
    var pieces = connectionString.split(';');
    ehClient = new EventHubClient(
        {
            'name': pieces[3].split('EntityPath=')[1],
            'namespace': pieces[0].split('//')[1].split('.')[0],
            'sasKey': pieces[2].split('SharedAccessKey=')[1],
            'sasKeyName': pieces[1].split('SharedAccessKeyName=')[1],
            'timeOut': 10,
        });


    var startDateMillis = (new Date()).valueOf();
    // 9K Packets is 1 day
    var windSimulation = new WindSimulation(startDateMillis, 10000);
    windSimulation.generateTsmInstances();
    setInterval(function(){
        pushEvents(windSimulation.tick());
    }, 15);
}

var ehClient;

function pushEvents(events){
    var msg = new EventData(events);
    ehClient.sendMessage(msg, function (messagingResult) {
        packetNumber++;
        if(messagingResult.result !== 'Success'){
            document.getElementById("result").innerHTML = '<b>' + messagingResult.result + '</b><br/> Message ' + packetNumber + '<br/><br/><b>Payload example</b><br/> ' + JSON.stringify(events[0]);
        }
        else if(packetNumber % 100 === 0){
            document.getElementById("result").innerHTML = '<b>' + messagingResult.result + '</b><br/> Message ' + packetNumber + '<br/><br/><b>Payload example</b><br/> ' + JSON.stringify(events[0]);
        }
    });
}

function downloadText (text) {
    var blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    var blobURL = window.URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.setAttribute("href", blobURL);
    link.setAttribute("download", "Instances.json");
    link.innerHTML= "";
    document.body.appendChild(link);
    link.click();
}  