const STORAGE_KEY = 'kalkulator_setoran_collector_v1';

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

const SMALL_DENOMS = [20000, 10000, 5000, 2000, 1000, 500, 200, 100];

let creditRowCounter = 0;
let skrRowCounter = 0;
let transferRowCounter = 0;
let kasbonRowCounter = 0;
let biayaRowCounter = 0;
let smallCashStoreCounter = 0;
let saveFeedbackTimeout = null;

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

function getNonNegativeInt(inputOrId) {
  const el = typeof inputOrId === 'string' ? document.getElementById(inputOrId) : inputOrId;
  if (!el) return 0;
  const val = parseInt(el.value, 10);
  return Number.isNaN(val) || val < 0 ? 0 : val;
}

function updateSaveIndicator(message, isManual = false) {
  const el = document.getElementById('saveStatusText');
  if (!el) return;

  el.innerHTML = `<i class="fa-solid ${isManual ? 'fa-check-double' : 'fa-cloud-check'}"></i> ${message}`;
  el.className = isManual
    ? "text-[11px] text-emerald-300 font-semibold mt-1.5 flex items-center justify-center md:justify-start gap-1.5"
    : "text-[11px] text-emerald-400/90 mt-1.5 flex items-center justify-center md:justify-start gap-1.5";

  if (isManual) {
    clearTimeout(saveFeedbackTimeout);
    saveFeedbackTimeout = setTimeout(() => {
      updateSaveIndicator('Auto-save aktif', false);
    }, 2500);
  }
}

function collectSmallCashStoresData() {
  const stores = [];
  document.querySelectorAll('.small-store-row').forEach((row) => {
    const name = row.querySelector('.small-store-name')?.value ?? '';
    const counts = {};
    row.querySelectorAll('.small-store-denom').forEach((inp) => {
      const denom = Number(inp.dataset.denom);
      counts[denom] = inp.value;
    });
    stores.push({ name, counts });
  });
  return stores;
}

function collectState() {
  const tagihanEl = document.getElementById('totalTagihanInput');

  const credits = [];
  document.querySelectorAll('#creditRowsContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input');
    credits.push({
      name: inputs[0]?.value ?? '',
      amount: inputs[1]?.value ?? ''
    });
  });

  const skrs = [];
  document.querySelectorAll('#skrRowsContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input');
    skrs.push({
      name: inputs[0]?.value ?? '',
      awal: inputs[1]?.value ?? '',
      akhir: inputs[2]?.value ?? ''
    });
  });

  const transfers = [];
  document.querySelectorAll('#transferRowsContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input');
    transfers.push({
      name: inputs[0]?.value ?? '',
      bank: inputs[1]?.value ?? '',
      amount: inputs[2]?.value ?? ''
    });
  });

  const kasbons = [];
  document.querySelectorAll('#kasbonRowsContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input');
    kasbons.push({
      name: inputs[0]?.value ?? '',
      note: inputs[1]?.value ?? '',
      amount: inputs[2]?.value ?? ''
    });
  });

  const biayas = [];
  document.querySelectorAll('#biayaRowsContainer > div').forEach(row => {
    const inputs = row.querySelectorAll('input');
    biayas.push({
      description: inputs[0]?.value ?? '',
      amount: inputs[1]?.value ?? ''
    });
  });

  const cash = {};
  denominations.forEach(item => {
    const el = document.getElementById(`denom-${item.value}`);
    cash[item.value] = el ? el.value : '';
  });

  return {
    savedAt: new Date().toISOString(),
    totalTagihan: tagihanEl ? tagihanEl.value : '',
    credits,
    skrs,
    transfers,
    kasbons,
    biayas,
    smallCashStores: collectSmallCashStoresData(),
    cash
  };
}

