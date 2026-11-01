// stock-app.js - logika Vue untuk halaman stock.html
// Data awal diambil dari dataBahanAjar (js/dataBahanAjar.js)

var app = new Vue({
  el: '#app',

  data: {
    // data dari file dummy
    upbjjList: dataBahanAjar.upbjjList,
    kategoriList: dataBahanAjar.kategoriList,
    stok: JSON.parse(JSON.stringify(dataBahanAjar.stok)),   // salinan, supaya data asli aman

    // pilihan filter dan sort
    filterUpbjj: "",
    filterKategori: "",
    hanyaReorder: false,
    urutBerdasarkan: "judul",
    arahUrut: "asc",

    // form tambah / edit
    form: {
      kode: "", judul: "", kategori: "", upbjj: "",
      lokasiRak: "", harga: "", qty: "", safety: "", catatanHTML: ""
    },
    errors: {},
    modeEdit: false,
    kodeEdit: "",

    // info
    pesan: "",
    waktuUpdate: "-",
    namaUser: sessionStorage.getItem("namaUser")    // akun yang sedang login
  },

  // ===== COMPUTED: hasilnya disimpan (cache), hanya dihitung ulang kalau data yang dipakai berubah =====
  computed: {
    // daftar kategori yang ada di UT-Daerah yang dipilih (dependent option)
    kategoriTersedia: function () {
      var hasil = [];
      for (var i = 0; i < this.stok.length; i++) {
        var s = this.stok[i];
        if (s.upbjj == this.filterUpbjj && hasil.indexOf(s.kategori) == -1) {
          hasil.push(s.kategori);
        }
      }
      return hasil;
    },

    // jumlah stok yang perlu re-order
    jumlahReorder: function () {
      var jumlah = 0;
      for (var i = 0; i < this.stok.length; i++) {
        if (this.stok[i].qty < this.stok[i].safety || this.stok[i].qty == 0) {
          jumlah++;
        }
      }
      return jumlah;
    },

    // data yang ditampilkan di tabel = hasil filter + sort
    stokTampil: function () {
      var self = this;

      // 1. filter
      var hasil = this.stok.filter(function (item) {
        if (self.filterUpbjj != "" && item.upbjj != self.filterUpbjj) return false;
        if (self.filterKategori != "" && item.kategori != self.filterKategori) return false;
        if (self.hanyaReorder == true && !(item.qty < item.safety || item.qty == 0)) return false;
        return true;
      });

      // 2. sort
      var kunci = this.urutBerdasarkan;
      var arah = this.arahUrut;
      hasil.sort(function (a, b) {
        var nilai = 0;
        if (kunci == "judul") {
          nilai = a.judul.localeCompare(b.judul);
        } else {
          nilai = a[kunci] - b[kunci];
        }
        if (arah == "desc") nilai = -nilai;
        return nilai;
      });
      return hasil;
    }
  },

  // ===== WATCH: memantau perubahan data =====
  watch: {
    // 1. kalau UT-Daerah berubah, pilihan kategori di-reset
    filterUpbjj: function () {
      this.filterKategori = "";
    },

    // 2. kalau data stok berubah (tambah / edit), catat waktunya
    stok: {
      deep: true,
      handler: function () {
        this.waktuUpdate = new Date().toLocaleTimeString("id-ID");
      }
    },

    // 3. pesan sukses hilang sendiri setelah 3 detik
    pesan: function (nilai) {
      var self = this;
      if (nilai != "") {
        setTimeout(function () { self.pesan = ""; }, 3000);
      }
    }
  },

  // ===== METHODS =====
  methods: {
    // menentukan status stok
    statusStok: function (item) {
      if (item.qty == 0) return "kosong";
      if (item.qty < item.safety) return "menipis";
      return "aman";
    },

    formatRupiah: function (angka) {
      return "Rp " + Number(angka).toLocaleString("id-ID");
    },

    resetFilter: function () {
      this.filterUpbjj = "";
      this.filterKategori = "";
      this.hanyaReorder = false;
      this.urutBerdasarkan = "judul";
      this.arahUrut = "asc";
    },

    resetForm: function () {
      this.form = {
        kode: "", judul: "", kategori: "", upbjj: "",
        lokasiRak: "", harga: "", qty: "", safety: "", catatanHTML: ""
      };
      this.errors = {};
      this.modeEdit = false;
      this.kodeEdit = "";
    },

    // validasi sederhana tiap field, return true kalau semua benar
    validasi: function () {
      var e = {};
      var f = this.form;

      if (f.kode == "") {
        e.kode = "Kode wajib diisi";
      } else if (f.kode.length < 6) {
        e.kode = "Kode minimal 6 karakter";
      } else if (this.modeEdit == false) {
        for (var i = 0; i < this.stok.length; i++) {
          if (this.stok[i].kode == f.kode.toUpperCase()) {
            e.kode = "Kode sudah ada";
          }
        }
      }
      if (f.judul == "") e.judul = "Judul wajib diisi";
      if (f.kategori == "") e.kategori = "Pilih kategori";
      if (f.upbjj == "") e.upbjj = "Pilih UT-Daerah";
      if (f.lokasiRak == "") e.lokasiRak = "Lokasi rak wajib diisi";
      if (f.harga === "" || f.harga <= 0) e.harga = "Harga harus lebih dari 0";
      if (f.qty === "" || f.qty < 0) e.qty = "Stok tidak boleh kosong / minus";
      if (f.safety === "" || f.safety < 0) e.safety = "Safety tidak boleh kosong / minus";

      this.errors = e;
      return Object.keys(e).length == 0;
    },

    // tombol Edit: isi form dengan data baris yang dipilih
    editItem: function (item) {
      this.form = {
        kode: item.kode, judul: item.judul, kategori: item.kategori, upbjj: item.upbjj,
        lokasiRak: item.lokasiRak, harga: item.harga, qty: item.qty,
        safety: item.safety, catatanHTML: item.catatanHTML
      };
      this.errors = {};
      this.modeEdit = true;
      this.kodeEdit = item.kode;
      document.getElementById("formStok").scrollIntoView();
    },

    // tombol Tambah / Simpan Perubahan
    simpan: function () {
      if (this.validasi() == false) return;
      var f = this.form;

      if (this.modeEdit == true) {
        // cari data lama lalu ubah isinya
        for (var i = 0; i < this.stok.length; i++) {
          if (this.stok[i].kode == this.kodeEdit) {
            this.stok[i].judul = f.judul;
            this.stok[i].kategori = f.kategori;
            this.stok[i].upbjj = f.upbjj;
            this.stok[i].lokasiRak = f.lokasiRak;
            this.stok[i].harga = f.harga;
            this.stok[i].qty = f.qty;
            this.stok[i].safety = f.safety;
            this.stok[i].catatanHTML = f.catatanHTML;
          }
        }
        this.pesan = "Data " + this.kodeEdit + " berhasil diperbarui.";
      } else {
        this.stok.push({
          kode: f.kode.toUpperCase(), judul: f.judul, kategori: f.kategori, upbjj: f.upbjj,
          lokasiRak: f.lokasiRak, harga: f.harga, qty: f.qty, safety: f.safety,
          catatanHTML: f.catatanHTML
        });
        this.pesan = "Data " + f.kode.toUpperCase() + " berhasil ditambahkan.";
      }
      this.resetForm();
    }
  }
});
