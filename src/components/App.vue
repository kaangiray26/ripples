<template>
    <div class="container py-4">
        <div class="d-flex flex-column">
            <h1 class="mb-3">Ripples</h1>
            <div v-if="!connected" class="d-flex flex-column">
                <div class="input-group mb-2">
                    <span class="input-group-text bi bi-person-circle" id="basic-addon1"></span>
                    <input v-model="username" type="text" class="form-control" placeholder="Username"
                        aria-label="Username" aria-describedby="basic-addon1" autofocus>
                </div>
                <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-dark" @click="connect">Connect</button>
                </div>
            </div>
            <div v-if="connected" class="d-flex flex-column">
                <div class="input-group mb-3">
                    <textarea ref="textarea" v-model="message" class="form-control" rows="1" placeholder="Message"
                        @keypress="handle_keys" @input="handle_input"></textarea>
                    <button class="btn btn-dark bi bi-send-fill" @click="handle_send"></button>
                </div>
                <div class="d-flex flex-column">
                    <label for="customRange1" class="form-label">Volume</label>
                    <input type="range" class="form-range" id="customRange1" @input="handle_volume_change">
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { Peer } from '/js/peer.js';

const username = ref('');
const message = ref('');
const textarea = ref(null);
const connected = ref(false);

const peer = ref(null);
const secrets = ref({
    id: null,
    token: null,
})

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

async function handle_keys(event) {
    // Enter
    if (event.key == "Enter") {
        textarea.value.focus();
        event.preventDefault();

        // Return if message is empty
        if (!message.value.length) return;

        peer.value.send({
            type: 'message',
            data: message.value
        })

        message.value = '';
    }
}

async function handle_input() {
    // Check how many lines the textarea has
    let lines = textarea.value.value.split('\n').length;

    if (lines > 5) {
        lines = 5;
    }

    textarea.value.rows = lines;
}

async function handle_volume_change(event) {
    peer.value.send({
        type: 'volumechange',
        level: event.target.value
    })
}

async function handle_send() {
    textarea.value.focus();

    // Return if message is empty
    if (!message.value.length) return;

    // Send message
    peer.value.send({
        type: 'message',
        data: message.value
    })

    // Clear message
    message.value = '';
}

async function setup() {
    // Create credentials
    await generate_secrets();
    peer.value = new Peer(secrets.value.id, secrets.value.token);

    peer.value.onconnection = async () => {
        connected.value = true;
    }

    console.log(peer.value);
}

onBeforeMount(() => {
    setup();
})
</script>