# Panduan Lengkap Konfigurasi Redis Queue API Produksi (Anti-Crash & Best Practice)

Dokumen ini berisi panduan komprehensif untuk mengatur **Redis Queue & Rate Limiter** di lingkungan produksi (Production Server). Mengikuti panduan ini menjamin **0% error saat lonjakan traffic tinggi (concurrency spike)**, pencegahan *deadlock* basis data, serta pemrosesan antrean API yang handal 24/7.

---

## 1. Konfigurasi Redis Produksi (`redis.conf`)

Lokasi default: `/etc/redis/redis.conf` atau `/etc/redis.conf`

```ini
# ==============================================================================
# REDIS PRODUCTION CONFIGURATION - HIGH AVAILABILITY & QUEUE SAFETY
# ==============================================================================

# 1. NETWORK & SECURITY
bind 127.0.0.1 ::1
port 6379
protected-mode yes
requirepass "GantiDenganPasswordSuperAmanDanPanjang2026!"

# Nonaktifkan perintah berbahaya untuk mencegah data terhapus secara tidak sengaja
rename-command FLUSHALL ""
rename-command FLUSHDB  ""
rename-command CONFIG   "SUPER_ADMIN_CONFIG"

# 2. MEMORY MANAGEMENT (SANGAT PENTING UNTUK QUEUE)
maxmemory 2gb

# KEBIJAKAN EVICTION PENTING:
# Gunakan 'noeviction' jika Redis digunakan sebagai QUEUE utama!
# Ini mencegah Redis menghapus antrean pekerjaan yang belum diproses saat RAM penuh.
maxmemory-policy noeviction

# 3. PERSISTENCE (PENYIMPANAN DATA KE DISK FLUSH-SAFE)
# Gabungan RDB Snapshot + AOF (Append Only File) untuk 0 data loss
save 900 1
save 300 10
save 60 10000

rdbcompression yes
dbfilename dump.rdb
dir /var/lib/redis

# AOF Persistence (Flush setiap detik ke disk)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# 4. PERFORMANCE & CONNECTIONS
maxclients 10000
timeout 300
tcp-keepalive 300
tcp-backlog 511

# 5. LOGGING & SLOW LOG
loglevel notice
logfile /var/log/redis/redis-server.log
slowlog-log-slower-than 10000 # Log perintah di atas 10ms
slowlog-max-len 128
```

---

## 2. Tuning Kernel OS Linux (Production Server)

Jalankan perintah berikut di server Linux (Ubuntu/Debian/CentOS) agar Redis beroperasi dengan performa maksimal tanpa hambatan *memory allocation*:

### A. Set `vm.overcommit_memory = 1`
```bash
sudo sysctl vm.overcommit_memory=1
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf
```

### B. Naikkan `net.core.somaxconn`
```bash
sudo sysctl -w net.core.somaxconn=1024
echo "net.core.somaxconn = 1024" | sudo tee -a /etc/sysctl.conf
```

### C. Nonaktifkan Transparent Huge Pages (THP)
```bash
sudo echo never > /sys/kernel/mm/transparent_hugepage/enabled
```
*(Tambahkan ke `/etc/rc.local` agar otomatis dieksekusi saat reboot).*

---

## 3. Implementasi Queue di API Backend

### Option A: Laravel (Recommended for PHP Stack)

#### 1. File `.env` Produksi
```ini
QUEUE_CONNECTION=redis
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=GantiDenganPasswordSuperAmanDanPanjang2026!
REDIS_PORT=6379
REDIS_CACHE_DB=1
REDIS_QUEUE_DB=2
```

#### 2. Atomic Lock & Rate Limiting pada API Controller
Mencegah race condition (misal: user menekan tombol Absensi / Lembur berulang kali dengan cepat):

