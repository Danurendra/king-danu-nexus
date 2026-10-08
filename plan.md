# Plan Pembelajaran dan Reproducibility DINUSNEXUS

## 1. Tujuan

Dokumen ini menjelaskan cara mempelajari dan menjalankan ulang simulasi diagnosis jaringan pada proyek DINUSNEXUS. Fokus utama ada pada:

- memahami peran setiap tool diagnostik;
- mengikuti alur `investigate -> analyze -> act -> verify`;
- mendapatkan hasil yang sama pada lingkungan yang sama;
- mengetahui batasan simulasi sebelum menggantinya dengan data jaringan nyata.

## 2. Struktur yang Dipelajari

### `app/tools.py`

Modul ini menyediakan tool yang mengembalikan evidence berbentuk dictionary:

| Fungsi | Peran | Nilai simulasi penting |
| --- | --- | --- |
| `check_network()` | Mengukur kondisi umum jaringan | `packet_loss=42`, `latency=181` |
| `check_access_point()` | Memeriksa access point | `status=online` |
| `check_dhcp()` | Memeriksa layanan DHCP | `status=normal` |
| `check_authentication()` | Memeriksa autentikasi | `status=normal` |
| `check_switch()` | Memeriksa koneksi switch | `uplink=unstable` |
| `run_diagnostic()` | Mensimulasikan tindakan pemulihan | `packet_loss=1.2`, `status=improved` |

Semua nilai pada modul ini bersifat statis. Tidak ada koneksi jaringan, API, atau router telemetry yang benar-benar dipanggil.

### `app/agent.py`

Modul terbaru memperagakan agent berbasis OpenAI tool calling dengan tahapan:

1. **Investigate**: model memanggil tool diagnostik jaringan satu per satu.
2. **Analyze**: model menyusun root cause dan rekomendasi berdasarkan evidence.
3. **Human approval**: tindakan pemulihan menunggu persetujuan manusia.
4. **Act**: diagnostic dijalankan setelah tindakan disetujui.
5. **Verify**: hasil tindakan diverifikasi menggunakan data jaringan setelah perubahan.

Run terbaru menunjukkan proses berhenti pada analisis/rekomendasi karena belum ada post-change validation.

### `app/core.py`

Modul ini menyediakan alur incident lifecycle alternatif yang lebih eksplisit: membuat event, membuat incident, mengumpulkan evidence, menganalisis hypothesis, memilih action, lalu melakukan verifikasi.

## 3. Konsep Pembelajaran Utama

### Evidence-based diagnosis

Agent tidak langsung memilih tindakan. Agent mengumpulkan beberapa sumber evidence, kemudian menggunakan kombinasi evidence yang relevan untuk menentukan root cause.

### Threshold dan confidence

Pada simulasi awal, kondisi diagnosis ditentukan oleh threshold:

- packet loss jaringan harus lebih besar dari `30`;
- uplink switch harus bernilai `unstable`;
- confidence untuk `Uplink Degradation` adalah `0.91`.

Pada agent berbasis model, output terbaru menyatakan confidence sebagai `High`. Nilai ini perlu dibedakan dari confidence numerik `0.91` pada alur simulasi awal; keduanya belum berasal dari model probabilistik yang dihitung dari data historis.

### Approval, action, dan verification

Pada agent terbaru, tindakan dipisahkan dari persetujuan manusia dan verifikasi. Persetujuan diperlukan sebelum tindakan pemulihan dijalankan. Pada simulasi awal, keberhasilan tindakan ditentukan oleh packet loss sesudah diagnosis:

```text
resolved = after_packet_loss < 5
```

Pemisahan ini penting jika nantinya tindakan memiliki efek samping, membutuhkan retry, atau perlu diverifikasi melalui sumber data kedua.

## 4. Prasyarat

- Windows dengan PowerShell atau Command Prompt;
- Python 3.13 atau interpreter yang kompatibel;
- checkout/source proyek pada `E:\01 Project-DN\dinusnexus`;
- virtual environment `.venv` jika tersedia.
- Node.js dan npm untuk menjalankan aplikasi web;
- dependency web yang terpasang dari `web\package-lock.json`.

Proyek saat ini tidak memerlukan dependency eksternal untuk menjalankan modul simulasi.

Agent berbasis model memerlukan:

- `OPENAI_API_KEY` pada environment;
- package `openai`;
- akses ke model yang diset melalui `DINUSNEXUS_MODEL` atau default `gpt-5.4-nano`.