function saveState(showManualFeedback = false) {
  try {
    const data = collectState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateSaveIndicator(
      showManualFeedback ? `Tersimpan manual (${timeStr})` : `Auto-save tersimpan (${timeStr})`,
      showManualFeedback
    );
  } catch (err) {
    console.warn('Gagal menyimpan ke localStorage:', err);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return false;

    const tagihanEl = document.getElementById('totalTagihanInput');
    if (tagihanEl) tagihanEl.value = data.totalTagihan ?? '';

    ['creditRowsContainer', 'skrRowsContainer', 'transferRowsContainer', 'kasbonRowsContainer', 'biayaRowsContainer', 'smallCashStoresContainer']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });

    creditRowCounter = 0;
    skrRowCounter = 0;
    transferRowCounter = 0;
    kasbonRowCounter = 0;
    biayaRowCounter = 0;
    smallCashStoreCounter = 0;

    if (Array.isArray(data.credits) && data.credits.length > 0) {
      data.credits.forEach(item => addCreditRow(item.name ?? '', item.amount ?? '', false, false));
    } else {
      addCreditRow('', '', false, false);
    }

    if (Array.isArray(data.skrs) && data.skrs.length > 0) {
      data.skrs.forEach(item => addSkrRow(item.name ?? '', item.awal ?? '', item.akhir ?? '', false, false));
    } else {
      addSkrRow('', '', '', false, false);
    }

    if (Array.isArray(data.transfers) && data.transfers.length > 0) {
      data.transfers.forEach(item => addTransferRow(item.name ?? '', item.bank ?? '', item.amount ?? '', false, false));
    } else {
      addTransferRow('', '', '', false, false);
    }

    if (Array.isArray(data.kasbons) && data.kasbons.length > 0) {
      data.kasbons.forEach(item => addKasbonRow(item.name ?? '', item.note ?? '', item.amount ?? '', false, false));
    } else {
      addKasbonRow('', '', '', false, false);
    }

    if (Array.isArray(data.biayas) && data.biayas.length > 0) {
      data.biayas.forEach(item => addBiayaRow(item.description ?? '', item.amount ?? '', false, false));
    } else {
      addBiayaRow('', '', false, false);
    }

    const hasSmallCashStores = Array.isArray(data.smallCashStores) && data.smallCashStores.length > 0;
    if (hasSmallCashStores) {
      data.smallCashStores.forEach(st => addSmallCashStoreRow(st.name ?? '', st.counts ?? {}, false, false));
    } else {
      addSmallCashStoreRow('', {}, false, false);
    }

    denominations.forEach(item => {
      const el = document.getElementById(`denom-${item.value}`);
      if (el) {
        el.value = data.cash && data.cash[item.value] !== undefined ? data.cash[item.value] : '';
      }
    });

    if (hasSmallCashStores) {
      applySmallCashStoresToDenominations(false, false);
    }

    if (data.savedAt) {
      const timeStr = new Date(data.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      updateSaveIndicator(`Data dipulihkan (tersimpan ${timeStr})`, false);
    }

    return true;
  } catch (err) {
    console.warn('Gagal memuat data dari localStorage:', err);
    return false;
  }
}

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
          step="1"
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

function createDeleteButton(rowId, onDeleteCallback = null) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = "p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition";
  btn.title = "Hapus";
  btn.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
  btn.addEventListener('click', () => {
    removeRow(rowId);
    if (typeof onDeleteCallback === 'function') onDeleteCallback();
  });
  return btn;
}

