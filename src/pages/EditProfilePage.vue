<template>
  <div class="min-h-screen min-h-dvh bg-slate-50 text-slate-900 pb-36">

    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-100 px-4 py-4">
      <div class="mx-auto flex max-w-md items-center gap-4">
        <button @click="router.back()" class="btn-back" aria-label="Kembali">
          <ArrowLeft :size="18" />
        </button>
        <div class="flex-1">
          <h1 class="text-[15px] font-black tracking-tight leading-none text-slate-900">Update Data Diri</h1>
          <p class="text-[10px] font-bold text-slate-400 mt-1">Pastikan data pribadi Anda selalu benar</p>
        </div>
        <span v-if="changedFields.length" class="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
          {{ changedFields.length }} diubah
        </span>
      </div>
    </header>

    <main class="mx-auto max-w-md px-4 pt-5">
      <!-- Loading skeleton -->
      <div v-if="isLoading" class="space-y-4">
        <div class="skeleton h-40 w-full rounded-3xl"></div>
        <div v-for="i in 4" :key="i" class="skeleton h-16 w-full rounded-2xl"></div>
      </div>

      <template v-else>
        <!-- Kartu Foto + Kelengkapan -->
        <section class="card-glass relative overflow-hidden p-5 mb-5">
          <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/10 blur-3xl pointer-events-none"></div>
          <div class="relative z-10 flex items-center gap-4">
            <button type="button" class="relative shrink-0" @click="photoInput?.click()" :disabled="isUploading" aria-label="Ganti foto profil">
              <img v-if="photoUrl" :src="photoUrl" alt="Foto profil"
                class="h-[72px] w-[72px] rounded-full object-cover shadow-lg shadow-blue-100 ring-4 ring-white" />
              <div v-else
                class="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-blue-600 text-xl font-black text-white shadow-lg shadow-blue-200 ring-4 ring-white select-none">
                {{ inisial }}
              </div>
              <span class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow">
                <div v-if="isUploading" class="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <Camera v-else :size="13" />
              </span>
            </button>
            <input ref="photoInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onPhotoSelected" />

            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-black text-slate-900">{{ form.name || 'Nama Anda' }}</p>
              <p class="text-[11px] font-semibold text-slate-400">Ketuk foto untuk mengganti</p>

              <div class="mt-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Kelengkapan data</span>
                  <span class="text-[11px] font-black" :class="completeness === 100 ? 'text-emerald-600' : 'text-blue-600'">{{ completeness }}%</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div class="h-full rounded-full transition-all duration-500"
                    :class="completeness === 100 ? 'bg-emerald-500' : 'bg-blue-600'"
                    :style="{ width: completeness + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <p v-if="lastUpdatedAt" class="relative z-10 mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-400">
            <History :size="12" /> Terakhir diperbarui {{ formatDateTime(lastUpdatedAt) }}
          </p>
        </section>

        <!-- Info -->
        <div class="mb-5 flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <Info :size="16" class="mt-0.5 shrink-0 text-blue-600" />
          <p class="text-[12px] font-medium leading-relaxed text-blue-800">
            Setiap perubahan akan <b>diberitahukan ke Admin HR</b>. Isi sesuai dokumen resmi (KTP / buku tabungan).
          </p>
        </div>

        <!-- Sections (accordion) -->
        <form @submit.prevent="openConfirm" class="space-y-3">
          <section v-for="sec in sections" :key="sec.key" class="card overflow-hidden">
            <button type="button" class="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-slate-50"
              @click="toggle(sec.key)" :aria-expanded="openSection === sec.key">
              <div class="icon-badge h-10 w-10 rounded-xl" :class="sec.iconClass">
                <component :is="sec.icon" :size="18" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-slate-800">{{ sec.title }}</p>
                <p class="text-[11px] font-semibold"
                  :class="sectionErrors(sec.key) ? 'text-rose-500' : sectionFilled(sec.key) === sec.fields.length ? 'text-emerald-600' : 'text-slate-400'">
                  <template v-if="sectionErrors(sec.key)">Ada {{ sectionErrors(sec.key) }} isian perlu diperbaiki</template>
                  <template v-else>{{ sectionFilled(sec.key) }} dari {{ sec.fields.length }} terisi</template>
                </p>
              </div>
              <span v-if="sectionChanged(sec.key)" class="h-2 w-2 rounded-full bg-amber-500" title="Ada perubahan"></span>
              <CheckCircle2 v-if="sectionFilled(sec.key) === sec.fields.length && !sectionErrors(sec.key)" :size="18" class="text-emerald-500" />
              <ChevronDown :size="18" class="text-slate-300 transition-transform duration-200" :class="openSection === sec.key ? 'rotate-180' : ''" />
            </button>

            <div v-show="openSection === sec.key" class="space-y-4 border-t border-slate-100 px-4 pb-5 pt-4">

              <!-- ===== DATA PRIBADI ===== -->
              <template v-if="sec.key === 'pribadi'">
                <!-- Banner Scan e-KTP Otomatis -->
                <div class="rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 transition-all hover:border-blue-300">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200">
                        <Scan :size="22" />
                      </div>
                      <div>
                        <div class="flex items-center gap-1.5">
                          <p class="text-xs font-black text-slate-900">Scan e-KTP Otomatis</p>
                          <span class="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-blue-700">Auto-Fill</span>
                        </div>
                        <p class="text-[11px] font-medium text-slate-500 mt-0.5">
                          Gunakan kamera atau upload foto e-KTP agar data terisi otomatis.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="isKtpModalOpen = true"
                      class="btn-primary !w-auto shrink-0 px-3.5 py-2 text-xs shadow-none"
                    >
                      <Camera :size="14" /> Scan KTP
                    </button>
                  </div>

                  <!-- Status / Thumbnail KTP jika sudah ada -->
                  <div v-if="ktpPhotoUrl" class="mt-3 flex items-center justify-between border-t border-blue-100/80 pt-2.5 text-[11px]">
                    <div class="flex items-center gap-2">
                      <img :src="ktpPhotoUrl" alt="Foto KTP" class="h-6 w-9 rounded object-cover border border-slate-200 shadow-xs" />
                      <span class="font-bold text-slate-700">Berkas e-KTP terunggah</span>
                      <span v-if="ktpDocStatus === 'verified'" class="badge badge-success text-[9px] py-0.5">Terverifikasi</span>
                      <span v-else class="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-600">Tersimpan</span>
                    </div>
                    <button type="button" @click="isKtpModalOpen = true" class="font-bold text-blue-600 hover:underline">
                      Foto Ulang
                    </button>
                  </div>
                </div>

                <Field label="Nama Lengkap" required :error="errors.name" :changed="isChanged('name')">
                  <input v-model="form.name" type="text" autocomplete="name" placeholder="Sesuai KTP" class="input-base" />
                </Field>

                <Field label="NIK KTP" :error="errors.nik_ktp" :changed="isChanged('nik_ktp')"
                  :hint="`${(form.nik_ktp || '').length}/16 digit`">
                  <input v-model="form.nik_ktp" type="text" inputmode="numeric" maxlength="16" placeholder="16 digit angka"
                    class="input-base tracking-wider" @input="form.nik_ktp = digitsOnly(form.nik_ktp)" />
                </Field>

                <Field label="NPWP" optional :error="errors.npwp" :changed="isChanged('npwp')">
                  <input v-model="form.npwp" type="text" inputmode="numeric" maxlength="25" placeholder="Boleh dikosongkan" class="input-base" />
                </Field>

                <div class="grid grid-cols-2 gap-3">
                  <Field label="Tempat Lahir" :error="errors.tempat_lahir" :changed="isChanged('tempat_lahir')">
                    <input v-model="form.tempat_lahir" type="text" placeholder="Kota" class="input-base" />
                  </Field>
                  <Field label="Tanggal Lahir" :error="errors.tanggal_lahir" :changed="isChanged('tanggal_lahir')">
                    <input v-model="form.tanggal_lahir" type="date" :max="todayStr" class="input-base" />
                  </Field>
                </div>

                <Field label="Jenis Kelamin" :error="errors.jenis_kelamin" :changed="isChanged('jenis_kelamin')">
                  <select v-model="form.jenis_kelamin" class="input-base">
                    <option :value="null">-- Pilih Jenis Kelamin --</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </Field>

                <Field label="Status Pernikahan" :error="errors.status_pernikahan" :changed="isChanged('status_pernikahan')">
                  <select v-model="form.status_pernikahan" class="input-base">
                    <option :value="null">-- Pilih Status Pernikahan --</option>
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin (Menikah)</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </Field>

                <!-- Data Banyak Anak (muncul jika sudah menikah / Kawin) -->
                <div v-if="form.status_pernikahan === 'Kawin'" class="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 space-y-1">
                  <Field label="Banyak / Jumlah Anak" :error="errors.jumlah_anak" :changed="isChanged('jumlah_anak')"
                    hint="Ketik 0 bila belum memiliki anak">
                    <div class="relative">
                      <input
                        v-model="form.jumlah_anak"
                        type="number"
                        min="0"
                        max="25"
                        placeholder="Contoh: 2 (atau 0 jika belum ada)"
                        class="input-base pr-16"
                        @input="form.jumlah_anak = digitsOnly(form.jumlah_anak)"
                      />
                      <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        Anak
                      </span>
                    </div>
                  </Field>
                </div>

                <Field label="Agama" :error="errors.agama" :changed="isChanged('agama')">
                  <select v-model="form.agama" class="input-base">
                    <option :value="null">-- Pilih Agama --</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen (Protestan)</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </Field>
              </template>

              <!-- ===== KONTAK & ALAMAT ===== -->
              <template v-else-if="sec.key === 'kontak'">
                <Field label="Nomor Telepon / WhatsApp" :error="errors.phone_number" :changed="isChanged('phone_number')">
                  <input v-model="form.phone_number" type="tel" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx" class="input-base" />
                </Field>
                <Field label="Alamat Domisili" :error="errors.address" :changed="isChanged('address')"
                  :hint="`${(form.address || '').length}/500`">
                  <textarea v-model="form.address" rows="3" maxlength="500" placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
                    class="input-base resize-none"></textarea>
                </Field>
              </template>

              <!-- ===== REKENING ===== -->
              <template v-else-if="sec.key === 'rekening'">
                <Field label="Nama Bank" :error="errors.bank_name" :changed="isChanged('bank_name')">
                  <input v-model="form.bank_name" type="text" placeholder="Pilih atau ketik nama bank" class="input-base" />
                  <QuickPick :options="['BCA', 'BRI', 'Mandiri', 'BNI', 'BSI', 'BTN']" @pick="v => form.bank_name = v" :active="form.bank_name" />
                </Field>
                <Field label="Nomor Rekening" :error="errors.bank_account_number" :changed="isChanged('bank_account_number')">
                  <input v-model="form.bank_account_number" type="text" inputmode="numeric" maxlength="30" placeholder="Hanya angka"
                    class="input-base tracking-wider" @input="form.bank_account_number = digitsOnly(form.bank_account_number)" />
                </Field>
                <Field label="Nama Pemilik Rekening" :error="errors.bank_account_name" :changed="isChanged('bank_account_name')">
                  <input v-model="form.bank_account_name" type="text" placeholder="Sesuai buku tabungan" class="input-base" />
                  <button v-if="form.name && form.bank_account_name !== form.name" type="button"
                    class="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 active:scale-95"
                    @click="form.bank_account_name = form.name">
                    <Copy :size="12" /> Sama dengan nama saya
                  </button>
                </Field>
              </template>

              <!-- ===== KONTAK DARURAT ===== -->
              <template v-else-if="sec.key === 'darurat'">
                <Field label="Nama Kontak Darurat" :error="errors.emergency_contact_name" :changed="isChanged('emergency_contact_name')">
                  <input v-model="form.emergency_contact_name" type="text" placeholder="Nama keluarga / kerabat" class="input-base" />
                </Field>
                <Field label="Hubungan" :error="errors.emergency_contact_relationship" :changed="isChanged('emergency_contact_relationship')">
                  <input v-model="form.emergency_contact_relationship" type="text" placeholder="Pilih atau ketik" class="input-base" />
                  <QuickPick :options="['Suami', 'Istri', 'Ayah', 'Ibu', 'Saudara', 'Anak']" @pick="v => form.emergency_contact_relationship = v" :active="form.emergency_contact_relationship" />
                </Field>
                <Field label="No. Telepon Darurat" :error="errors.emergency_contact_phone" :changed="isChanged('emergency_contact_phone')">
                  <input v-model="form.emergency_contact_phone" type="tel" inputmode="tel" placeholder="08xxxxxxxxxx" class="input-base" />
                </Field>
              </template>

              <button v-if="nextSection(sec.key)" type="button" @click="openSection = nextSection(sec.key)!"
                class="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-3 text-[12px] font-bold text-slate-600 active:scale-[0.98]">
                Lanjut: {{ sections.find(s => s.key === nextSection(sec.key))?.title }} <ChevronRight :size="14" />
              </button>
            </div>
          </section>
        </form>
      </template>
    </main>

    <!-- Sticky Save Bar -->
    <div v-if="!isLoading" class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
      <div class="mx-auto flex max-w-md items-center gap-3">
        <button v-if="changedFields.length" type="button" @click="resetForm"
          class="btn-secondary !w-auto shrink-0 px-4" aria-label="Batalkan perubahan">
          <RotateCcw :size="16" />
        </button>
        <button type="button" @click="openConfirm" :disabled="!changedFields.length || isSaving" class="btn-primary flex-1">
          <div v-if="isSaving" class="spinner"></div>
          <template v-else>
            <Save :size="16" />
            {{ changedFields.length ? `Simpan ${changedFields.length} Perubahan` : 'Belum ada perubahan' }}
          </template>
        </button>
      </div>
    </div>

    <!-- Confirm Bottom Sheet -->
    <Transition name="modal">
      <div v-if="isConfirmOpen" class="modal-overlay" @click.self="isConfirmOpen = false">
        <div class="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
          <div class="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200"></div>
          <h3 class="text-base font-black text-slate-900">Periksa Perubahan</h3>
          <p class="mt-0.5 text-[12px] font-medium text-slate-500">Pastikan data berikut sudah benar sebelum disimpan.</p>

          <ul class="mt-4 max-h-[45vh] space-y-2 overflow-y-auto">
            <li v-for="f in changedFields" :key="f" class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ LABELS[f] }}</p>
              <p class="mt-1 text-[12px] font-medium text-rose-500 line-through break-words">{{ display(f, original[f]) }}</p>
              <p class="text-[13px] font-bold text-emerald-700 break-words">{{ display(f, form[f]) }}</p>
            </li>
          </ul>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button type="button" class="btn-secondary" @click="isConfirmOpen = false">Periksa Lagi</button>
            <button type="button" class="btn-primary" :disabled="isSaving" @click="handleSubmit">
              <div v-if="isSaving" class="spinner"></div>
              <template v-else><Check :size="16" /> Ya, Simpan</template>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal Scanner e-KTP (Live Kamera / Upload / OCR) -->
    <KtpScanModal
      v-if="isKtpModalOpen"
      @close="isKtpModalOpen = false"
      @applied="onKtpApplied"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, h, defineComponent, type PropType } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { useToast } from '../composables/useToast'
