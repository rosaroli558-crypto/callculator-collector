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

// Format Angka ke Rupiah
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Generate Komponen Pecahan Uang
function renderDenominations() {
  const container = document.getElementById('cashDenominationsContainer');
  if (!container) return;
  container.innerHTML = '';

  denominations.forEach((item) => {
    const div = document.createElement('div');
    div.className = "flex items-center justify-between bg-slate-900 border border-slate-700/60 rounded-xl p-3";
    div.innerHTML = `
      <div class="w-1/3">
        <span class="font-bold text-slate-200 block">${item.label}</span>
        <span class="text-[10px] uppercase font-semibold text-slate-500">${item.type}</span>
      </div>
      <div class="w-1/3 px-2">
        <input 
          type="number" 
          min="0" 
          placeholder="0"
          id="denom-${item.value}"
          oninput="calculateAll()"
          class="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-center text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500 transition"
        />
      </div>
      <div class="w-1/3 text-right">
        <span id="subtotal-${item.value}" class="text-sm font-bold text-slate-400">Rp 0</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// Tambah Baris Toko Credit
function addCreditRow(name = '', amount = '') {
  creditRowCounter++;
  const container = document.getElementById('creditRowsContainer');
  if (!container) return;
  
  const rowDiv = document.createElement('div');
  rowDiv.id = `credit-row-${creditRowCounter}`;
  rowDiv.className = "flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700/60";
  rowDiv.innerHTML = `
    <input 
      type="text" 
      placeholder="Nama Toko" 
      value="${name}"
      class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
    />
    <div class="relative flex-1">
      <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>
      <input 
        type="number" 
        placeholder="Nominal Credit" 
        value="${amount}"
        oninput="calculateAll()"
        class="credit-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500 transition"
      />
    </div>
    <button onclick="removeRow('credit-row-${creditRowCounter}')" class="p-2 text-slate-400 hover:text-rose-400 transition" title="Hapus">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;
  container.appendChild(rowDiv);
  calculateAll();
}

// Tambah Baris Toko SKR / Retur
function addSkrRow(name = '', type = 'Full', amount = '') {
  skrRowCounter++;
  const container = document.getElementById('skrRowsContainer');
  if (!container) return;

  const rowDiv = document.createElement('div');
  rowDiv.id = `skr-row-${skrRowCounter}`;
  rowDiv.className = "flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-700/60";
  rowDiv.innerHTML = `
    <input 
      type="text" 
      placeholder="Nama Toko" 
      value="${name}"
      class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
    />
    <select class="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs font-semibold text-amber-400 focus:outline-none focus:border-amber-500 transition">
      <option value="Full" ${type === 'Full' ? 'selected' : ''}>Full SKR</option>
      <option value="Partial" ${type === 'Partial' ? 'selected' : ''}>Partial SKR</option>
    </select>
    <div class="relative flex-1">
      <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>
      <input 
        type="number" 
        placeholder="Nominal Retur" 
        value="${amount}"
        oninput="calculateAll()"
        class="skr-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition"
      />
    </div>
    <button onclick="removeRow('skr-row-${skrRowCounter}')" class="p-2 text-slate-400 hover:text-rose-400 transition" title="Hapus">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;
  container.appendChild(rowDiv);
  calculateAll();
}

// Hapus Baris Elemen (Credit atau SKR)
function removeRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    calculateAll();
  }
}

// Kalkulasi Utama
function calculateAll() {
  // 1. Total Tagihan
  const tagihanInput = parseFloat(document.getElementById('totalTagihanInput').value) || 0;

  // 2. Total Toko Credit
  let totalCredit = 0;
  const creditInputs = document.querySelectorAll('.credit-amount-input');
  creditInputs.forEach(input => {
    totalCredit += parseFloat(input.value) || 0;
  });

  // 3. Total Toko SKR / Retur
  let totalSkr = 0;
  const skrInputs = document.querySelectorAll('.skr-amount-input');
  skrInputs.forEach(input => {
    totalSkr += parseFloat(input.value) || 0;
  });

  // 4. Setoran Bersih Target = Tagihan - Credit - SKR
  const setoranBersih = tagihanInput - totalCredit - totalSkr;

  // 5. Fisik Uang Tunai (Cash)
  let totalCash = 0;
  denominations.forEach(item => {
    const elem = document.getElementById(`denom-${item.value}`);
    const qty = elem ? (parseFloat(elem.value) || 0) : 0;
    const subtotal = qty * item.value;
    totalCash += subtotal;
    const subtotalElem = document.getElementById(`subtotal-${item.value}`);
    if (subtotalElem) subtotalElem.textContent = formatRupiah(subtotal);
  });

  // Update Tampilan Ringkasan Top Dashboard
  document.getElementById('summaryTagihan').textContent = formatRupiah(tagihanInput);
  document.getElementById('summaryCredit').textContent = formatRupiah(totalCredit);
  document.getElementById('summarySkr').textContent = formatRupiah(totalSkr);
  document.getElementById('summarySetoranBersih').textContent = formatRupiah(setoranBersih);
  document.getElementById('totalCashDisplay').textContent = formatRupiah(totalCash);

  // 6. Update Status Balance
  const statusBadge = document.getElementById('balanceStatusBadge');
  const differenceText = document.getElementById('balanceDifferenceText');

  if (tagihanInput === 0 && totalCash === 0 && totalCredit === 0 && totalSkr === 0) {
    statusBadge.className = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold bg-slate-700 text-slate-300";
    statusBadge.innerHTML = `<i class="fa-solid fa-circle-info"></i> Masukkan data untuk melihat status`;
    differenceText.textContent = "";
    return;
  }

  const diff = totalCash - setoranBersih;

  if (diff === 0) {
    statusBadge.className = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> COCOK / PAS (Balance)`;
    differenceText.textContent = "Uang fisik tunai pas dengan nilai setoran bersih.";
  } else if (diff > 0) {
    statusBadge.className = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30";
    statusBadge.innerHTML = `<i class="fa-solid fa-circle-plus"></i> UANG LEBIH (${formatRupiah(diff)})`;
    differenceText.textContent = `Fisik uang tunai lebih besar ${formatRupiah(diff)} dibanding setoran bersih.`;
  } else {
    statusBadge.className = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30";
    statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> UANG KURANG (${formatRupiah(Math.abs(diff))})`;
    differenceText.textContent = `Fisik uang tunai kurang ${formatRupiah(Math.abs(diff))} dari setoran bersih!`;
  }
}

// Reset Form
function resetAll() {
  if (confirm('Apakah Anda yakin ingin mereset seluruh perhitungan?')) {
    document.getElementById('totalTagihanInput').value = '';
    document.getElementById('creditRowsContainer').innerHTML = '';
    document.getElementById('skrRowsContainer').innerHTML = '';
    denominations.forEach(item => {
      const elem = document.getElementById(`denom-${item.value}`);
      if (elem) elem.value = '';
    });
    addCreditRow();
    addSkrRow();
    calculateAll();
  }
}

// Inisialisasi saat Halaman Selesai Dimuat
window.addEventListener('DOMContentLoaded', () => {
  renderDenominations();
  addCreditRow();
  addSkrRow();
});
