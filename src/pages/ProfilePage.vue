<template>
  <div class="page-container pb-bottom-nav">

    <!-- Header -->
    <header class="page-header">
      <div class="page-header-inner">
        <div class="flex items-center gap-3">
          <div class="icon-badge icon-badge-blue h-10 w-10 rounded-xl">
            <UserRound :size="20" />
          </div>
          <div>
            <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Profil Saya</h1>
            <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Informasi Akun</p>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-md px-4 pt-5">

      <!-- Profile Card -->
      <section class="card-glass relative overflow-hidden p-5 mb-5">
        <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/8 blur-3xl pointer-events-none"></div>

        <div v-if="isLoading" class="flex flex-col items-center py-4">
          <div class="skeleton h-20 w-20 rounded-full mb-4"></div>
          <div class="skeleton h-4 w-32 rounded-lg mb-2"></div>
          <div class="skeleton h-3 w-24 rounded-lg"></div>
        </div>

        <div v-else class="relative z-10 flex flex-col items-center text-center">
          <!-- Avatar -->
          <div class="relative mb-4">
            <div class="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-black shadow-xl shadow-blue-200 select-none">
              {{ inisial }}
            </div>
            <div class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 border-2 border-white shadow-sm">
              <CheckCircle2 :size="12" class="text-white" />
            </div>
          </div>

          <h2 class="text-lg font-black tracking-tight text-slate-900">{{ profile?.name || '-' }}</h2>
          <p class="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{{ jabatan || 'Karyawan' }}</p>
          <div class="flex items-center gap-1.5 mt-2">
            <div class="badge badge-success">Aktif</div>
            <div class="badge badge-neutral">{{ profile?.nik_karyawan || '-' }}</div>
          </div>

          <!-- Quick Stats -->
          <div class="mt-5 w-full grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
            <div class="text-center">
              <p class="text-xl font-black text-slate-900">{{ profile?.attendance_days ?? '-' }}</p>
              <p class="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Hadir</p>
            </div>
            <div class="text-center border-x border-slate-100">
              <p class="text-xl font-black text-slate-900">{{ profile?.absence_days ?? '-' }}</p>
              <p class="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Absen</p>
            </div>
            <div class="text-center">
              <p class="text-xl font-black text-slate-900">{{ profile?.late_days ?? '-' }}</p>
              <p class="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Terlambat</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Info Card -->
      <section class="card p-5 mb-4">
        <div class="flex items-center gap-2 mb-4">
          <User :size="16" class="text-blue-600" />
          <p class="section-label">Informasi Pribadi</p>
        </div>
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="skeleton h-10 w-full rounded-xl"></div>
        </div>
        <div v-else class="space-y-3">
          <div class="flex items-center justify-between py-2 border-b border-slate-50">
            <div>
              <p class="info-row-label">Email</p>
              <p class="info-row-value">{{ profile?.email || '-' }}</p>
            </div>
            <Mail :size="16" class="text-slate-300" />
          </div>
          <div class="flex items-center justify-between py-2 border-b border-slate-50">
            <div>
              <p class="info-row-label">No. WhatsApp</p>
              <p class="info-row-value">{{ profile?.phone_number || '-' }}</p>
            </div>
            <Phone :size="16" class="text-slate-300" />
          </div>
          <div class="flex items-center justify-between py-2 border-b border-slate-50">
            <div>
              <p class="info-row-label">Jenis Kelamin</p>
              <p class="info-row-value">{{ profile?.detail?.gender || '-' }}</p>
            </div>
            <UserRound :size="16" class="text-slate-300" />
          </div>
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="info-row-label">Alamat</p>
              <p class="info-row-value">{{ profile?.address || '-' }}</p>
            </div>
            <MapPin :size="16" class="text-slate-300" />
          </div>
        </div>
      </section>

      <!-- Menu -->
      <section class="card overflow-hidden mb-4">
        <RouterLink
          v-for="(item, i) in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center justify-between px-5 py-4 transition-all hover:bg-slate-50 active:bg-slate-100"
          :class="i < menuItems.length - 1 ? 'border-b border-slate-50' : ''"
        >
          <div class="flex items-center gap-3">
            <div class="icon-badge h-9 w-9 rounded-xl" :class="item.iconClass">
              <component :is="item.icon" :size="17" />
            </div>
            <span class="text-sm font-semibold text-slate-700">{{ item.label }}</span>
          </div>
          <ChevronRight :size="16" class="text-slate-300" />
        </RouterLink>
      </section>

      <!-- Logout -->
      <button
        @click="handleLogout"
        :disabled="isLoggingOut"
        class="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-rose-100 bg-rose-50 py-4 text-sm font-bold text-rose-500 transition-all hover:bg-rose-100 active:scale-[0.98] disabled:opacity-60"
      >
        <div v-if="isLoggingOut" class="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent"></div>
        <LogOut v-else :size="17" />
        {{ isLoggingOut ? 'Keluar...' : 'Keluar dari Akun' }}
      </button>

      <p class="mt-6 mb-2 text-center text-[11px] font-medium text-slate-400">
        © {{ new Date().getFullYear() }} PT. Dwi Damar Tirta · v1.0
      </p>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UserRound, CheckCircle2, Mail, Phone, MapPin, ChevronRight, LogOut, User, Lock, FileText, Users } from 'lucide-vue-next'
import BottomNav from '../components/BottomNav.vue'
import { useAuthStore } from '../stores/authStore'
import { getProfile } from '../api/profile'
import { useToast } from '../composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const isLoading = ref(true)
const isLoggingOut = ref(false)
const profile = ref<any>(null)

const inisial = computed(() => {
  const n = profile.value?.name || ''
  return n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
})
const jabatan = computed(() => profile.value?.position?.name || '')

const menuItems = [
  { label: 'Edit Profil', path: '/edit-profil', icon: User, iconClass: 'icon-badge-blue' },
  { label: 'Keamanan & Kata Sandi', path: '/ganti-password', icon: Lock, iconClass: 'icon-badge-amber' },
  { label: 'Pengajuan Ketidakhadiran', path: '/ketidakhadiran', icon: FileText, iconClass: 'icon-badge-teal' },
  { label: 'Karyawan Tidak Masuk', path: '/karyawan-tidak-masuk', icon: Users, iconClass: 'icon-badge-rose' },
]

onMounted(async () => {
  isLoading.value = true
  try {
    const res = await getProfile()
    profile.value = res.data.data
  } catch {
    showToast('Gagal memuat profil.', 'error')
  } finally {
    isLoading.value = false
  }
})

const handleLogout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await authStore.logout()
    router.replace('/login')
  } catch {
    showToast('Gagal logout. Coba lagi.', 'error')
  } finally {
    isLoggingOut.value = false
  }
}
</script>