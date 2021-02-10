var packetNumber = 0;
let interval = null; 

function simulate(){
    // Clear any prior interval
    clearInterval(interval);

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

    // Validate inputs
    let daysAgo = document.getElementById('daysAgo').value;
    let dontPushPastNow = document.getElementById('pastNow').checked;
    let timestampSpacing = document.getElementById('timestampSpacing').value;
    let livePushFrequency = document.getElementById('livePushFrequency').value;
    let pushFrequency = document.getElementById('pushFrequency').value;
    let simType = document.getElementById('simType').value;

    if(daysAgo === "" || timestampSpacing === "" || livePushFrequency === "" || pushFrequency === ""){
        throw new Error("Input controls cannot be empty")
    }

    daysAgo = Number(daysAgo);
    timestampSpacing = Number(timestampSpacing);
    livePushFrequency = Number(livePushFrequency);
    pushFrequency = Number(pushFrequency);
    let Simulation = simType === 'Wind Farm' ? WindSimulation : AssetSimulation;

    var startDateMillis = (new Date()).valueOf() - (daysAgo * 86400000); // get starting date

    let startLiveSimulation = () => {
        var simulation = new Simulation((new Date()).valueOf(), livePushFrequency);
        simulation.generateTsmInstances(false);
        interval = setInterval(function(){
            console.log('Pushing live data: ', new Date(simulation.seedTimeMillis))
            pushEvents(simulation.tick());
        }, livePushFrequency);
    }

    var simulation = new Simulation(startDateMillis, timestampSpacing);
    simulation.generateTsmInstances();
    console.log('Beginning simulation @ ', new Date(startDateMillis))
    interval = setInterval(function(){
        // Clear interval if past now
        if(simulation.seedTimeMillis > (new Date()).valueOf() && dontPushPastNow){
            console.log('Reached "now", beginning live simulation');
            clearInterval(interval);
            startLiveSimulation();
        } 
        pushEvents(simulation.tick());
    }, pushFrequency);
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

function downloadText (text, fileName) {
    var blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    var blobURL = window.URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.setAttribute("href", blobURL);
    link.setAttribute("download", fileName ? fileName : "Instances.json");
    link.innerHTML= "";
    document.body.appendChild(link);
    link.click();
}  

// Event listeners
window.onload = function() {
    let timestampSpacing = Number(document.getElementById('timestampSpacing').value);
    let pushFrequency = Number(document.getElementById('pushFrequency').value);

    let updateTimeEstimate = () => {
        let conversion = 1000 * 60; // msec -> minutes
        let msInDay = 24 * 60 * 60 * 1000;
        let numEventsToSendPerDay = msInDay / timestampSpacing;
        let timeToSend = (pushFrequency / conversion) * numEventsToSendPerDay; // frequency in seconds * number of events
        document.getElementById('pushFrequencyLabel').innerHTML = timeToSend.toFixed(2);
    }

    document.getElementById('pushFrequency').addEventListener('change', event => {
        pushFrequency = Number(event.target.value);
        updateTimeEstimate();
    });
    
    document.getElementById('timestampSpacing').addEventListener('change', event => {
        timestampSpacing = Number(event.target.value);
        updateTimeEstimate();
    });

    // Live push frequency 
    document.getElementById('livePushFrequency').addEventListener('change', event => {
        // update label
        const label = document.getElementById('livePushLabel').innerHTML = event.target.value;
    });

    document.getElementById('pastNow').addEventListener('change', event => {
        document.getElementById('liveFrequency').classList.remove('disabled');
        document.getElementById('livePushFrequency').disabled = false;
        if(!event.target.checked){
            document.getElementById('liveFrequency').classList.add('disabled');
            document.getElementById('livePushFrequency').disabled = true;
        }
    })
}