## 5. Langkah Reproduksi

### 5.1 Menjalankan agent

Buka PowerShell, lalu jalankan:

```powershell
Set-Location "E:\01 Project-DN\dinusnexus"
& ".\.venv\Scripts\python.exe" ".\app\agent.py"
```

Alternatif jika virtual environment belum tersedia:

```powershell
Set-Location "E:\01 Project-DN\dinusnexus"
python ".\app\agent.py"
```

### 5.2 Menjalankan alur core

```powershell
Set-Location "E:\01 Project-DN\dinusnexus"
& ".\.venv\Scripts\python.exe" ".\app\core.py"
```

### 5.3 Pemeriksaan langsung terhadap tools

Untuk memeriksa nilai dasar tanpa menjalankan alur agent:

```powershell
Set-Location "E:\01 Project-DN\dinusnexus"
& ".\.venv\Scripts\python.exe" -c "import sys; sys.path.insert(0, 'app'); import tools; print(tools.check_network()); print(tools.check_switch()); print(tools.run_diagnostic())"
```

### 5.4 Menjalankan halaman web Nexus Graph

Install dependency web dari lockfile sebelum menjalankan aplikasi:

```powershell
Set-Location "E:\01 Project-DN\dinusnexus\web"
npm ci
```

Jalankan development server:

```powershell
Set-Location "E:\01 Project-DN\dinusnexus\web"
npm run dev
```

Buka `http://localhost:3000/nexus`. Halaman yang dapat direproduksi harus menampilkan:

- header `Nexus Graph` dan tombol kembali;
- indikator `Network`, `Security`, dan `AI Agent`;
- graph topology dengan domain Network, Security, dan IoT;
- node `Evidence`, `AI Agent`, dan `Human Worker`;
- controls, minimap, background dots, serta panel `12 SOURCES CONNECTED`.

Validasi production build dan lint:

```powershell
Set-Location "E:\01 Project-DN\dinusnexus\web"
npm run lint
npm run build
```

`npm ci` wajib digunakan untuk reproduksi yang konsisten karena memasang versi dependency yang tercatat di `package-lock.json`. UI Nexus Graph saat ini menggunakan data hard-coded, sehingga tampilan topology dapat direproduksi tanpa `OPENAI_API_KEY` atau backend agent aktif.

## 6. Hasil yang Diharapkan

### Agent terbaru

Run agent terbaru dapat menghasilkan:

1. header `DINUSNEXUS AI AGENT`;
2. model yang digunakan, misalnya `gpt-5.4-nano`;
3. dua ronde agent;
4. pemanggilan lima tool diagnostik;
5. root cause `Unstable switch uplink`;
6. confidence kualitatif `High`;
7. rekomendasi pemeriksaan uplink, kabel/fiber/optics, link flaps, error counter, dan failover;
8. status belum terselesaikan sampai post-change validation dilakukan.

Hasil model dapat berubah pada wording, tetapi fakta evidence dan keputusan teknis harus tetap dapat ditelusuri.

### Alur simulasi awal

Output alur simulasi awal harus menunjukkan pola berikut:

1. lima evidence berhasil dikumpulkan;
2. hypothesis yang dipilih adalah `Uplink Degradation`;
3. action mengembalikan `status: improved`;
4. verifikasi menunjukkan packet loss berubah dari `42` menjadi `1.2`;
5. status akhir adalah `INCIDENT RESOLVED`.

Nilai dictionary dan urutan evidence seharusnya konsisten selama source code tidak berubah. Bagian ini tidak boleh digunakan sebagai ekspektasi output untuk agent berbasis model terbaru.

## 7. Checklist Reproducibility

- [ ] Source code berasal dari revision yang sama.
- [ ] Interpreter Python yang dipakai sudah dikonfirmasi.
- [ ] Perintah dijalankan dari root proyek.
- [ ] `app` berada pada import path saat `agent.py` dijalankan.
- [ ] Nilai simulasi pada `app/tools.py` belum diubah.
- [ ] Output dibandingkan dengan hasil yang diharapkan pada bagian 6.
- [ ] Jika menjalankan agent berbasis model, `OPENAI_API_KEY` tersedia dan model dicatat.
- [ ] Persetujuan manusia dicatat sebelum tindakan pemulihan.
- [ ] Post-change validation dijalankan sebelum status diubah menjadi resolved.
- [ ] Untuk web, dependency dipasang dengan `npm ci` dari folder `web`.
- [ ] URL `http://localhost:3000/nexus` berhasil dibuka.
- [ ] `npm run lint` dan `npm run build` berhasil tanpa error.
- [ ] Tampilan graph memuat domain, edge, controls, minimap, dan panel sumber.