function addSmallCashStoreRow(storeName = '', counts = {}, shouldApply = true, shouldSave = true) {
  smallCashStoreCounter++;
  const id = smallCashStoreCounter;
  const container = document.getElementById('smallCashStoresContainer');
  if (!container) return;

  const rowId = `small-store-row-${id}`;
  const row = document.createElement('div');
  row.id = rowId;
  row.className = 'small-store-row bg-slate-900 border border-slate-700/70 rounded-xl p-3 space-y-2.5';

  const topBar = document.createElement('div');
  topBar.className = 'flex items-center justify-between gap-2';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = `Nama Toko #${id}`;
  nameInput.value = storeName;
  nameInput.className = 'small-store-name flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500';
  nameInput.addEventListener('input', () => {
    if (shouldSave) saveState(false);
  });

  const subtotalEl = document.createElement('span');
  subtotalEl.className = 'small-store-subtotal text-xs sm:text-sm font-black text-amber-400 whitespace-nowrap';
  subtotalEl.textContent = 'Rp 0';

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition';
  delBtn.title = 'Hapus Toko';
  delBtn.innerHTML = '<i class="fa-solid fa-trash-can text-xs"></i>';
  delBtn.addEventListener('click', () => {
    row.remove();
    applySmallCashStoresToDenominations(true, true);
  });

  topBar.appendChild(nameInput);
  topBar.appendChild(subtotalEl);
  topBar.appendChild(delBtn);
  row.appendChild(topBar);

  const denomGrid = document.createElement('div');
  denomGrid.className = 'grid grid-cols-2 sm:grid-cols-4 gap-2';

  SMALL_DENOMS.forEach((denom) => {
    const cell = document.createElement('div');
    cell.className = 'bg-slate-800/70 border border-slate-700/50 rounded-lg p-2';

    const lbl = document.createElement('label');
    lbl.className = 'block text-[10px] font-bold text-slate-400 mb-1';
    lbl.textContent = formatRupiah(denom);

    const inp = document.createElement('input');
    inp.type = 'number';
    inp.min = '0';
    inp.step = '1';
    inp.placeholder = '0';
    inp.dataset.denom = denom;
    inp.value = counts[denom] ?? '';
    inp.className = 'small-store-denom w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-500';
    inp.addEventListener('input', () => applySmallCashStoresToDenominations(true, true));

    cell.appendChild(lbl);
    cell.appendChild(inp);
    denomGrid.appendChild(cell);
  });

  row.appendChild(denomGrid);
  container.appendChild(row);

  if (shouldApply) {
    applySmallCashStoresToDenominations(true, shouldSave);
  } else if (shouldSave) {
    saveState(false);
  }
}

function applySmallCashStoresToDenominations(shouldCalc = true, shouldSave = true) {
  let grandSmallTotal = 0;
  const totalsByDenom = {};
  SMALL_DENOMS.forEach((d) => {
    totalsByDenom[d] = 0;
  });

  document.querySelectorAll('.small-store-row').forEach((row) => {
    let rowTotal = 0;
    row.querySelectorAll('.small-store-denom').forEach((inp) => {
      const denom = Number(inp.dataset.denom);
      const qty = getNonNegativeInt(inp);
      totalsByDenom[denom] += qty;
      rowTotal += qty * denom;
    });
    grandSmallTotal += rowTotal;
    const subEl = row.querySelector('.small-store-subtotal');
    if (subEl) subEl.textContent = formatRupiah(rowTotal);
  });

  const badgeEl = document.getElementById('smallCashStoreTotalText');
  if (badgeEl) badgeEl.textContent = formatRupiah(grandSmallTotal);

  SMALL_DENOMS.forEach((denom) => {
    const targetInput = document.getElementById(`denom-${denom}`);
    if (targetInput) {
      const sumQty = totalsByDenom[denom] || 0;
      targetInput.value = sumQty > 0 ? String(sumQty) : '';
    }
  });

  if (shouldCalc) {
    calculateAll(shouldSave);
  } else if (shouldSave) {
    saveState(false);
  }
}

