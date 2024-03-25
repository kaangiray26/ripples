// Peer config
const address = "wss://home.buzl.uk:443/ws?"
// const address = "ws://localhost:3000/ws?"
const config = {
    iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] }
    ],
    sdpSemantics: 'unified-plan'
}

class Peer {
    constructor(id, token) {
        this.id = id;
        this.token = token;
        this.makingOffer = false;

        // Connections
        this.socket = new WebSocket(address + new URLSearchParams({
            key: 'ripples',
            id: this.id,
            token: this.token
        }));
        this.pc = new RTCPeerConnection(config);
        this.datachannel = this.pc.createDataChannel("chat");

        // Set event listeners
        this.setRTCListeners();
        this.setSocketListeners();

        // Callbacks
        this.onconnection = null;
    }

    setRTCListeners() {
        // WebRTC
        this.pc.onnegotiationneeded = async () => {
            try {
                this.makingOffer = true;
                await this.pc.setLocalDescription();
                // send through socket
                // console.log({
                //     description: this.pc.localDescription
                // })
            }
            catch (err) {
                console.error(err);
            }
            finally {
                this.makingOffer = false;
            }
        }

        this.pc.onicecandidate = ({ candidate }) => {
            // send through socket
            // console.log({
            //     candidate: candidate
            // })
        }

        // DataChannel
        this.datachannel.onopen = (event) => {
            console.log('Data channel opened.', event);
            this.onconnection();
        }

        this.datachannel.onclose = (event) => {
            console.log('Data channel closed.', event);
        }

        this.datachannel.onmessage = (event) => {
            console.log('Message received:', event.data);
        }
    }

    setSocketListeners() {
        this.socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type == 'answer') {
                this.pc.setRemoteDescription(message.data);
            }
        }

        this.socket.onopen = async () => {
            // Start heartbeat
            console.log('Websocket connection opened.');
            setInterval(() => {
                this.socket.send(JSON.stringify({
                    type: "hearbeat"
                }));
            }, 5000);
        }

        this.socket.onclose = async () => {
            console.log('Websocket connection closed.');
        }
    }

    connect(dst) {
        // Negotiation
        this.pc.createOffer()
            .then((offer) => this.pc.setLocalDescription(offer))
            .then(() => {
                // Send through websocket
                this.socket.send(JSON.stringify({
                    src: this.id,
                    dst: dst,
                    type: this.pc.localDescription.type,
                    sdp: this.pc.localDescription.sdp,
                }))
            })
    }

    send(data) {
        this.datachannel.send(JSON.stringify(data));
    }
}

export { Peer };