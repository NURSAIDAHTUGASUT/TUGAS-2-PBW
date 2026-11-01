// script.js - fungsi umum, login, dan greeting dashboard (dipakai semua halaman)

// script.js - fungsi umum yang dipakai di banyak halaman

// cek apakah user sudah login, kalau belum balik ke halaman login
function cekLogin() {
  if (sessionStorage.getItem("namaUser") == null) {
    window.location.href = "login.html";
  }
}

// buka dan tutup modal
function bukaModal(id) {
  document.getElementById(id).style.display = "block";
}
function tutupModal(id) {
  document.getElementById(id).style.display = "none";
}

// popup pesan (pengganti alert bawaan browser)
function tampilPesan(judul, isi, warna) {
  document.getElementById("popupJudul").innerHTML = judul;
  document.getElementById("popupJudul").style.color = warna;
  document.getElementById("popupIsi").innerHTML = isi;
  bukaModal("popup");
}

// logout
function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}

// menu yang belum ada halamannya
function menuBelum(nama) {
  tampilPesan("Informasi", "Menu " + nama + " belum tersedia.", "#0d3b7a");
}

// kalau klik area gelap di luar kotak, modal ditutup
window.onclick = function (event) {
  if (event.target.className == "modal") {
    event.target.style.display = "none";
  }
}


// ================= LOGIN (dipakai di login.html) =================
function prosesLogin() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  // cek kosong
  if (email == "" || password == "") {
    tampilPesan("Login Gagal", "Email dan password harus diisi!", "red");
    return false;
  }

  // cari di dataPengguna (data.js)
  var ketemu = false;
  for (var i = 0; i < dataPengguna.length; i++) {
    if (dataPengguna[i].email == email && dataPengguna[i].password == password) {
      sessionStorage.setItem("namaUser", dataPengguna[i].nama);
      sessionStorage.setItem("roleUser", dataPengguna[i].role);
      sessionStorage.setItem("lokasiUser", dataPengguna[i].lokasi);
      ketemu = true;
    }
  }

  if (ketemu == true) {
    window.location.href = "dashboard.html";
  } else {
    tampilPesan("Login Gagal", "email/password yang anda masukkan salah", "red");
  }
  return false;   // supaya form tidak refresh halaman
}

// modal lupa password
function kirimLupa() {
  var email = document.getElementById("emailLupa").value;

  if (email.includes("@") == false) {
    tampilPesan("Gagal", "Format email tidak benar!", "red");
    return false;
  }

  var ada = false;
  for (var i = 0; i < dataPengguna.length; i++) {
    if (dataPengguna[i].email == email) {
      ada = true;
    }
  }

  if (ada == true) {
    tutupModal("modalLupa");
    tampilPesan("Berhasil", "Link reset password sudah dikirim ke " + email, "green");
    document.getElementById("emailLupa").value = "";
  } else {
    tampilPesan("Gagal", "Email tidak terdaftar!", "red");
  }
  return false;
}

// modal daftar
function daftarAkun() {
  var nama = document.getElementById("regNama").value;
  var email = document.getElementById("regEmail").value;
  var pass = document.getElementById("regPass").value;
  var pass2 = document.getElementById("regPass2").value;

  if (nama == "" || email == "" || pass == "") {
    tampilPesan("Gagal", "Semua kolom harus diisi!", "red");
    return false;
  }
  if (email.includes("@") == false) {
    tampilPesan("Gagal", "Format email tidak benar!", "red");
    return false;
  }
  if (pass.length < 6) {
    tampilPesan("Gagal", "Password minimal 6 karakter!", "red");
    return false;
  }
  if (pass != pass2) {
    tampilPesan("Gagal", "Password dan ulangi password tidak sama!", "red");
    return false;
  }
  for (var i = 0; i < dataPengguna.length; i++) {
    if (dataPengguna[i].email == email) {
      tampilPesan("Gagal", "Email sudah terdaftar!", "red");
      return false;
    }
  }

  // tambah ke data pengguna
  dataPengguna.push({
    id: dataPengguna.length + 1,
    nama: nama,
    email: email,
    password: pass,
    role: "UPBJJ-UT",
    lokasi: "-"
  });

  tutupModal("modalDaftar");
  tampilPesan("Berhasil", "Pendaftaran berhasil, silakan login.", "green");
  document.getElementById("formDaftar").reset();
  return false;
}


// ================= GREETING (dipakai di dashboard.html) =================
function tampilkanGreeting() {
  // ambil jam sekarang
  var tanggal = new Date();
  var jam = tanggal.getHours();

  var sapaan = "";
  if (jam < 11) {
    sapaan = "Selamat pagi";
  } else if (jam < 15) {
    sapaan = "Selamat siang";
  } else if (jam < 18) {
    sapaan = "Selamat sore";
  } else {
    sapaan = "Selamat malam";
  }

  var nama = sessionStorage.getItem("namaUser");
  document.getElementById("greeting").innerHTML = sapaan + ", " + nama + "!";
  document.getElementById("infoUser").innerHTML =
    sessionStorage.getItem("roleUser") + " - " + sessionStorage.getItem("lokasiUser");
}

// hanya jalan kalau halamannya punya elemen greeting
if (document.getElementById("greeting") != null) {
  tampilkanGreeting();
}