function addCreditRow(name = '', amount = '', shouldCalculate = true, shouldSave = true) {
  creditRowCounter++;
  const container = document.getElementById('creditRowsContainer');
  if (!container) return;

  const rowId = `credit-row-${creditRowCounter}`;
  const rowDiv = document.createElement('div');
  rowDiv.id = rowId;
  rowDiv.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-3 sm:p-2.5 rounded-xl border border-slate-700/60";

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Nama Toko';
  nameInput.value = name;
  nameInput.className = "w-full sm:flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition";
  nameInput.addEventListener('input', () => saveState(false));

  const rightGroup = document.createElement('div');
  rightGroup.className = "flex items-center gap-2 w-full sm:flex-1";

  const amountWrapper = document.createElement('div');
  amountWrapper.className = "relative flex-1";
  amountWrapper.innerHTML = `<span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>`;

  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.min = '0';
  amountInput.step = '1';
  amountInput.placeholder = 'Nominal Credit';
  amountInput.value = amount;
  amountInput.className = "credit-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500 transition";
  amountInput.addEventListener('input', () => calculateAll(true));

  amountWrapper.appendChild(amountInput);
  rightGroup.appendChild(amountWrapper);
  rightGroup.appendChild(createDeleteButton(rowId));

  rowDiv.appendChild(nameInput);
  rowDiv.appendChild(rightGroup);
  container.appendChild(rowDiv);

  if (shouldCalculate) calculateAll(shouldSave);
  else if (shouldSave) saveState(false);
}

function addSkrRow(name = '', tagihanAwal = '', tagihanAkhir = '', shouldCalculate = true, shouldSave = true) {
  skrRowCounter++;
  const container = document.getElementById('skrRowsContainer');
  if (!container) return;

  const id = skrRowCounter;
  const rowId = `skr-row-${id}`;
  const rowDiv = document.createElement('div');
  rowDiv.id = rowId;
  rowDiv.className = "flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-slate-900 p-3 rounded-xl border border-slate-700/60";

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Nama Toko';
  nameInput.value = name;
  nameInput.className = "w-full md:w-1/4 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition";
  nameInput.addEventListener('input', () => saveState(false));

  const awalWrap = document.createElement('div');
  awalWrap.className = "relative flex-1";
  awalWrap.innerHTML = `<span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[10px] font-bold text-slate-400">Awal: Rp</span>`;
  const awalInput = document.createElement('input');
  awalInput.type = 'number';
  awalInput.min = '0';
  awalInput.step = '1';
  awalInput.placeholder = 'Tagihan Awal';
  awalInput.value = tagihanAwal;
  awalInput.id = `skr-awal-${id}`;
  awalInput.className = "w-full bg-slate-800 border border-slate-700 rounded-lg pl-14 pr-2.5 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition";
  awalInput.addEventListener('input', () => updateSkrItemCalculation(id, true, true));
  awalWrap.appendChild(awalInput);

  const akhirWrap = document.createElement('div');
  akhirWrap.className = "relative flex-1";
  akhirWrap.innerHTML = `<span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[10px] font-bold text-slate-400">Akhir: Rp</span>`;
  const akhirInput = document.createElement('input');
  akhirInput.type = 'number';
  akhirInput.min = '0';
  akhirInput.step = '1';
  akhirInput.placeholder = 'Tagihan Akhir';
  akhirInput.value = tagihanAkhir;
  akhirInput.id = `skr-akhir-${id}`;
  akhirInput.className = "w-full bg-slate-800 border border-slate-700 rounded-lg pl-14 pr-2.5 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500 transition";
  akhirInput.addEventListener('input', () => updateSkrItemCalculation(id, true, true));
  akhirWrap.appendChild(akhirInput);

  const resWrap = document.createElement('div');
  resWrap.className = "relative flex-1";
  resWrap.innerHTML = `<span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[10px] font-bold text-amber-400">SKR: Rp</span>`;
  const resInput = document.createElement('input');
  resInput.type = 'number';
  resInput.readOnly = true;
  resInput.placeholder = '0';
  resInput.id = `skr-result-${id}`;
  resInput.className = "skr-amount-input w-full bg-slate-800/80 border border-amber-500/40 rounded-lg pl-14 pr-2.5 py-2 text-xs sm:text-sm font-black text-amber-400 focus:outline-none cursor-not-allowed";
  resWrap.appendChild(resInput);

  rowDiv.appendChild(nameInput);
  rowDiv.appendChild(awalWrap);
  rowDiv.appendChild(akhirWrap);
  rowDiv.appendChild(resWrap);
  rowDiv.appendChild(createDeleteButton(rowId));
  container.appendChild(rowDiv);

  if (tagihanAwal !== '' || tagihanAkhir !== '') {
    updateSkrItemCalculation(id, shouldCalculate, shouldSave);
  } else if (shouldCalculate) {
    calculateAll(shouldSave);
  } else if (shouldSave) {
    saveState(false);
  }
}

