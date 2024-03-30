<template>
    <div class="container py-4">
        <div class="d-flex flex-column">
            <h1 class="mb-3">Ripples</h1>
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
    </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { Peer } from '/js/peer.js';
import { popper } from '@popperjs/core';

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

async function handle_volume_change(event) {
    peer.value.send({
        type: 'volumechange',
        level: event.target.value
    })
}

async function setup() {
    // Create credentials
    await generate_secrets();

    // Create peer
    peer.value = new Peer(secrets.value.id, secrets.value.token);
    peer.value.onconnected = async () => {
        connected.value = true;
    }
}

onBeforeMount(() => {
    setup();
})
</script>