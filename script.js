// Daftar pecahan uang Rupiah
const denominations = [
  { value: 100000, label: "Rp 100.000", type: "Kertas" },
  { value: 50000, label: "Rp 50.000", type: "Kertas" },
  { value: 20000, label: "Rp 20.000", type: "Kertas" },
  { value: 10000, label: "Rp 10.000", type: "Kertas" },
  { value: 5000, label: "Rp 5.000", type: "Kertas" },
  { value: 2000, label: "Rp 2.000", type: "Kertas" },
  { value: 1000, label: "Rp 1.000", type: "Kertas/Keping" },
  { value: 500, label: "Rp 500", type: "Keping" },
  { value: 200, label: "Rp 200", type: "Keping" },
  { value: 100, label: "Rp 100", type: "Keping" }
];

let creditRowCounter = 0;
let skrRowCounter = 0;
let transferRowCounter = 0;
let kasbonRowCounter = 0;
let biayaRowCounter = 0;

// Format Angka ke Rupiah
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Generate Komponen Pecahan Uang (Responsive di HP)
function renderDenominations() {
  const container = document.getElementById('cashDenominationsContainer');
  if (!container) return;
  container.innerHTML = '';

  denominations.forEach((item) => {
    const div = document.createElement('div');
    div.className = "flex items-center justify-between bg-slate-900 border border-slate-700/60 rounded-xl p-2.5 sm:p-3";
    div.innerHTML = `
      <div class="w-2/5 sm:w-1/3">
        <span class="font-bold text-slate-200 block text-xs sm:text-sm">${item.label}</span>
        <span class="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-500">${item.type}</span>
      </div>
      <div class="w-1/3 px-1 sm:px-2">
        <input 
          type="number" 
          min="0" 
          placeholder="0"
          id="denom-${item.value}"
          oninput="calculateAll()"
          class="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500 transition"
        />
      </div>
      <div class="w-1/3 text-right">
        <span id="subtotal-${item.value}" class="text-xs sm:text-sm font-bold text-slate-400">Rp 0</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// 1. Tambah Baris Toko Credit
function addCreditRow(name = '', amount = '') {
  creditRowCounter++;
  const container = document.getElementById('creditRowsContainer');
  if (!container) return;
  
  const rowDiv = document.createElement('div');
  rowDiv.id = `credit-row-${creditRowCounter}`;
  rowDiv.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-3 sm:p-2.5 rounded-xl border border-slate-700/60 relative";
  rowDiv.innerHTML = `
    <input 
      type="text" 
      placeholder="Nama Toko" 
      value="${name}"
      class="w-full sm:flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
    />
    <div class="flex items-center gap-2 w-full sm:flex-1">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>
        <input 
          type="number" 
          placeholder="Nominal Credit" 
          value="${amount}"
          oninput="calculateAll()"
          class="credit-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500 transition"
        />
      </div>
      <button onclick="removeRow('credit-row-${creditRowCounter}')" class="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition" title="Hapus">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;
  container.appendChild(rowDiv);
  calculateAll();
}

// 2. Tambah Baris Toko SKR / Retur (Awal - Akhir = SKR)
function addSkrRow(name = '', tagihanAwal = '', tagihanAkhir = '') {
  skrRowCounter++;
  const container = document.getElementById('skrRowsContainer');
  if (!container) return;

  const rowDiv = document.createElement('div');
  rowDiv.id = `skr-row-${skrRowCounter}`;
  rowDiv.className = "flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-slate-900 p-3 rounded-xl border border-slate-700/60";
  
  rowDiv.innerHTML = `
    <input 
      type="text" 
      placeholder="Nama Toko" 
      value="${name}" 
      class="w-full md:w-1/4 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition" 
    />
    <div class="relative flex-1">
      <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[10px] font-bold text-slate-400">Awal: Rp</span>
      <input 
        type="number" 
        placeholder="Tagihan Awal" 
        value="${tagihanAwal}" 
        id="skr-awal-${skrRowCounter}"
        oninput="updateSkrItemCalculation(${skrRowCounter})" 
        class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-14 pr-2.5 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition" 
      />
    </div>
    <div class="relative flex-1">
      <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[10px] font-bold text-slate-400">Akhir: Rp</span>
      <input 
        type="number" 
        placeholder="Tagihan Akhir" 
        value="${tagihanAkhir}" 
        id="skr-akhir-${skrRowCounter}"
        oninput="updateSkrItemCalculation(${skrRowCounter})" 
        class="w-full bg-slate-800 border border-slate-700 rounded-lg pl-14 pr-2.5 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition" 
      />
    </div>
    <div class="relative flex-1">
      <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[10px] font-bold text-amber-400">SKR: Rp</span>
      <input 
        type="number" 
        placeholder="0" 
        readonly 
        id="skr-result-${skrRowCounter}"
        class="skr-amount-input w-full bg-slate-800/80 border border-amber-500/40 rounded-lg pl-14 pr-2.5 py-2 text-xs sm:text-sm font-black text-amber-400 focus:outline-none cursor-not-allowed" 
      />
    </div>
    <button 
      onclick="removeRow('skr-row-${skrRowCounter}')" 
      class="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition" 
      title="Hapus"
    >
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;

  container.appendChild(rowDiv);
  if (tagihanAwal || tagihanAkhir) {
    updateSkrItemCalculation(skrRowCounter);
  } else {
    calculateAll();
  }
}

function updateSkrItemCalculation(rowId) {
  const awalElem = document.getElementById(`skr-awal-${rowId}`);
  const akhirElem = document.getElementById(`skr-akhir-${rowId}`);
  const resultElem = document.getElementById(`skr-result-${rowId}`);

  if (!awalElem || !akhirElem || !resultElem) return;

  const awal = parseFloat(awalElem.value) || 0;
  const akhir = parseFloat(akhirElem.value) || 0;
  const nominalSkr = Math.max(0, awal - akhir);

  resultElem.value = nominalSkr > 0 ? nominalSkr : 0;
  calculateAll();
}

// 3. Tambah Baris Transfer Bank / Non-Tunai
function addTransferRow(name = '', bank = '', amount = '') {
  transferRowCounter++;
  const container = document.getElementById('transferRowsContainer');
  if (!container) return;

  const rowDiv = document.createElement('div');
  rowDiv.id = `transfer-row-${transferRowCounter}`;
  rowDiv.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-3 sm:p-2.5 rounded-xl border border-slate-700/60";
  rowDiv.innerHTML = `
    <input 
      type="text" 
      placeholder="Nama Toko / Pengirim" 
      value="${name}"
      class="w-full sm:w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition"
    />
    <input 
      type="text" 
      placeholder="Bank / Metode (BCA, Mandiri, dll)" 
      value="${bank}"
      class="w-full sm:w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition"
    />
    <div class="flex items-center gap-2 w-full sm:w-1/3">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>
        <input 
          type="number" 
          placeholder="Nominal Transfer" 
          value="${amount}"
          oninput="calculateAll()"
          class="transfer-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-cyan-500 transition"
        />
      </div>
      <button onclick="removeRow('transfer-row-${transferRowCounter}')" class="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition" title="Hapus">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;
  container.appendChild(rowDiv);
  calculateAll();
}

// 4. Tambah Baris Kasbon Karyawan / Driver
function addKasbonRow(name = '', note = '', amount = '') {
  kasbonRowCounter++;
  const container = document.getElementById('kasbonRowsContainer');
  if (!container) return;

  const rowDiv = document.createElement('div');
  rowDiv.id = `kasbon-row-${kasbonRowCounter}`;
  rowDiv.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-3 sm:p-2.5 rounded-xl border border-slate-700/60";
  rowDiv.innerHTML = `
    <input 
      type="text" 
      placeholder="Nama Karyawan" 
      value="${name}"
      class="w-full sm:w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
    />
    <input 
      type="text" 
      placeholder="Keterangan" 
      value="${note}"
      class="w-full sm:w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
    />
    <div class="flex items-center gap-2 w-full sm:w-1/3">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>
        <input 
          type="number" 
          placeholder="Nominal Kasbon" 
          value="${amount}"
          oninput="calculateAll()"
          class="kasbon-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500 transition"
        />
      </div>
      <button onclick="removeRow('kasbon-row-${kasbonRowCounter}')" class="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition" title="Hapus">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;
  container.appendChild(rowDiv);
  calculateAll();
}

// 5. Tambah Baris Biaya Operational (Bensin, Tol, Parkir, dll)
function addBiayaRow(description = '', amount = '') {
  biayaRowCounter++;
  const container = document.getElementById('biayaRowsContainer');
  if (!container) return;

  const rowDiv = document.createElement('div');
  rowDiv.id = `biaya-row-${biayaRowCounter}`;
  rowDiv.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-3 sm:p-2.5 rounded-xl border border-slate-700/60";
  rowDiv.innerHTML = `
    <input 
      type="text" 
      placeholder="Keterangan Biaya (Bensin, Parkir, Tol, dll)" 
      value="${description}"
      class="w-full sm:flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
    />
    <div class="flex items-center gap-2 w-full sm:flex-1">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>
        <input 
          type="number" 
          placeholder="Nominal Biaya" 
          value="${amount}"
          oninput="calculateAll()"
          class="biaya-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>
      <button onclick="removeRow('biaya-row-${biayaRowCounter}')" class="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition" title="Hapus">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;
  container.appendChild(rowDiv);
  calculateAll();
}

// Hapus Baris Elemen
function removeRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    calculateAll();
  }
}

