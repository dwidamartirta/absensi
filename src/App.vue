<template>
  <LoadingPopup />
  <Toast />
  <PwaInstallPrompt />
  <RouterView />
</template>

<script setup lang="ts">
import LoadingPopup from './components/LoadingPopup.vue'
import Toast from './components/Toast.vue'
import PwaInstallPrompt from './components/PwaInstallPrompt.vue'
</script>