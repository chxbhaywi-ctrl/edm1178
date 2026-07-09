# วิธีสร้าง APK — PayGate SMS Forwarder

## เปรียบเทียบตัวเลือก

| บริการ | ราคา | เวลา | ง่ายแค่ไหน |
|--------|------|------|------------|
| **EAS Build** (Expo) | ฟรี 30 builds/เดือน | ~15 นาที | ⭐⭐⭐ ง่ายสุด |
| **GitHub Actions** | ฟรี 2,000 นาที/เดือน | ~20 นาที | ⭐⭐ ต้องมี GitHub repo |
| **Codemagic** | ฟรี 500 นาที/เดือน | ~15 นาที | ⭐⭐ UI สวย มี dashboard |
| **เครื่องตัวเอง** | ฟรี | ~30 นาที (first build) | ⭐ ต้องติดตั้ง Android Studio |

---

## วิธีที่ 1 — EAS Build (แนะนำสุด)

```bash
# ติดตั้ง EAS CLI (ครั้งเดียว)
npm install -g eas-cli

# Login Expo account (สมัครฟรีที่ expo.dev)
eas login

# Build APK (อยู่ใน artifacts/sms-forwarder/)
cd artifacts/sms-forwarder
eas build --platform android --profile preview
```

- รอ ~15 นาที → ได้ URL download APK
- นำ APK ไปอัปโหลดที่ Admin → ดาวน์โหลดแอป

---

## วิธีที่ 2 — GitHub Actions

**ขั้นตอน:**
1. Push code ขึ้น GitHub
2. ไปที่ Actions tab → "Build Android APK" → Run workflow
3. รอ ~20 นาที → download APK จาก Artifacts

**หรือ auto-build เมื่อ push ไป main:**
- ไฟล์ `.github/workflows/build-apk.yml` พร้อมแล้ว
- APK จะ build อัตโนมัติทุกครั้งที่แก้ไขโค้ดใน `artifacts/sms-forwarder/`

**สร้าง Release (ให้ download link ถาวร):**
```bash
git tag v1.0.0
git push origin v1.0.0
# GitHub Actions จะ build + สร้าง Release พร้อม APK ดาวน์โหลด
```

---

## วิธีที่ 3 — Codemagic

1. ไปที่ [codemagic.io](https://codemagic.io) → สมัครฟรี
2. เชื่อม GitHub/GitLab repo
3. Codemagic จะอ่าน `codemagic.yaml` อัตโนมัติ
4. กด Start build → รอ ~15 นาที → download APK

---

## วิธีที่ 4 — เครื่องตัวเอง

```bash
# ติดตั้ง Android Studio ก่อน (จาก developer.android.com)

# Clone project แล้วไปที่ sms-forwarder
cd artifacts/sms-forwarder
pnpm install
npx expo prebuild --platform android --clean

# Build
cd android
./gradlew assembleRelease

# APK อยู่ที่:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## หลังได้ APK แล้ว

1. เปิด Admin → หน้า "ดาวน์โหลดแอป SMS Gateway"
2. อัปโหลดไฟล์ APK
3. ส่ง link `/download-app.php` ให้ลูกค้า
