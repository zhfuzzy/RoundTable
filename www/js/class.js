var peerColorScheme = {};
var peerName = 'Lucky' + Math.floor(Math.random() * 1000);
var roomInfo;

var roomlist = document.getElementById('roomlist');
var sendBtn = document.getElementById('sendbtn');

peerColorScheme['init'] = "#ABCDEF";
peerColorScheme['wheel'] = mkColorWheel(peerColorScheme['init']);

handlePageColor();

var socket = io.connect();

socket.emit('onboard class room');
console.log('emit: onboard class room');

socket.on('class room info', function(num, max) {
    var etabar = document.getElementById('eta');
    if (num === max) {
	etabar.innerText = 'Ready To Jump!';
    } else {
	etabar.innerText = num + ' / ' + max;
    }
    console.log('Room has', num, 'member(s)');
});

socket.on('goto room', function(targetRoom) {
    console.log('got order: goto room', targetRoom);
    window.location.replace('/room/' + targetRoom);
});