function updateSkrItemCalculation(rowId, shouldCalculate = true, shouldSave = true) {
  const resultElem = document.getElementById(`skr-result-${rowId}`);
  if (!resultElem) return;

  const awal = getNonNegativeInt(`skr-awal-${rowId}`);
  const akhir = getNonNegativeInt(`skr-akhir-${rowId}`);
  resultElem.value = Math.max(0, awal - akhir);

  if (shouldCalculate) calculateAll(shouldSave);
  else if (shouldSave) saveState(false);
}

function addTransferRow(name = '', bank = '', amount = '', shouldCalculate = true, shouldSave = true) {
  transferRowCounter++;
  const container = document.getElementById('transferRowsContainer');
  if (!container) return;

  const rowId = `transfer-row-${transferRowCounter}`;
  const rowDiv = document.createElement('div');
  rowDiv.id = rowId;
  rowDiv.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-3 sm:p-2.5 rounded-xl border border-slate-700/60";

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Nama Toko / Pengirim';
  nameInput.value = name;
  nameInput.className = "w-full sm:w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition";
  nameInput.addEventListener('input', () => saveState(false));

  const bankInput = document.createElement('input');
  bankInput.type = 'text';
  bankInput.placeholder = 'Bank / Metode (BCA, Mandiri, dll)';
  bankInput.value = bank;
  bankInput.className = "w-full sm:w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition";
  bankInput.addEventListener('input', () => saveState(false));

  const rightGroup = document.createElement('div');
  rightGroup.className = "flex items-center gap-2 w-full sm:w-1/3";

  const amountWrap = document.createElement('div');
  amountWrap.className = "relative flex-1";
  amountWrap.innerHTML = `<span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>`;

  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.min = '0';
  amountInput.step = '1';
  amountInput.placeholder = 'Nominal Transfer';
  amountInput.value = amount;
  amountInput.className = "transfer-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-cyan-500 transition";
  amountInput.addEventListener('input', () => calculateAll(true));

  amountWrap.appendChild(amountInput);
  rightGroup.appendChild(amountWrap);
  rightGroup.appendChild(createDeleteButton(rowId));

  rowDiv.appendChild(nameInput);
  rowDiv.appendChild(bankInput);
  rowDiv.appendChild(rightGroup);
  container.appendChild(rowDiv);

  if (shouldCalculate) calculateAll(shouldSave);
  else if (shouldSave) saveState(false);
}

