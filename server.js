// creazione di un dispatcher in grado di eseguire l'interazione in modalità publish subscribe (pubnub)

var Express = require('express');
var PubNub = require('pubnub');

var app = Express();

//Inizializzazione di struttura dati
let map = new Map();

var PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
  });

app.listen(PORT, function()
{
            
    console.log("Server listen to port 3000\n");
});

publish();

// funzione di publish

function publish () 
{
    pubnub = new PubNub({
        publishKey : 'pub-c-c875966e-dfa8-418f-8b75-26d75c09e4eb',
        subscribeKey : 'sub-c-9d2252f0-974d-11e9-8107-d6b10db480fa'
    });

//PUBBLICO LA SITUAZIONE ATTUALE DEL NOW CONNECTION
    function publishNowConnectionRoom(roomid,user) {
       
        let r = map.get(roomid);

        pubnub.publish(
            {      
                message: {
                    now:  r.nowcapacity,
                    respserver: 'Connection OK!'
                },
                channel: "countify-connection-room-"+roomid+"-"+user,
                
            }, 
            function (status, response) {
               
            }
        );

    }

    
//PUBBLICA GLI INCREMENTI E DECREMENTI DELLA STANZA
    function publishSampleMessage(roomid,user) {

        let r = map.get(roomid);

        console.log(r);

        pubnub.publish(
            {      
                message: {
                    respserver: user + ' update room. ' + 'Roomid : '+roomid+', now=' +   r.nowcapacity,
                    now:   r.nowcapacity
                },
                channel: 'countify-channel-room-'+roomid
                
            }, 
            function (status, response) {
                if (status.error) {
                    // handle error
                    console.log(status)
                } else {
                    console.log('DISPATCHER publish an event!');
                    console.log('ROOM');
                    console.log('\t::Now-Capacity ROOM='+roomid+' : ' + r.nowcapacity+'\n');
                    //aggiorna il dato sul database!?
                }
            }
        );
    }

    //REAZIONE AGLI EVENTI
    pubnub.addListener({
       
        message: function(event) {

            if(event.message.connection == true) {
                console.log('Connected Successful! User ' + event.message.user + ' and room ' + event.message.roomid +' is now CONNECTED!');
                if(map.get(event.message.roomid) == undefined) {
                    console.log('La stanza non è nella struttura dati');
                    var r = { 
                                "maxcapacity":event.message.maxcapacity ,
                                "nowcapacity":0 
                            }

                    map.set(event.message.roomid, r);
                }
                else {
                    console.log('Room Exists in data structure.');
                    console.log(event.message.roomid + " " + event.message.user);
                    console.log(map.get(1) + map.get(event.message.roomid).nowcapacity);
                }

                    publishNowConnectionRoom(event.message.roomid,event.message.user);
                
            }
            else
                console.log('There isn\'t any connection with =>\n "user": ' + event.message.user + ' and "roomid": ' + event.message.roomid);
            
                if(event.message.modnow == true) {
                    console.log('DISPATCHER rcv a request to increment now capacity to room '+event.roomid+' from app.');
                    console.log( '\t::Message from: '+ event.message.user + 
                ' for room: ' + event.message.roomname +
                ' with a max capacity of ' + event.message.maxcapacity + ' people\n' +
                ' Event Message : '+ event.message.updatenowcapacity);
                
                let r = map.get(event.message.roomid);
                
                var v = event.message.updatenowcapacity+r.nowcapacity;

                if( checkCapacity(v,r.maxcapacity) )
                    r.nowcapacity = v;
                else
                    console.log("Error! Capacity overflow!");

                publishSampleMessage(event.message.roomid,event.message.user);
                }

        },
        presence: function(presenceEvent) {
            // handle presence
        }
    });      


    console.log("Subscribing..");
    pubnub.subscribe({
        channels: ['countify-channel-rooms','room-connection'] 
    });
};

function checkCapacity(a,b) {
    if(a < 0 || a > b)
        return false;
    return true;
}