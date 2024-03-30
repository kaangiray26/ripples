// Peer config
const address = "wss://home.buzl.uk:443/ws?"
// const address = "ws://localhost:3000/ws?"
const config = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
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
    ],
    sdpSemantics: "unified-plan",
}

class Peer {
    constructor(id, token) {
        this.src = id;
        this.dst = null;
        this.token = token;

        // Connections
        this.socket = new WebSocket(address + new URLSearchParams({
            key: 'ripples',
            id: this.src,
            token: this.token
        }));
        this.pc = new RTCPeerConnection(config);
        this.datachannel = this.pc.createDataChannel("chat");

        // Candidates
        this.candidates = [];

        // Set event listeners
        this.setRTCListeners();
        this.setSocketListeners();

        // Callbacks
        this.onconnected = null;
        this.onicegatheringcomplete = null;
    }

    setRTCListeners() {
        // WebRTC
        this.pc.onnegotiationneeded = async () => {
            await this.pc.setLocalDescription();
        }

        this.pc.onclose = () => {
            console.log('Peer connection closed.');
        }

        // ICE Candidates
        this.pc.onicecandidate = ({ candidate }) => {
            // Check for validity
            if (candidate == null) {
                console.log("ICE Candidates:", this.pc.iceGatheringState)
                this.pc.onicecandidate = () => { };
                if (this.onicegatheringcomplete) this.onicegatheringcomplete();
                return
            }

            // Store candidates
            this.candidates.push(candidate);
        }

        // DataChannel
        this.datachannel.onopen = (event) => {
            console.log('Data channel opened.', event);
            this.onconnected();
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
            console.log("Socket:", message);

            if (message.type == 'answer') {
                await this.pc.setRemoteDescription(message.data);
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

        // Wait for iceGatheringState to complete
        if (this.pc.iceGatheringState != "complete") {
            this.onicegatheringcomplete = () => {
                this.onicegatheringcomplete = null;
                this.sendOffer();
            }
            return
        }

        // Negotiation
        this.sendOffer();
    }

    sendOffer() {
        // Send candidates
        // this.socket.send(JSON.stringify({
        //     src: this.src,
        //     dst: this.dst,
        //     type: 'candidate',
        //     data: candidate
        // }))

        // this.socket.send(JSON.stringify({
        //     src: this.src,
        //     dst: this.dst,
        //     type: 'candidates',
        //     candidates: this.candidates
        // }))

        // Send offer
        this.pc.createOffer()
            .then((offer) => {
                this.pc.setLocalDescription(offer)
            })
            .then(() => {
                console.log('Sending offer:', this.pc.localDescription);
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