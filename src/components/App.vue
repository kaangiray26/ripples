<template>
    <div class="container py-4">
        <div class="d-flex flex-column mb-2">
            <h1 class="mb-3">Ripples</h1>
            <div class="mb-2">ICE Gathering: {{ icecandidatestatus }}</div>
            <div v-if="!connected" class="d-flex flex-column">
                <div class="input-group mb-2">
                    <span class="input-group-text bi bi-person-circle" id="basic-addon1"></span>
                    <input v-model="username" type="text" class="form-control" placeholder="Username"
                        aria-label="Username" aria-describedby="basic-addon1" autofocus>
                    <button type="button" class="btn btn-dark" @click="connect">Connect</button>
                </div>
            </div>
            <div v-if="connected" class="d-flex flex-column">
                <div class="d-flex flex-column mb-2">
                    <label for="customRange1" class="form-label">Volume</label>
                    <input type="range" class="form-range" id="customRange1" @input="handle_volume_change">
                </div>
            </div>
        </div>
        <div class="d-flex flex-column">
            <div class="d-flex">
                <button type="button" class="btn btn-dark" @click="show_config = !show_config">ICE servers</button>
            </div>
            <ul v-if="show_config" class="mt-2">
                <li v-for="(server, index) in config.iceServers" :key="server" class="ice-server">
                    <div class="mb-1">
                        <label for="exampleFormControlInput1" class="form-label">URI</label>
                        <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="example.com"
                            v-model="server.urls">
                    </div>
                    <div class="mb-1">
                        <label for="exampleFormControlInput2" class="form-label">Username</label>
                        <input type="text" class="form-control" id="exampleFormControlInput2" placeholder="username"
                            v-model="server.username">
                    </div>
                    <div class="mb-2">
                        <label for="exampleFormControlInput1" class="form-label">Credential</label>
                        <input type="text" class="form-control" id="exampleFormControlInput1" placeholder="credential"
                            v-model="server.credential">
                    </div>
                    <div class="d-flex justify-content-end">
                        <button type="button" class="btn btn-dark" @click="remove_server(index)">Remove</button>
                    </div>
                </li>
                <li class="d-flex">
                    <button type="button" class="btn btn-dark me-2" @click="reset_servers">Reset</button>
                    <button type="button" class="btn btn-dark me-2" @click="save_servers">Save</button>
                    <button type="button" class="ms-auto btn btn-dark" @click="iceservermodal.show">Add new</button>
                </li>
            </ul>
        </div>
    </div>
    <ICEServerModal ref="iceservermodal" @add="add_server" />
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { Peer, defaultConfig } from '/js/peer.js';
import ICEServerModal from '/components/ICEServerModal.vue';

const config = ref(defaultConfig);
const show_config = ref(false);
const icecandidatestatus = ref('new');

const username = ref('');
const connected = ref(false);

const iceservermodal = ref(null);

const peer = ref(null);
const secrets = ref({
    id: null,
    token: null,
})

async function reset_servers() {
    config.value = defaultConfig;
    localStorage.setItem('config', JSON.stringify(config.value));
}

async function save_servers() {
    localStorage.setItem('config', JSON.stringify(config.value));
}

async function add_server(server) {
    config.value.iceServers.push(server);
    localStorage.setItem('config', JSON.stringify(config.value));
}

async function remove_server(index) {
    config.value.iceServers.splice(index, 1);
    localStorage.setItem('config', JSON.stringify(config.value));
}

async function connect() {
    if (!username.value.length) return;

    console.log('Connecting to peer:', username.value);
    peer.value.connect(username.value);
}

async function generate_uuid() {
    return crypto.randomUUID();
}

async function generate_secret(nbytes) {
    return crypto.getRandomValues(new Uint8Array(nbytes * 2)).reduce((p, i) => p + (i % 16).toString(16), '');
}

async function generate_secrets() {
    secrets.value.id = await generate_uuid();
    secrets.value.token = await generate_secret(32);
}

async function handle_volume_change(event) {
    peer.value.send({
        type: 'volumechange',
        level: event.target.value
    })
}

async function setup() {
    // Load config
    config.value = defaultConfig;
    if (localStorage.getItem('config')) {
        config.value = JSON.parse(localStorage.getItem('config'));
    }

    // Create credentials
    await generate_secrets();

    // Create peer
    peer.value = new Peer(secrets.value.id, secrets.value.token, config.value);
    peer.value.onicegatheringcompleted = async () => {
        icecandidatestatus.value = 'completed';
    }
    peer.value.onconnected = async () => {
        connected.value = true;
    }
}

onBeforeMount(() => {
    setup();
})
</script>