import { getProfile, updateProfile, updateProfilePhoto, type PersonalData } from '../api/profile'
import {
  ArrowLeft, User, Phone, CreditCard, ShieldAlert, Save, Camera, Info, History,
  ChevronDown, ChevronRight, CheckCircle2, Copy, RotateCcw, Check, AlertCircle, Scan,
} from 'lucide-vue-next'
import KtpScanModal from '../components/KtpScanModal.vue'
import type { ParsedKtpData } from '../utils/ktpScanner'

type Key = keyof PersonalData

const router = useRouter()
const { showToast } = useToast()

/* ---------- Small inline components ---------- */
const Field = defineComponent({
  props: {
    label: String, error: String, hint: String,
    required: Boolean, optional: Boolean, changed: Boolean,
  },
  setup(props, { slots }) {
    return () => h('div', [
      h('div', { class: 'flex items-center justify-between' }, [
        h('label', { class: 'label !flex items-center gap-1.5' }, [
          props.label,
          props.required ? h('span', { class: 'text-rose-500' }, '*') : null,
          props.optional ? h('span', { class: 'text-[10px] font-semibold normal-case tracking-normal text-slate-400' }, '(opsional)') : null,
          props.changed ? h('span', { class: 'rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black normal-case tracking-normal text-amber-700' }, 'diubah') : null,
        ]),
        props.hint ? h('span', { class: 'text-[10px] font-semibold text-slate-400' }, props.hint) : null,
      ]),
      h('div', { class: props.error ? '[&_.input-base]:!border-rose-300 [&_.input-base]:!bg-rose-50/50' : '' }, slots.default?.()),
      props.error
        ? h('p', { class: 'mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-500' }, [h(AlertCircle, { size: 12 }), props.error])
        : null,
    ])
  },
})

