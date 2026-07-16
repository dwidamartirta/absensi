<template>
  <Toast />
  <PwaInstallPrompt />
  <RouterView />
</template>

<script setup lang="ts">
import Toast from './components/Toast.vue'
import PwaInstallPrompt from './components/PwaInstallPrompt.vue'
</script>