function addKasbonRow(name = '', note = '', amount = '', shouldCalculate = true, shouldSave = true) {
  kasbonRowCounter++;
  const container = document.getElementById('kasbonRowsContainer');
  if (!container) return;

  const rowId = `kasbon-row-${kasbonRowCounter}`;
  const rowDiv = document.createElement('div');
  rowDiv.id = rowId;
  rowDiv.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-3 sm:p-2.5 rounded-xl border border-slate-700/60";

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Nama Karyawan';
  nameInput.value = name;
  nameInput.className = "w-full sm:w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition";
  nameInput.addEventListener('input', () => saveState(false));

  const noteInput = document.createElement('input');
  noteInput.type = 'text';
  noteInput.placeholder = 'Keterangan';
  noteInput.value = note;
  noteInput.className = "w-full sm:w-1/3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition";
  noteInput.addEventListener('input', () => saveState(false));

  const rightGroup = document.createElement('div');
  rightGroup.className = "flex items-center gap-2 w-full sm:w-1/3";

  const amountWrap = document.createElement('div');
  amountWrap.className = "relative flex-1";
  amountWrap.innerHTML = `<span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>`;

  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.min = '0';
  amountInput.step = '1';
  amountInput.placeholder = 'Nominal Kasbon';
  amountInput.value = amount;
  amountInput.className = "kasbon-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-purple-500 transition";
  amountInput.addEventListener('input', () => calculateAll(true));

  amountWrap.appendChild(amountInput);
  rightGroup.appendChild(amountWrap);
  rightGroup.appendChild(createDeleteButton(rowId));

  rowDiv.appendChild(nameInput);
  rowDiv.appendChild(noteInput);
  rowDiv.appendChild(rightGroup);
  container.appendChild(rowDiv);

  if (shouldCalculate) calculateAll(shouldSave);
  else if (shouldSave) saveState(false);
}

function addBiayaRow(description = '', amount = '', shouldCalculate = true, shouldSave = true) {
  biayaRowCounter++;
  const container = document.getElementById('biayaRowsContainer');
  if (!container) return;

  const rowId = `biaya-row-${biayaRowCounter}`;
  const rowDiv = document.createElement('div');
  rowDiv.id = rowId;
  rowDiv.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-900 p-3 sm:p-2.5 rounded-xl border border-slate-700/60";

  const descInput = document.createElement('input');
  descInput.type = 'text';
  descInput.placeholder = 'Keterangan Biaya (Bensin, Parkir, Tol, dll)';
  descInput.value = description;
  descInput.className = "w-full sm:flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition";
  descInput.addEventListener('input', () => saveState(false));

  const rightGroup = document.createElement('div');
  rightGroup.className = "flex items-center gap-2 w-full sm:flex-1";

  const amountWrap = document.createElement('div');
  amountWrap.className = "relative flex-1";
  amountWrap.innerHTML = `<span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">Rp</span>`;

  const amountInput = document.createElement('input');
  amountInput.type = 'number';
  amountInput.min = '0';
  amountInput.step = '1';
  amountInput.placeholder = 'Nominal Biaya';
  amountInput.value = amount;
  amountInput.className = "biaya-amount-input w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500 transition";
  amountInput.addEventListener('input', () => calculateAll(true));

  amountWrap.appendChild(amountInput);
  rightGroup.appendChild(amountWrap);
  rightGroup.appendChild(createDeleteButton(rowId));

  rowDiv.appendChild(descInput);
  rowDiv.appendChild(rightGroup);
  container.appendChild(rowDiv);

  if (shouldCalculate) calculateAll(shouldSave);
  else if (shouldSave) saveState(false);
}

function removeRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    calculateAll(true);
  }
}

function sumInputsByClass(className) {
  let total = 0;
  document.querySelectorAll(`.${className}`).forEach(input => {
    total += getNonNegativeInt(input);
  });
  return total;
}