const QuickPick = defineComponent({
  props: {
    options: { type: Array as PropType<string[]>, required: true },
    active: { type: String as PropType<string | null>, default: null },
  },
  emits: ['pick'],
  setup(props, { emit }) {
    return () => h('div', { class: 'mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide' },
      props.options.map(opt => h('button', {
        type: 'button',
        class: `shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${props.active === opt
          ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`,
        onClick: () => emit('pick', opt),
      }, opt)))
  },
})

/* ---------- State ---------- */
const LABELS: Record<Key, string> = {
  name: 'Nama Lengkap',
  nik_ktp: 'NIK KTP',
  npwp: 'NPWP',
  tempat_lahir: 'Tempat Lahir',
  tanggal_lahir: 'Tanggal Lahir',
  jenis_kelamin: 'Jenis Kelamin',
  status_pernikahan: 'Status Pernikahan',
  jumlah_anak: 'Banyak Anak',
  agama: 'Agama',
  phone_number: 'No. Telepon / WA',
  address: 'Alamat Domisili',
  bank_name: 'Nama Bank',
  bank_account_number: 'No. Rekening',
  bank_account_name: 'Nama Pemilik Rekening',
  emergency_contact_name: 'Nama Kontak Darurat',
  emergency_contact_relationship: 'Hubungan',
  emergency_contact_phone: 'No. Telp Darurat',
}

