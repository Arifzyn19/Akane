[![-----------------------------------------------------](https://camo.githubusercontent.com/eefa6fcc1945c8498582793a0ce04ca77b44a1dd795453cebce2dbc3137d9772/68747470733a2f2f74656c656772612e70682f66696c652f6535656362316137343265356137396532353935312e6a7067)](#table-of-contents)

<p align="center">
    <img src="https://raw.githubusercontent.com/Arifzyn19/Akane/main/storage/media/thumbnail.jpg" width="100%" style="margin-left: auto;margin-right: auto;display: block;">
</p>

<h1 align="center">Akane - Bot</h1>

<p align="center">
    <a href="#"><img src="https://img.shields.io/badge/Whatshapp BOT-green?colorA=%23ff0000&colorB=%23017e40&style=for-the-badge"></a>
</p>

<p align="center">
<a href="https://github.com/Arifzyn19"><img title="Author" src="https://img.shields.io/badge/AUTHOR-Arifzyn19-green.svg?style=for-the-badge&logo=github"></a>

## Konfigurasi ⚙️

Mengedit nomor owner & nama bot di [`config.js`](https://github.com/Arifzyn19/Akane/blob/main/storage/config.js)

## Untuk user windows/rdp 💻

Instal alat ini terlebih dahulu sebelum menjalankan skrip

- Download And Install Git [`Click Here`](https://git-scm.com/downloads)
- Download And Install NodeJS [`Click Here`](https://nodejs.org/en/download)
- Download And Install FFmpeg [`Click Here`](https://ffmpeg.org/download.html) (**Jangan Lupa Tambahkan FFmpeg ke variabel lingkungan PATH**)
- Download And Install ImageMagick [`Click Here`](https://imagemagick.org/script/download.php)

## Untuk user termux/ubuntu/ssh

- apt update && apt upgrade -y
- apt install nodejs imagemagick ffmpeg -y
- node -v
- jika versinya masih di bawah 17, gunakan langkah dibawah ini
- curl -s https://deb.nodesource.com/setup_19.x | sudo bash
- apt-get install -y nodejs

```bash
git clone https://github.com/ArifzynXD/Akane 
cd Akane
npm install
npm update
```

## Run ⏳

```bash
npm start / node system/index.js
```

## Contoh membuat plugin

```js
export default {
  //kosongkan saja jika ingin mematikan
  command: [""],
  description: "",
  example: "", //%p = prefix, %cmd = command, %text = teks
  name: "",
  tags: "",

  //ubah ke true jika ingin menyalakan
  admin: false,
  botAdmin: false,
  group: false,
  limit: false,
  loading: false,
  owner: false,
  premium: false,
  private: false,
  quoted: false,
  register: false,
  media: {
    audio: false,
    image: false,
    sticker: false,
    video: false,
  },

  run: async (m, { conn, text, args, isPrem, command }) => {
    //your script code
  },
};
```

## 📮 S&K

1. Tidak untuk dijual
2. Jangan lupa beri bintang pada repo ini
3. Jika Anda memiliki masalah, hubungi saya [`WhatsApp`](https://wa.me/62895347198105)

## Thanks to ✨

- [`Allah SWT`]
- [`My parents`]
- [`All Friends`]
- [`All Contributors`]
- [`All Creator Bot`]
- [`Whiskeysockets/Baileys`](https://github.com/WhiskeySockets/Baileys)
- [`Amirul Dev`](https://github.com/amiruldev20)
- [`Hisoka`](https://github.com/Hisoka-Morrou)
- [`Xiao Yan?`](https://github.com/ImYanXiao)
- [`AlisaOfc`](https://github.com/AlisaOfc)
