// tracking-app.js - logika Vue untuk halaman tracking.html
// Data awal diambil dari dataBahanAjar (js/dataBahanAjar.js)

// fungsi bantu: tanggal hari ini dalam format yyyy-mm-dd
function hariIni() {
  var d = new Date();
  var bulan = ("0" + (d.getMonth() + 1)).slice(-2);
  var tgl = ("0" + d.getDate()).slice(-2);
  return d.getFullYear() + "-" + bulan + "-" + tgl;
}

// fungsi bantu: jam sekarang dalam format hh:mm:ss
function jamSekarang() {
  var d = new Date();
  return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
}

var app = new Vue({
  el: '#app',

  data: {
    // data dari file dummy
    pengirimanList: dataBahanAjar.pengirimanList,
    paketList: dataBahanAjar.paket,
    stok: dataBahanAjar.stok,
    tracking: JSON.parse(JSON.stringify(dataBahanAjar.tracking)),

    // pencarian
    nomorCari: "",
    nomorHasil: "",
    hasil: null,
    sudahCari: false,

    // form DO baru
    form: { nim: "", nama: sessionStorage.getItem("namaUser"), ekspedisi: "", paket: "", tanggalKirim: hariIni() },
    errors: {},
    pesan: ""
  },

  // ===== COMPUTED =====
  computed: {
    // semua nomor DO yang tersimpan
    daftarDO: function () {
      return Object.keys(this.tracking);
    },

    // nomor DO otomatis: DO + tahun berjalan + urutan, contoh DO2026-001
    nomorDOBaru: function () {
      var tahun = new Date().getFullYear();
      var awalan = "DO" + tahun + "-";
      var jumlah = 0;
      for (var nomor in this.tracking) {
        if (nomor.indexOf(awalan) == 0) {
          jumlah++;
        }
      }
      return awalan + ("00" + (jumlah + 1)).slice(-3);
    },

    // paket yang dipilih di form (null kalau belum dipilih)
    paketTerpilih: function () {
      for (var i = 0; i < this.paketList.length; i++) {
        if (this.paketList[i].kode == this.form.paket) {
          return this.paketList[i];
        }
      }
      return null;
    },

    // isi paket: kode buku + judulnya (dicari dari data stok)
    isiPaket: function () {
      var daftar = [];
      if (this.paketTerpilih == null) return daftar;
      for (var i = 0; i < this.paketTerpilih.isi.length; i++) {
        var kode = this.paketTerpilih.isi[i];
        var judul = kode;
        for (var j = 0; j < this.stok.length; j++) {
          if (this.stok[j].kode == kode) {
            judul = this.stok[j].judul;
          }
        }
        daftar.push({ kode: kode, judul: judul });
      }
      return daftar;
    },

    // total harga diambil dari harga paket
    totalHarga: function () {
      if (this.paketTerpilih == null) return 0;
      return this.paketTerpilih.harga;
    },

    // progress bar sesuai status DO
    persenProgress: function () {
      if (this.hasil == null) return 0;
      if (this.hasil.status == "Diproses") return 25;
      if (this.hasil.status == "Dalam Perjalanan") return 60;
      return 100;
    },

    // perjalanan paket dari yang terbaru
    perjalananTerbaru: function () {
      if (this.hasil == null) return [];
      return this.hasil.perjalanan.slice().reverse();
    }
  },

  // ===== WATCH =====
  watch: {
    // 1. kalau kotak pencarian dikosongkan, hasil lama disembunyikan
    nomorCari: function (nilai) {
      if (nilai == "") {
        this.sudahCari = false;
      }
    },

    // 2. kalau paket dipilih, pesan error paket dihapus
    "form.paket": function () {
      this.errors.paket = "";
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
    formatRupiah: function (angka) {
      return "Rp " + Number(angka).toLocaleString("id-ID");
    },

    // cari nama paket dari kodenya
    namaPaket: function (kode) {
      for (var i = 0; i < this.paketList.length; i++) {
        if (this.paketList[i].kode == kode) {
          return this.paketList[i].nama;
        }
      }
      return "-";
    },

    cariDO: function () {
      if (this.nomorCari == "") {
        this.sudahCari = true;
        this.nomorHasil = "";
        this.hasil = null;
        return;
      }
      var nomor = this.nomorCari.toUpperCase();
      this.nomorHasil = nomor;
      this.hasil = this.tracking[nomor] || null;
      this.sudahCari = true;
    },

    // klik nomor DO di daftar
    pilihDO: function (nomor) {
      this.nomorCari = nomor;
      this.cariDO();
    },

    isiHariIni: function () {
      this.form.tanggalKirim = hariIni();
    },

    // validasi form DO, return true kalau benar semua
    validasi: function () {
      var e = {};
      var f = this.form;

      if (f.nim == "") {
        e.nim = "NIM wajib diisi";
      } else if (isNaN(f.nim) || f.nim.length < 8) {
        e.nim = "NIM harus angka, minimal 8 digit";
      }
      if (f.nama == "") {
        e.nama = "Nama wajib diisi";
      } else if (f.nama.length < 3) {
        e.nama = "Nama minimal 3 huruf";
      }
      if (f.ekspedisi == "") e.ekspedisi = "Pilih ekspedisi";
      if (f.paket == "") e.paket = "Pilih paket bahan ajar";
      if (f.tanggalKirim == "") e.tanggalKirim = "Tanggal kirim wajib diisi";

      this.errors = e;
      return Object.keys(e).length == 0;
    },

    // simpan DO baru
    simpanDO: function () {
      if (this.validasi() == false) return;
      var f = this.form;
      var nomor = this.nomorDOBaru;

      var dataBaru = {
        nim: f.nim,
        nama: f.nama,
        status: "Diproses",
        ekspedisi: f.ekspedisi,
        tanggalKirim: f.tanggalKirim,
        paket: f.paket,
        total: this.totalHarga,
        perjalanan: [
          { waktu: f.tanggalKirim + " " + jamSekarang(), keterangan: "DO dibuat dan menunggu pengiriman" }
        ]
      };

      // $set dipakai karena menambah properti baru ke object di Vue 2
      this.$set(this.tracking, nomor, dataBaru);

      this.pesan = "DO " + nomor + " berhasil ditambahkan.";
      this.form = { nim: "", nama: sessionStorage.getItem("namaUser"), ekspedisi: "", paket: "", tanggalKirim: hariIni() };
      this.errors = {};
      this.pilihDO(nomor);     // langsung tampilkan hasil tracking-nya
    }
  }
});