const emptyForm = (): Record<Key, string | null> => Object.fromEntries(
  Object.keys(LABELS).map(k => [k, null])
) as Record<Key, string | null>

const form = ref<Record<Key, string | null>>(emptyForm())
const original = ref<Record<Key, string | null>>(emptyForm())
const errors = ref<Partial<Record<Key, string>>>({})

const isLoading = ref(true)
const isSaving = ref(false)
const isUploading = ref(false)
const isConfirmOpen = ref(false)
const isKtpModalOpen = ref(false)
const ktpPhotoUrl = ref<string | null>(null)
const ktpDocStatus = ref<string | null>(null)
const photoUrl = ref<string | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)
const lastUpdatedAt = ref<string | null>(null)
const openSection = ref<string>('pribadi')
let justSaved = false

const sections = [
  { key: 'pribadi', title: 'Data Pribadi', icon: User, iconClass: 'icon-badge-blue',
    fields: ['name', 'nik_ktp', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'status_pernikahan', 'agama'] as Key[] },
  { key: 'kontak', title: 'Kontak & Alamat', icon: Phone, iconClass: 'icon-badge-teal',
    fields: ['phone_number', 'address'] as Key[] },
  { key: 'rekening', title: 'Rekening Bank', icon: CreditCard, iconClass: 'icon-badge-amber',
    fields: ['bank_name', 'bank_account_number', 'bank_account_name'] as Key[] },
  { key: 'darurat', title: 'Kontak Darurat', icon: ShieldAlert, iconClass: 'icon-badge-rose',
    fields: ['emergency_contact_name', 'emergency_contact_relationship', 'emergency_contact_phone'] as Key[] },
]
// NPWP dan banyak anak opsional -> ikut disimpan tapi tidak menghambat persentase dasar kelengkapan
const sectionExtra: Record<string, Key[]> = { pribadi: ['npwp', 'jumlah_anak'] }