// Kalkulasi Utama (Diperbarui dengan Transfer, Kasbon, Biaya)
function calculateAll() {
  const tagihanElem = document.getElementById('totalTagihanInput');
  const tagihanInput = tagihanElem ? (parseFloat(tagihanElem.value) || 0) : 0;

  // 1. Total Credit
  let totalCredit = 0;
  document.querySelectorAll('.credit-amount-input').forEach(input => {
    totalCredit += parseFloat(input.value) || 0;
  });

  // 2. Total SKR
  let totalSkr = 0;
  document.querySelectorAll('.skr-amount-input').forEach(input => {
    totalSkr += parseFloat(input.value) || 0;
  });

  // 3. Total Transfer
  let totalTransfer = 0;
  document.querySelectorAll('.transfer-amount-input').forEach(input => {
    totalTransfer += parseFloat(input.value) || 0;
  });

  // 4. Total Kasbon
  let totalKasbon = 0;
  document.querySelectorAll('.kasbon-amount-input').forEach(input => {
    totalKasbon += parseFloat(input.value) || 0;
  });

  // 5. Total Biaya
  let totalBiaya = 0;
  document.querySelectorAll('.biaya-amount-input').forEach(input => {
    totalBiaya += parseFloat(input.value) || 0;
  });

  // RUMUS UTAMA: Tagihan - (Credit + SKR + Transfer + Kasbon + Biaya)
  const setoranBersih = tagihanInput - totalCredit - totalSkr - totalTransfer - totalKasbon - totalBiaya;

  // Total Uang Tunai / Fisik
  let totalCash = 0;
  denominations.forEach(item => {
    const elem = document.getElementById(`denom-${item.value}`);
    const qty = elem ? (parseFloat(elem.value) || 0) : 0;
    const subtotal = qty * item.value;
    totalCash += subtotal;
    const subtotalElem = document.getElementById(`subtotal-${item.value}`);
    if (subtotalElem) subtotalElem.textContent = formatRupiah(subtotal);
  });

  // Update Tampilan Rincian Ringkasan
  const setElemText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setElemText('summaryTagihan', formatRupiah(tagihanInput));
  setElemText('summaryCredit', formatRupiah(totalCredit));
  setElemText('summarySkr', formatRupiah(totalSkr));
  setElemText('summaryTransfer', formatRupiah(totalTransfer));
  setElemText('summaryKasbon', formatRupiah(totalKasbon));
  setElemText('summaryBiaya', formatRupiah(totalBiaya));
  setElemText('summarySetoranBersih', formatRupiah(setoranBersih));
  setElemText('totalCashDisplay', formatRupiah(totalCash));

  // Status Balance Uang Fisik vs Setoran Bersih
  const statusBadge = document.getElementById('balanceStatusBadge');
  const differenceText = document.getElementById('balanceDifferenceText');

  if (!statusBadge || !differenceText) return;

  const isAllZero = tagihanInput === 0 && totalCash === 0 && totalCredit === 0 && 
                    totalSkr === 0 && totalTransfer === 0 && totalKasbon === 0 && totalBiaya === 0;

  if (isAllZero) {
    statusBadge.className = "inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-base font-bold bg-slate-700 text-slate-300";
    statusBadge.innerHTML = `<i class="fa-solid fa-circle-info"></i> Masukkan data untuk melihat status`;
    differenceText.textContent = "";
    return;
  }

  const diff = totalCash - setoranBersih;

  if (diff === 0) {
    statusBadge.className = "inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-base font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> COCOK / PAS (Balance)`;
    differenceText.textContent = "Uang fisik tunai pas dengan nilai setoran bersih.";
  } else if (diff > 0) {
    statusBadge.className = "inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-base font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30";
    statusBadge.innerHTML = `<i class="fa-solid fa-circle-plus"></i> UANG LEBIH (${formatRupiah(diff)})`;
    differenceText.textContent = `Fisik uang tunai lebih besar ${formatRupiah(diff)} dibanding setoran bersih.`;
  } else {
    statusBadge.className = "inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-base font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30";
    statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> UANG KURANG (${formatRupiah(Math.abs(diff))})`;
    differenceText.textContent = `Fisik uang tunai kurang ${formatRupiah(Math.abs(diff))} dari setoran bersih!`;
  }
}

// Reset Semua Data
function resetAll() {
  if (confirm('Apakah Anda yakin ingin mereset seluruh perhitungan?')) {
    const totalTagihanInput = document.getElementById('totalTagihanInput');
    if (totalTagihanInput) totalTagihanInput.value = '';
    
    document.getElementById('creditRowsContainer').innerHTML = '';
    document.getElementById('skrRowsContainer').innerHTML = '';
    
    const transferContainer = document.getElementById('transferRowsContainer');
    if (transferContainer) transferContainer.innerHTML = '';
    
    const kasbonContainer = document.getElementById('kasbonRowsContainer');
    if (kasbonContainer) kasbonContainer.innerHTML = '';
    
    const biayaContainer = document.getElementById('biayaRowsContainer');
    if (biayaContainer) biayaContainer.innerHTML = '';
    
    denominations.forEach(item => {
      const elem = document.getElementById(`denom-${item.value}`);
      if (elem) elem.value = '';
    });
    
    addCreditRow();
    addSkrRow();
    addTransferRow();
    addKasbonRow();
    addBiayaRow();
    calculateAll();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  renderDenominations();
  addCreditRow();
  addSkrRow();
  addTransferRow();
  addKasbonRow();
  addBiayaRow();
});
