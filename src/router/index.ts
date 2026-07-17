import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import AttendancePage from '../pages/AttendancePage.vue'
import OvertimePage from '../pages/OvertimePage.vue'
import OvertimeFormPage from '../pages/OvertimeFormPage.vue'
import VehicleInspectionPage from '../pages/VehicleInspectionPage.vue'
import ProfilePage from '../pages/ProfilePage.vue'
import ClockInPage from '../pages/ClockInPage.vue'
import ClockOutPage from '../pages/ClockOutPage.vue'
import FeedbackPage from '../pages/FeedbackPage.vue'
import LeaveRequestPage from '../pages/LeaveRequestPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import ForgotPasswordPage from '../pages/ForgotPasswordPage.vue'
import OvertimeHistoryPage from '../pages/OvertimeHistoryPage.vue'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
    path: '/lupa-sandi',
    name: 'ForgotPassword',
    component: ForgotPasswordPage
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
    },
    {
      path: '/',
      redirect: '/absensi',
    },
    {
      path: '/absensi',
      name: 'absensi',
      component: AttendancePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/absen-masuk',
      name: 'absen-masuk',
      component: ClockInPage,
      meta: { requiresAuth: true },
    },
    {
        path: '/ketidakhadiran',
        name: 'ketidakhadiran',
        component: LeaveRequestPage,
         meta: { requiresAuth: true },
    },
    {
      path: '/absen-pulang',
      name: 'absen-pulang',
      component: ClockOutPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/history-absensi',
      name: 'history-absensi',
      component: () => import('../pages/AttendanceHistoryPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profil',
      redirect: '/profile',
    },
    {
      path: '/edit-profil',
      name: 'edit-profil',
      component: () => import('../pages/EditProfilePage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ganti-password',
      name: 'ganti-password',
      component: () => import('../pages/ChangePasswordPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tugas',
      name: 'tugas',
      component: () => import('../pages/DailyTaskPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pemeriksaan-kendaraan',
      name: 'pemeriksaan-kendaraan',
      component: () => import('../pages/VehicleInspectionPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/lembur',
      name: 'lembur',
      component: OvertimePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/lembur/form',
      name: 'lembur-form',
      component: OvertimeFormPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/riwayat-lembur',
      name: 'riwayat-lembur',
      component: OvertimeHistoryPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/inspeksi',
      name: 'inspeksi',
      component: VehicleInspectionPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/karyawan-tidak-masuk',
      name: 'karyawan-tidak-masuk',
      component: () => import('../pages/AbsentEmployeesPage.vue'),
      meta: { requiresAuth: true },
    },

    {
        path: '/feedback',
        name: 'Feedback',
        component: FeedbackPage,
        meta: { hideBottomNav: true }
    },
    {
      path: '/gudang',
      name: 'gudang',
      component: () => import('../pages/WarehousePage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/gudang/masuk',
      name: 'gudang-masuk',
      component: () => import('../pages/WarehouseInPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/gudang/keluar',
      name: 'gudang-keluar',
      component: () => import('../pages/WarehouseOutPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/gudang/masuk/edit/:id',
      name: 'gudang-masuk-edit',
      component: () => import('../pages/WarehouseInEditPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/gudang/keluar/edit/:id',
      name: 'gudang-keluar-edit',
      component: () => import('../pages/WarehouseOutEditPage.vue'),
      meta: { requiresAuth: true }
    }
    
  ],
})

router.beforeEach((to) => {
  const isLoggedIn = !!localStorage.getItem('auth_token')

  if (to.meta.requiresAuth && !isLoggedIn) {
    return { name: 'login' }
  }

  if (to.name === 'login' && isLoggedIn) {
    return { name: 'absensi' }
  }
})

export default router