const todayStr = new Date().toISOString().slice(0, 10)

/* ---------- Computed helpers ---------- */
const norm = (v: string | null | undefined) => (v ?? '').toString().trim()
const isChanged = (k: Key) => norm(form.value[k]) !== norm(original.value[k])
const changedFields = computed(() => (Object.keys(LABELS) as Key[]).filter(isChanged))

const allTracked = sections.flatMap(s => s.fields)
const completeness = computed(() => {
  const filled = allTracked.filter(k => norm(form.value[k]) !== '').length
  return Math.round((filled / allTracked.length) * 100)
})

const sectionFilled = (key: string) =>
  sections.find(s => s.key === key)!.fields.filter(k => norm(form.value[k]) !== '').length
const sectionKeys = (key: string) => [...sections.find(s => s.key === key)!.fields, ...(sectionExtra[key] || [])]
const sectionErrors = (key: string) => sectionKeys(key).filter(k => errors.value[k]).length
const sectionChanged = (key: string) => sectionKeys(key).some(isChanged)
const nextSection = (key: string) => {
  const i = sections.findIndex(s => s.key === key)
  return sections[i + 1]?.key
}
const toggle = (key: string) => { openSection.value = openSection.value === key ? '' : key }

const inisial = computed(() =>
  (form.value.name || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?')

const digitsOnly = (v: string | null) => (v || '').replace(/\D/g, '')

const display = (k: Key, v: string | null) => {
  if (!norm(v)) return '(kosong)'
  if (k === 'tanggal_lahir') {
    const d = new Date(v as string)
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (k === 'jumlah_anak') {
    return `${v} anak`
  }
  return v
}
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/* ---------- Validation (client) ---------- */
const validate = (): boolean => {
  const e: Partial<Record<Key, string>> = {}
  const f = form.value
  if (norm(f.name).length < 3) e.name = 'Nama lengkap minimal 3 karakter.'
  if (norm(f.nik_ktp) && !/^\d{16}$/.test(norm(f.nik_ktp))) e.nik_ktp = 'NIK KTP harus 16 digit angka.'
  if (norm(f.npwp) && !/^[0-9.\-]+$/.test(norm(f.npwp))) e.npwp = 'NPWP hanya angka, titik, dan strip.'
  if (norm(f.tanggal_lahir) && norm(f.tanggal_lahir) >= todayStr) e.tanggal_lahir = 'Tanggal lahir harus sebelum hari ini.'
  const phoneRe = /^[0-9+\-\s]{9,20}$/
  if (norm(f.phone_number) && !phoneRe.test(norm(f.phone_number))) e.phone_number = 'Nomor telepon tidak valid (min. 9 digit).'
  if (norm(f.emergency_contact_phone) && !phoneRe.test(norm(f.emergency_contact_phone))) e.emergency_contact_phone = 'Nomor telepon tidak valid.'
  if (norm(f.bank_account_number) && !/^[0-9\-]+$/.test(norm(f.bank_account_number))) e.bank_account_number = 'Nomor rekening hanya angka.'
  if (f.status_pernikahan === 'Kawin' && norm(f.jumlah_anak)) {
    const anak = Number(f.jumlah_anak)
    if (isNaN(anak) || anak < 0 || anak > 30) e.jumlah_anak = 'Jumlah anak harus antara 0 - 30.'
  }
  errors.value = e

  const firstErr = Object.keys(e)[0] as Key | undefined
  if (firstErr) {
    const sec = sections.find(s => sectionKeys(s.key).includes(firstErr))
    if (sec) openSection.value = sec.key
  }
  return !firstErr
}

/* ---------- Actions ---------- */
const loadProfile = async () => {
  isLoading.value = true
  try {
    const res = await getProfile()
    const d = res.data.data
    const p = d.personal || ({} as PersonalData)
    const next = emptyForm()
    ;(Object.keys(LABELS) as Key[]).forEach(k => {
      const val = (p as any)[k]
      next[k] = val !== undefined && val !== null ? String(val) : null
    })
    next.name = p.name ?? d.name
    form.value = { ...next }
    original.value = { ...next }
    photoUrl.value = d.photo_url
    ktpPhotoUrl.value = d.foto_ktp_url || d.ktp_document?.file_url || null
    ktpDocStatus.value = d.ktp_document?.verification_status || null
    lastUpdatedAt.value = d.last_updated_at

    // Buka section pertama yang belum lengkap
    const firstIncomplete = sections.find(s => sectionFilled(s.key) < s.fields.length)
    openSection.value = firstIncomplete?.key ?? 'pribadi'
  } catch {
    showToast('Gagal memuat data profil.', 'error')
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  form.value = { ...original.value }
  errors.value = {}
}

const onKtpApplied = (payload: { parsed: ParsedKtpData; fileUrl: string; documentId: number }) => {
  isKtpModalOpen.value = false
  ktpPhotoUrl.value = payload.fileUrl

  const p = payload.parsed
  if (p.nik) form.value.nik_ktp = p.nik
  if (p.nama) form.value.name = p.nama
  if (p.tempat_lahir) form.value.tempat_lahir = p.tempat_lahir
  if (p.tanggal_lahir) form.value.tanggal_lahir = p.tanggal_lahir
  if (p.jenis_kelamin) form.value.jenis_kelamin = p.jenis_kelamin
  if (p.status_perkawinan) form.value.status_pernikahan = p.status_perkawinan
  if (p.agama) form.value.agama = p.agama
  if (p.alamat) form.value.address = p.alamat

  showToast('Form berhasil diisi otomatis dari e-KTP!', 'success')
}

const openConfirm = () => {
  if (!changedFields.value.length) return
  if (!validate()) {
    showToast('Periksa kembali isian yang ditandai merah.', 'error')
    return
  }
  isConfirmOpen.value = true
}

const handleSubmit = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const payload: Record<string, string | null> = {}
    ;(Object.keys(LABELS) as Key[]).forEach(k => { payload[k] = norm(form.value[k]) || null })
    const res = await updateProfile(payload)
    original.value = { ...form.value }
    isConfirmOpen.value = false
    justSaved = true
    showToast(res.data.message || 'Data berhasil diperbarui!', 'success')
    setTimeout(() => router.push('/profile'), 1000)
  } catch (error: any) {
    const serverErrors = error.response?.data?.errors
    if (serverErrors) {
      const mapped: Partial<Record<Key, string>> = {}
      Object.keys(serverErrors).forEach(k => { mapped[k as Key] = serverErrors[k][0] })
      errors.value = mapped
      isConfirmOpen.value = false
      const first = Object.keys(mapped)[0] as Key
      const sec = sections.find(s => sectionKeys(s.key).includes(first))
      if (sec) openSection.value = sec.key
      showToast(serverErrors[first][0], 'error')
    } else {
      showToast(error.response?.data?.message || 'Gagal memperbarui data.', 'error')
    }
  } finally {
    isSaving.value = false
  }
}

const onPhotoSelected = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 3 * 1024 * 1024) {
    showToast('Ukuran foto maksimal 3 MB.', 'error')
    return
  }
  const previous = photoUrl.value
  photoUrl.value = URL.createObjectURL(file) // preview instan
  isUploading.value = true
  try {
    const res = await updateProfilePhoto(file)
    photoUrl.value = res.data.data.photo_url
    showToast('Foto profil berhasil diperbarui!', 'success')
  } catch (error: any) {
    photoUrl.value = previous
    const errs = error.response?.data?.errors
    showToast(errs?.photo?.[0] || error.response?.data?.message || 'Gagal mengunggah foto.', 'error')
  } finally {
    isUploading.value = false
  }
}

/* ---------- Unsaved changes guard ---------- */
const beforeUnload = (e: BeforeUnloadEvent) => {
  if (changedFields.value.length && !justSaved) { e.preventDefault(); e.returnValue = '' }
}
onBeforeRouteLeave(() => {
  if (changedFields.value.length && !justSaved) {
    return window.confirm('Perubahan belum disimpan. Yakin ingin keluar?')
  }
  return true
})

onMounted(() => {
  loadProfile()
  window.addEventListener('beforeunload', beforeUnload)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
</script>