Untuk pencatatan eksperimen, simpan informasi berikut:

```text
Tanggal/waktu:
Revision source:
Python version:
OS:
Perintah:
Output:
Perubahan source sebelum eksperimen:
```

## 8. Skenario Pembelajaran Lanjutan

### Menguji diagnosis tidak dikenal

Ubah sementara nilai `uplink` pada `check_switch()` dari `unstable` menjadi `stable`. Hasil `analyze()` seharusnya berubah menjadi:

```python
{"root_cause": "Unknown", "confidence": 0.2}
```

Agent kemudian tidak menjalankan diagnostic dan menghasilkan status `no_action`.

### Menguji threshold packet loss

Ubah sementara `packet_loss` pada `check_network()` menjadi `30`. Karena kondisi menggunakan operator `> 30`, nilai tepat `30` tidak memenuhi diagnosis `Uplink Degradation`.

### Menguji verifikasi

Ubah nilai `packet_loss` hasil `run_diagnostic()` menjadi `5`. Karena verifikasi menggunakan `< 5`, nilai tepat `5` dianggap belum terselesaikan.

Setelah eksperimen, kembalikan perubahan simulasi agar hasil reproduksi standar tetap konsisten.

## 9. Batasan dan Rencana Pengembangan

Simulasi ini belum merepresentasikan sistem produksi karena:

- data tool masih hard-coded;
- belum ada validasi schema untuk dictionary evidence;
- belum ada logging terstruktur atau penyimpanan incident;
- belum ada timeout, retry, atau penanganan kegagalan tool;
- confidence belum dihitung dari data nyata;
- tindakan pemulihan belum memanggil perangkat jaringan.

Urutan pengembangan yang disarankan:

1. menambahkan type hints dan schema evidence;
2. memisahkan adapter data nyata dari logika analisis;
3. menambahkan unit test untuk setiap threshold;
4. menambahkan test integrasi untuk alur agent;
5. menambahkan logging, timeout, dan error reporting;
6. mengganti simulasi dengan API/telemetry secara bertahap;
7. mempertahankan fixture statis untuk reproduksi dan regression test.

## 10. Kriteria Selesai

Pembelajaran dan reproduksi dianggap berhasil apabila:

- agent dapat dijalankan dari root proyek tanpa error import;
- root cause yang muncul adalah unstable switch uplink atau ekuivalen secara semantik;
- evidence dan rekomendasi dapat ditelusuri dari hasil tool;
- eksperimen perubahan threshold menghasilkan perilaku yang dijelaskan pada dokumen ini.

Resolusi incident baru dianggap selesai apabila tindakan sudah disetujui, packet loss dan latency diukur ulang, dan hasil post-change validation menunjukkan pemulihan. Output `INCIDENT RESOLVED` hanya boleh digunakan setelah verifikasi tersebut berhasil.

## 11. Progress Log

### 2026-10-08 — Agent tool-calling berhasil mengidentifikasi root cause

Perintah yang dijalankan dari root proyek:

```powershell
python app\agent.py
```

Konfigurasi run:

```text
Model: gpt-5.4-nano
Agent rounds: 2
Tool calls: 5
```

Tool yang berhasil dipanggil:

| Tool | Hasil |
| --- | --- |
| `check_network` | packet loss `42`, latency `181` |
| `check_access_point` | `online` |
| `check_dhcp` | `normal` |
| `check_authentication` | `normal` |
| `check_switch` | uplink `unstable` |

Analisis yang dihasilkan:

- root cause: unstable switch uplink yang menyebabkan packet loss dan latency tinggi;
- confidence: `High`;
- status: likely cause sudah diidentifikasi, tetapi belum terverifikasi sebagai resolved.

Rekomendasi agent:

1. memeriksa uplink switch, termasuk kabel/fiber/optics;
2. memeriksa switch/router perantara;
3. mengecek link flaps dan interface error counters;
4. memasang ulang atau mengganti optics/kabel jika diperlukan;
5. melakukan failover ke jalur yang sehat jika tersedia;
6. memantau packet loss dan latency setelah perubahan.

