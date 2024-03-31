// Peer config
const address = "wss://home.buzl.uk:8443/ws?"
const defaultConfig = {
    iceServers: [
        {
            urls: "stun:stun.relay.metered.ca:80",
        },
        {
            urls: "turn:home.buzl.uk:443?transport=tcp",
            username: "test",
            credential: "test123",
        }
    ],
    sdpSemantics: "unified-plan",
    iceCandidatePoolSize: 1
}

class Peer {
    constructor(id, token, config) {
        this.src = id;
        this.dst = null;
        this.token = token;

        console.log("Using config:", config);

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
        this.onconnected = () => { };
        this.onicegatheringcomplete = () => { };
        this.onicegatheringcompleted = () => { };
    }

    setRTCListeners() {
        // WebRTC
        this.pc.onnegotiationneeded = async () => {
            await this.pc.setLocalDescription();
        }

        this.pc.onconnectionstatechange = () => {
            console.log('Connection state changed:', this.pc.connectionState);
        }

        this.pc.onclose = () => {
            console.log('Peer connection closed.');
        }

        // ICE Candidates
        this.pc.onicecandidate = ({ candidate }) => {
            // Check for validity
            if (candidate == null) {
                console.log("ICE gathering complete.")
                console.log("ICE Candidates:", this.pc.iceGatheringState, this.candidates)
                this.pc.onicecandidate = () => { };
                this.onicegatheringcompleted();
                if (this.onicegatheringcomplete) this.onicegatheringcomplete();
                return
            }

            // Store candidates
            this.candidates.push(candidate);
        }

        this.pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state changed:', this.pc.iceConnectionState);
        }

        this.pc.onicecandidateerror = (event) => {
            console.error('ICE candidate error:', event);
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
                console.log("Setting answer...");
                this.pc.setRemoteDescription(message.payload).then(() => {
                    console.log('Answer set:', message.payload);
                    console.log(this.datachannel);
                })
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

export { Peer, defaultConfig };