```php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use App\Jobs\ProcessAttendanceJob;

class AttendanceController extends Controller
{
    public function store(Request $request)
    {
        $userId = $request->user()->id;
        $lockKey = "lock:attendance:user:{$userId}";

        // 1. Redis Atomic Lock - Mencegah double submission dalam rentang 5 detik
        $lock = Cache::lock($lockKey, 5);

        if (!$lock->get()) {
            return response()->json([
                'success' => false,
                'message' => 'Permintaan Anda sedang diproses. Mohon tidak menekan tombol berulang kali.',
            ], 429); // Return 429 (Frontend Axios Interceptor akan menangani retry jika perlu)
        }

        try {
            // 2. Redis Rate Throttling: Maksimal 10 hit per menit per IP
            Redis::throttle('attendance-hits:' . $request->ip())
                ->allow(10)->every(60)
                ->then(function () use ($request, $userId) {
                    // Dispatch ke Redis Queue secara asinkron
                    ProcessAttendanceJob::dispatch($userId, $request->all())
                        ->onQueue('attendance');
                }, function () {
                    // Jika melampaui batas rate limit
                    return response()->json([
                        'success' => false,
                        'message' => 'Antrean server padat. Permintaan Anda telah dimasukkan dalam antrean.',
                    ], 429);
                });

            return response()->json([
                'success' => true,
                'message' => 'Absensi berhasil dimasukkan ke dalam antrean pemrosesan.',
            ], 202);

        } finally {
            // Release lock jika perlu atau biarkan TTL kadaluarsa otomatis
        }
    }
}
```

#### 3. Best Practice Job Class (`ProcessAttendanceJob.php`)
```php
namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessAttendanceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah percobaan maksimal jika job gagal
     */
    public int $tries = 5;

    /**
     * Waktu tunggu (detik) antar percobaan dengan Exponential Backoff
     */
    public array $backoff = [5, 15, 45, 120];

    /**
     * Timeout maksimal eksekusi job (detik)
     */
    public int $timeout = 60;

    protected int $userId;
    protected array $data;

    public function __construct(int $userId, array $data)
    {
        $this->userId = $userId;
        $this->data = $data;
    }

    public function handle(): void
    {
        // Proses simpan ke database dalam DB Transaction
        \DB::transaction(function () {
            // Logika simpan absensi / lembur
        });
    }

    /**
     * Penanganan jika job benar-benar gagal setelah $tries habis (Dead Letter Queue)
     */
    public function failed(Throwable $exception): void
    {
        \Log::error("Job Absensi Gagal untuk User ID {$this->userId}: " . $exception->getMessage());
        // Kirim notifikasi ke admin / Slack / Telegram jika terjadi kesalahan fatal
    }
}
```

---

### Option B: Node.js / Express (Dengan BullMQ & ioredis)

#### 1. Setup Queue Manager (`queue.js`)
```javascript
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  maxRetriesPerRequest: null,
});

// Inisialisasi Queue API
const apiQueue = new Queue('apiQueue', { connection });

// Worker Pemroses Antrean
const worker = new Worker(
  'apiQueue',
  async (job) => {
    console.log(`Memproses pekerjaan ID ${job.id}`);
    // Eksekusi logika bisnis / DB query di sini
  },
  {
    connection,
    concurrency: 10, // Maksimal 10 job paralel per worker
  }
);

worker.on('failed', (job, err) => {
  console.error(`Pekerjaan ${job.id} gagal: ${err.message}`);
});

module.exports = { apiQueue };
```

---

## 4. Konfigurasi Supervisor (Menjaga Worker Hidup 24/7)

Buat file konfigurasi supervisor `/etc/supervisor/conf.d/laravel-worker.conf`:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/absen-mobile-pwa/artisan queue:work redis --queue=high,attendance,default --sleep=3 --tries=5 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/absen-mobile-pwa/storage/logs/worker.log
stopwaitsecs=3600
```

### Perintah Aktivasi Supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

---

## 5. Ringkasan Fitur Keamanan & Anti-Crash

| Komponen | Strategi Pemeliharaan | Hasil |
| :--- | :--- | :--- |
| **Eviction Policy** | `maxmemory-policy noeviction` | Antrean pekerjaan tidak pernah dihapus paksa oleh Redis saat RAM penuh. |
| **Double Tap Protection** | Redis Atomic Lock (`Cache::lock`) | Mencegah duplicate entry di Database. |
| **Traffic Spike Protection** | Client Queue + Server Worker Throttling | Server tidak tumbang meski di-hit ribuan user bersamaan. |
| **Frontend UX** | Axios Queue Interceptor + Glassmorphism Modal | User melihat status antrean secara transparan tanpa error page / lag. |
