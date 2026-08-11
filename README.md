# 💍 Wedding Planner

Web app wedding planner — free, host 100% kat GitHub (GitHub Pages), data pun simpan dalam repo GitHub sendiri (guna GitHub API sebagai "database", setiap kali save = 1 commit).

## Ciri-ciri

- Login admin & pengguna biasa.
- Semua tab (Checklist, Bajet, Tetamu, Vendor) ada 2 versyen: **Pengantin Lelaki** & **Pengantin Perempuan**.
- Admin boleh tambah pengguna baru & set tab mana je yang boleh dia nampak (tab permission).
- Admin boleh tambah tab custom baru (contoh: Katering, Fotografi, dll) — automatik ada versyen Lelaki/Perempuan sekali.
- Responsive — selesa guna kat laptop/PC dan telefon (sidebar jadi menu slide-in kat mobile).

---

## Setup (buat sekali je)

### 1. Push repo ni ke GitHub

Kalau folder ni belum ada remote lagi:

```bash
git add .
git commit -m "Wedding planner app"
git branch -M main
git remote add origin https://github.com/USERNAME/wedding-planner.git
git push -u origin main
```

**Cadangan:** buat repo **Private**. Sebab data (bajet, senarai tetamu, dll) akan disimpan sebagai fail JSON dalam repo ni — private lagi selamat, walaupun app boleh jalan dengan repo public jugak (semua akses tetap kena token).

### 2. Enable GitHub Pages

Repo Settings → **Pages** → Source: **Deploy from a branch** → Branch: `main` / folder `/ (root)` → Save.

Tunggu ~1 minit, site akan available di `https://USERNAME.github.io/wedding-planner/`.

### 3. Set nama repo dalam config

Buka `js/config.js`, tukar:

```js
export const GITHUB_OWNER = "USERNAME_GITHUB_ANDA";
export const GITHUB_REPO = "wedding-planner"; // ikut nama repo sebenar
```

Commit & push balik lepas edit.

### 4. Buat GitHub Personal Access Token (PAT)

Ni yang app guna untuk baca/tulis data ke repo (ganti backend server).

1. Pergi ke https://github.com/settings/tokens?type=beta (Fine-grained token)
2. **Generate new token**
3. Repository access → **Only select repositories** → pilih repo `wedding-planner` je
4. Permissions → **Contents** → set ke **Read and write**
5. Generate, **copy token tu** (bermula dengan `github_pat_...`)

⚠️ Token ni macam password — boleh tulis ke repo. Jangan share kat orang luar circle wedding korang. Boleh revoke bila-bila dari page yang sama kalau hilang kawalan.

### 5. Buka app & login kali pertama

1. Buka `https://USERNAME.github.io/wedding-planner/`
2. Skrin pertama akan mintak **GitHub Token** — paste token dari step 4. (Setiap device/browser kena buat step ni sekali je, token disimpan dalam browser tu je — tak sync automatik ke device lain.)
3. Login dengan akaun default:
   - **Username:** `admin`
   - **Password:** `wedding2026`
4. **Terus tukar password** lepas login (butang "Tukar Password" kat sidebar bawah)!

---

## Guna app

- **Checklist / Bajet / Tetamu / Vendor** — setiap tab ada toggle "🤵 Pengantin Lelaki" / "👰 Pengantin Perempuan" atas sekali. Tambah/edit/padam item ikut side masing-masing.
- **Pentadbiran** (admin je nampak):
  - **Pengguna** — tambah pengguna baru, set password, role (Admin/Pengguna Biasa), dan tick tab mana boleh dia nampak.
  - **Urus Tab** — tambah tab custom baru (contoh nak track "Fotografi" berasingan dari Vendor).
- Setiap orang perlu masukkan GitHub token sendiri (step 5.2) sebelum boleh login pada device masing-masing — admin boleh share token yang sama, atau buat token berasingan untuk setiap orang kalau nak lagi terkawal.

## Nota Keselamatan

- Ni bukan app "enterprise-grade" security — sesuai untuk group kecil/family yang dipercayai (typical use-case wedding planning).
- Password pengguna disimpan sebagai hash (SHA-256 + salt), bukan plain text — tapi kalau repo bocor + token bocor, orang masih boleh baca semua data JSON (bajet, tetamu, dll) sebab itulah "database" dia. Pastikan repo **Private** dan token tak share sesuka hati.
- Setiap "save" dalam app = 1 git commit ke repo — so ada full history perubahan data, boleh check kat tab "Commits" GitHub bila-bila.

## Struktur Fail

```
index.html          — shell app
css/style.css        — styling (tema pastel wedding)
js/config.js          — set owner/repo GitHub kat sini
js/github-api.js      — wrapper GitHub Contents API (read/write JSON)
js/store.js           — cache + load/save data
js/auth.js            — login, buat/kemaskini/padam pengguna
js/permissions.js      — check tab mana user boleh nampak
js/app.js             — bootstrap & routing utama
js/render/admin.js     — UI pentadbiran (pengguna & urus tab)
js/render/tabs/*.js    — UI setiap tab (checklist, bajet, tetamu, vendor, custom)
data/*.json            — "database" — jangan edit manual melainkan tau buat apa
```
