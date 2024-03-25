// Peer config
const address = "wss://home.buzl.uk:443/ws?"
// const address = "ws://localhost:3000/ws?"
const config = {
    iceServers: [
        {
            urls: "turn:standard.relay.metered.ca:80",
            username: "90e794d7186335533be6a215",
            credential: "05ker3YuARTJkdfP",
        },
        {
            urls: "turn:standard.relay.metered.ca:443",
            username: "90e794d7186335533be6a215",
            credential: "05ker3YuARTJkdfP",
        },
    ]
}

class Peer {
    constructor(id, token) {
        this.src = id;
        this.dst = null;
        this.token = token;
        this.makingOffer = false;

        // Connections
        this.socket = new WebSocket(address + new URLSearchParams({
            key: 'ripples',
            id: this.src,
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
            await this.pc.setLocalDescription();
        }

        this.pc.onicecandidate = ({ candidate }) => {
            // Check for validity
            if (!this.dst || !candidate || !candidate.candidate.length) return;

            // send through socket
            this.socket.send(JSON.stringify({
                src: this.src,
                dst: this.dst,
                type: 'candidate',
                data: candidate
            }))
        }

        this.pc.onclose = () => {
            console.log('Peer connection closed.');
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
        // Set destination
        this.dst = dst;

        // Negotiation
        this.pc.createOffer()
            .then((offer) => this.pc.setLocalDescription(offer))
            .then(() => {
                // Send through websocket
                this.socket.send(JSON.stringify({
                    src: this.src,
                    dst: this.dst,
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