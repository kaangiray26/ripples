<template>
    <div v-if="visible" class="overlay">
        <div class="overlay-container">
            <h3 class="mb-3">New ICE server</h3>
            <div class="mb-1">
                <label for="exampleFormControlInput1" class="form-label">URI</label>
                <input v-model="uri" type="text" class="form-control" id="exampleFormControlInput1"
                    placeholder="example.com">
            </div>
            <div class="mb-1">
                <label for="exampleFormControlTextarea2" class="form-label">Username</label>
                <input v-model="username" type="text" class="form-control" id="exampleFormControlInput2"
                    placeholder="username">
            </div>
            <div class="mb-2">
                <label for="exampleFormControlTextarea3" class="form-label">Credential</label>
                <input v-model="credential" type="text" class="form-control" id="exampleFormControlInput3"
                    placeholder="credential">
            </div>
            <div class="d-flex justify-content-end">
                <button type="button" class="btn btn-dark me-2" @click="visible = false">Cancel</button>
                <button type="button" class="btn btn-dark" @click="add_server">Add</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { defaultConfig } from '/js/peer.js';

const visible = ref(false);
const emit = defineEmits(['add']);

const uri = ref('');
const username = ref('');
const credential = ref('');

async function add_server() {
    if (!uri.value) return;

    // Add values to the server object
    const server = {
        urls: uri.value,
    }
    if (username.value) {
        server.username = username.value;
    }
    if (credential.value) {
        server.credential = credential.value;
    }

    // Emit new server
    emit('add', server);

    // Hide the modal
    await hide();
}

async function reset() {
    uri.value = '';
    username.value = '';
    credential.value = '';
}

async function show() {
    await reset();
    visible.value = true;
}

async function hide() {
    visible.value = false;
}


defineExpose({
    show,
    hide
});

</script>