function calculateAll(shouldSave = true) {
  const tagihanInput = getNonNegativeInt('totalTagihanInput');
  const totalCredit = sumInputsByClass('credit-amount-input');
  const totalSkr = sumInputsByClass('skr-amount-input');
  const totalTransfer = sumInputsByClass('transfer-amount-input');
  const totalKasbon = sumInputsByClass('kasbon-amount-input');
  const totalBiaya = sumInputsByClass('biaya-amount-input');

  const selisihKasbonBiaya = totalKasbon - totalBiaya;
  const bebanBiayaKeCash = selisihKasbonBiaya < 0 ? Math.abs(selisihKasbonBiaya) : 0;

  const setoranBersih = tagihanInput - totalCredit - totalSkr - totalTransfer - bebanBiayaKeCash;
  const setoranPlusTransfer = setoranBersih + totalTransfer;

  let totalCash = 0;
  denominations.forEach(item => {
    const qty = getNonNegativeInt(`denom-${item.value}`);
    const subtotal = qty * item.value;
    totalCash += subtotal;
    const subtotalElem = document.getElementById(`subtotal-${item.value}`);
    if (subtotalElem) subtotalElem.textContent = formatRupiah(subtotal);
  });

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
  setElemText('summarySetoranPlusTransfer', formatRupiah(setoranPlusTransfer));
  setElemText('totalCashDisplay', formatRupiah(totalCash));

  const kasbonBiayaElem = document.getElementById('summaryKasbonMinusBiaya');
  const subtextKasbonBiaya = document.getElementById('subtextKasbonMinusBiaya');

  if (kasbonBiayaElem && subtextKasbonBiaya) {
    if (selisihKasbonBiaya >= 0) {
      kasbonBiayaElem.textContent = formatRupiah(selisihKasbonBiaya);
      kasbonBiayaElem.className = "text-base sm:text-xl font-black text-emerald-400 mt-1 sm:mt-2";
      subtextKasbonBiaya.textContent = "Sisa Kasbon (Biaya Tertutupi)";
    } else {
      kasbonBiayaElem.textContent = formatRupiah(selisihKasbonBiaya);
      kasbonBiayaElem.className = "text-base sm:text-xl font-black text-rose-400 mt-1 sm:mt-2";
      subtextKasbonBiaya.textContent = `Defisit Biaya ${formatRupiah(bebanBiayaKeCash)} diambil dari Cash`;
    }
  }

  const statusBadge = document.getElementById('balanceStatusBadge');
  const differenceText = document.getElementById('balanceDifferenceText');
  if (!statusBadge || !differenceText) return;

  const isAllZero =
    tagihanInput === 0 &&
    totalCash === 0 &&
    totalCredit === 0 &&
    totalSkr === 0 &&
    totalTransfer === 0 &&
    totalKasbon === 0 &&
    totalBiaya === 0;

  if (isAllZero) {
    statusBadge.className = "inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-base font-bold bg-slate-700 text-slate-300";
    statusBadge.innerHTML = `<i class="fa-solid fa-circle-info"></i> Masukkan data untuk melihat status`;
    differenceText.textContent = "";
    if (shouldSave) saveState(false);
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

  if (shouldSave) saveState(false);
}

function resetAll() {
  if (confirm('Apakah Anda yakin ingin mereset seluruh perhitungan dan menghapus data tersimpan?')) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('Gagal menghapus data localStorage:', err);
    }

    const totalTagihanInput = document.getElementById('totalTagihanInput');
    if (totalTagihanInput) totalTagihanInput.value = '';

    creditRowCounter = 0;
    skrRowCounter = 0;
    transferRowCounter = 0;
    kasbonRowCounter = 0;
    biayaRowCounter = 0;
    smallCashStoreCounter = 0;

    ['creditRowsContainer', 'skrRowsContainer', 'transferRowsContainer', 'kasbonRowsContainer', 'biayaRowsContainer', 'smallCashStoresContainer']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });

    denominations.forEach(item => {
      const elem = document.getElementById(`denom-${item.value}`);
      if (elem) elem.value = '';
    });

    addCreditRow('', '', false, false);
    addSkrRow('', '', '', false, false);
    addTransferRow('', '', '', false, false);
    addKasbonRow('', '', '', false, false);
    addBiayaRow('', '', false, false);
    addSmallCashStoreRow('', {}, false, false);
    applySmallCashStoresToDenominations(false, false);
    calculateAll(false);
    updateSaveIndicator('Data direset (auto-save aktif)', false);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  renderDenominations();
  const restored = loadState();
  if (!restored) {
    addCreditRow('', '', false, false);
    addSkrRow('', '', '', false, false);
    addTransferRow('', '', '', false, false);
    addKasbonRow('', '', '', false, false);
    addBiayaRow('', '', false, false);
    addSmallCashStoreRow('', {}, false, false);
  }
  calculateAll(false);
});
