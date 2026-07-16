<template>
  <nav class="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(15,23,42,0.07)]"
    style="padding-bottom: env(safe-area-inset-bottom, 0)">
    <div class="grid grid-cols-5 px-1 py-1">

      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 px-1 transition-all duration-200"
        :class="isActive(item.path) ? 'text-blue-600' : 'text-slate-400'"
      >
        <!-- Active indicator dot -->
        <div class="relative flex items-center justify-center">
          <div
            v-if="isActive(item.path)"
            class="absolute inset-0 rounded-xl bg-blue-50 scale-x-[2] scale-y-[1.5] -z-10"
          ></div>
          <component :is="item.icon" :size="20" :stroke-width="isActive(item.path) ? 2.5 : 1.75" />
        </div>
        <span class="text-[10px] font-semibold tracking-tight" :class="isActive(item.path) ? 'text-blue-600' : 'text-slate-400'">
          {{ item.name }}
        </span>
      </RouterLink>

    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Clock3, BadgePlus, CarFront, UserRound, Briefcase } from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  {
    name: 'Absensi',
    path: '/absensi',
    icon: Clock3,
  },
  {
    name: 'Lembur',
    path: '/lembur',
    icon: BadgePlus,
  },
  {
    name: 'Tugas',
    path: '/tugas',
    icon: Briefcase,
  },
  {
    name: 'Inspeksi',
    path: '/inspeksi',
    icon: CarFront,
  },
  {
    name: 'Profil',
    path: '/profile',
    icon: UserRound,
  },
]

const isActive = (path: string) => {
  if (route.path === '/' && path === '/absensi') return true
  return route.path === path || route.path.startsWith(path + '/')
}
</script>