### Status progres

- [x] Tool diagnostik berhasil dipanggil.
- [x] Evidence jaringan terkumpul.
- [x] Root cause sementara berhasil diidentifikasi.
- [x] Rekomendasi remediation tersedia.
- [x] Persetujuan manusia untuk tindakan remediation.
- [x] Pemeriksaan pascaperubahan.
- [x] Verifikasi packet loss dan latency pulih.
- [x] Status incident diubah menjadi `resolved`.

### Catatan reproducibility run pertama

Run ini belum membuktikan pemulihan jaringan. Untuk menutup incident, jalankan tindakan yang disetujui, kemudian ulangi pemeriksaan `check_network` dan bandingkan packet loss/latency dengan baseline `42%` dan `181 ms`. Simpan hasil pemeriksaan pascaperubahan sebagai evidence baru sebelum menyatakan incident selesai.

### 2026-10-08 — Remediation disetujui dan berhasil diverifikasi

Run kedua dijalankan kembali dengan perintah:

```powershell
python app\agent.py
```

Perbedaan penting dari run sebelumnya:

- agent menghasilkan analisis terstruktur dengan confidence `0.78`;
- analisis internal incident menetapkan root cause `Uplink Degradation` dengan confidence `0.91`;
- human approval diberikan dengan input `y`;
- action `Run network diagnostic` dijalankan;
- verifikasi pascaperubahan berhasil;
- status akhir berubah menjadi `resolved`.

Hasil action:

```text
source: diagnostic
status: completed
packet_loss: 1.2
latency: 18
```

Hasil verification:

```text
source: network_verification
packet_loss: 1.2
latency: 18
healthy: True
```

Perbandingan terhadap baseline:

| Metric | Sebelum action | Sesudah action | Hasil |
| --- | ---: | ---: | --- |
| Packet loss | `42%` | `1.2%` | membaik |
| Latency | `181 ms` | `18 ms` | membaik |

Final state:

```text
Incident: INC-001
Status: resolved
Root cause: Uplink Degradation
```

Kesimpulan run: incident dinyatakan resolved karena tindakan telah disetujui dan hasil `verify_network()` menunjukkan `healthy=True`. Wording analisis model dapat berbeda antar-run, tetapi keputusan teknis tetap didukung oleh evidence yang sama.

## 10. Progress Web — Nexus Graph

### 2026-10-08 — Halaman topology operasional selesai dibuat

Progress pada [web/components/nexus/page.tsx](web/components/nexus/page.tsx) dan [web/components/nexus/nexus-graph.tsx](web/components/nexus/nexus-graph.tsx):

- [x] Menambahkan halaman `Nexus Graph` dengan tema visual dark dan layout responsif.
- [x] Menambahkan navigasi kembali ke halaman utama.
- [x] Menambahkan indikator status untuk `Network`, `Security`, dan `AI Agent`.
- [x] Menambahkan ringkasan konsep `Operational topology` dan deskripsi ekosistem DinusNexus.
- [x] Membuat visualisasi interaktif menggunakan `@xyflow/react`.
- [x] Memodelkan domain `Network`, `Security`, dan `IoT` beserta perangkat turunannya.
- [x] Menghubungkan sumber telemetry ke layer `Evidence`, kemudian ke `AI Agent` dan `Human Worker`.
- [x] Menambahkan status visual `healthy`, `warning`, `critical`, dan `ai` pada node.
- [x] Menambahkan background grid, controls, minimap, panel informasi, dan jumlah sumber yang terhubung.
- [x] Menambahkan ikon node menggunakan `lucide-react`.

### Status saat ini

Halaman sudah memiliki struktur visual dan topology simulasi yang dapat dirender sebagai UI. Data node, edge, status, dan label masih hard-coded untuk kebutuhan prototype; belum terhubung ke evidence dari `app/agent.py` atau telemetry jaringan nyata.

### Pekerjaan berikutnya

- [ ] Menghubungkan node dan status dengan data incident/evidence dari backend.
- [ ] Menambahkan interaksi pemilihan node untuk menampilkan detail evidence.
- [ ] Menampilkan status loading, error, dan koneksi backend secara eksplisit.
- [ ] Mengganti angka `12 SOURCES CONNECTED` dengan jumlah sumber yang berasal dari data aktual.
- [ ] Menambahkan pengujian build dan lint untuk halaman web setelah integrasi data dimulai.
