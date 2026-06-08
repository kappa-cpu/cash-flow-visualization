/* ============================================
   CONFIG & CONSTANTS
   ============================================ */

const CONFIG = {
  DAYS: 180,
  STORAGE_KEY: 'at-v1',
  DEFAULT_JOB_DAY: 25,
  DEFAULT_CARD_DAY: 10,
  MIN_DAY: 1,
  MAX_DAY: 31,
  UPDATE_DEBOUNCE_MS: 150,
  SAVED_FLASH_DURATION_MS: 2000,
};

const SELECTORS = {
  // Elements
  header: '#hdr',
  saved: '#saved',
  wrap: '#wrap',
  balanceInput: '#bal',
  chart: '#chart',
  
  // Left panel - Jobs
  jobsList: '#jl',
  noJobsMsg: '#nj',
  addJobBtn: '#addJobBtn',
  
  // Left panel - Cards
  cardsList: '#cl',
  noCardsMsg: '#nc',
  addCardBtn: '#addCardBtn',
  
  // Left panel - Transactions
  txList: '#tl',
  noTxMsg: '#nt',
  addTxBtn: '#addTxBtn',
  
  // Right panel - Summary
  s1: '#s1',
  s2: '#s2',
  s3: '#s3',
  eventsList: '#el',
};

const CSS_CLASSES = {
  itemCard: 'ic',
  jobName: 'jn',
  jobDay: 'jd',
  jobMonth: 'jm',
  cardName: 'cn',
  cardDay: 'cd',
  cardMonth: 'cm',
  txDate: 'td',
  txType: 'tb',
  txLabel: 'tl',
  txAmount: 'ta',
  deleteBtn: 'db',
  show: 'show',
};

const COLOR = {
  income: '#1D9E75',
  expenseDark: '#D85A30',
  incomeDark: '#0F6E56',
  expenseLight: '#993C1D',
};

/* ============================================
   STATE MANAGEMENT
   ============================================ */

let state = {
  chart: null,
  updateTimeout: null,
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const months = (() => {
  const arr = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    arr.push({
      month: d.getMonth() + 1,
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
    });
  }
  return arr;
})();

const todayString = formatDateString(today);

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

function padZero(n) {
  return String(n).padStart(2, '0');
}

function formatDateString(d) {
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

function formatCurrency(n) {
  const rounded = Math.round(n);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  return (isNegative ? '-' : '') + '¥' + abs.toLocaleString('ja-JP');
}

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function createElement(tag, className = '', innerHTML = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

/* ============================================
   DOM GENERATION HELPERS
   ============================================ */

function generateMonthInputs(className) {
  return `<div class="mg">${months
    .map(
      (m) => `
    <div class="mc">
      <span class="ml">${m.month}月</span>
      <input 
        type="number" 
        min="0" 
        data-k="${m.key}" 
        class="${className} mi" 
        placeholder="-"
      >
    </div>
  `
    )
    .join('')}</div>`;
}

function generateDayInput(value, label, className) {
  return `
  <div class="row">
    <span class="dl">毎月</span>
    <input 
      type="number" 
      value="${value}" 
      min="1" 
      max="31" 
      class="${className} di"
    >
    <span class="dl">${label}</span>
  </div>
  `;
}

/* ============================================
   JOB MANAGEMENT
   ============================================ */

function addJob(data = null, skipUpdate = false) {
  const list = $(SELECTORS.jobsList);
  const itemNum = list.children.length + 1;
  
  const jobCard = createElement('div', CSS_CLASSES.itemCard);
  jobCard.innerHTML = `
    <div class="row">
      <input 
        type="text" 
        class="${CSS_CLASSES.jobName}" 
        style="flex:1;font-size:14px;" 
        placeholder="バイト先名"
      >
      <button class="${CSS_CLASSES.deleteBtn}" aria-label="バイト給与を削除">
        <i class="ti ti-trash" style="font-size:13px;"></i>
      </button>
    </div>
    ${generateDayInput(CONFIG.DEFAULT_JOB_DAY, '日に入金', CSS_CLASSES.jobDay)}
    ${generateMonthInputs(CSS_CLASSES.jobMonth)}
  `;
  
  list.appendChild(jobCard);
  
  // Set values if data provided
  if (data) {
    jobCard.querySelector(`.${CSS_CLASSES.jobName}`).value = data.name || `バイト${itemNum}`;
    jobCard.querySelector(`.${CSS_CLASSES.jobDay}`).value = data.day || CONFIG.DEFAULT_JOB_DAY;
    if (data.months) {
      Object.entries(data.months).forEach(([k, v]) => {
        const input = jobCard.querySelector(`[data-k="${k}"]`);
        if (input && v) input.value = v;
      });
    }
  } else {
    jobCard.querySelector(`.${CSS_CLASSES.jobName}`).value = `バイト${itemNum}`;
  }
  
  // Add event listeners
  jobCard.querySelector(`.${CSS_CLASSES.deleteBtn}`).addEventListener('click', (e) => {
    if (confirm('削除してもよろしいですか？')) {
      jobCard.remove();
      updateDisplay();
    }
  });
  
  jobCard.querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', updateDisplay);
    input.addEventListener('input', debounceUpdate);
  });
  
  $(SELECTORS.noJobsMsg).style.display = 'none';
  
  if (!skipUpdate) updateDisplay();
}

/* ============================================
   CARD MANAGEMENT
   ============================================ */

function addCard(data = null, skipUpdate = false) {
  const list = $(SELECTORS.cardsList);
  const itemNum = list.children.length + 1;
  
  const cardItem = createElement('div', CSS_CLASSES.itemCard);
  cardItem.innerHTML = `
    <div class="row">
      <input 
        type="text" 
        class="${CSS_CLASSES.cardName}" 
        style="flex:1;font-size:14px;" 
        placeholder="カード名"
      >
      <button class="${CSS_CLASSES.deleteBtn}" aria-label="クレカを削除">
        <i class="ti ti-trash" style="font-size:13px;"></i>
      </button>
    </div>
    ${generateDayInput(CONFIG.DEFAULT_CARD_DAY, '日に引き落とし', CSS_CLASSES.cardDay)}
    ${generateMonthInputs(CSS_CLASSES.cardMonth)}
  `;
  
  list.appendChild(cardItem);
  
  // Set values if data provided
  if (data) {
    cardItem.querySelector(`.${CSS_CLASSES.cardName}`).value = data.name || `クレカ${itemNum}`;
    cardItem.querySelector(`.${CSS_CLASSES.cardDay}`).value = data.day || CONFIG.DEFAULT_CARD_DAY;
    if (data.months) {
      Object.entries(data.months).forEach(([k, v]) => {
        const input = cardItem.querySelector(`[data-k="${k}"]`);
        if (input && v) input.value = v;
      });
    }
  } else {
    cardItem.querySelector(`.${CSS_CLASSES.cardName}`).value = `クレカ${itemNum}`;
  }
  
  // Add event listeners
  cardItem.querySelector(`.${CSS_CLASSES.deleteBtn}`).addEventListener('click', () => {
    if (confirm('削除してもよろしいですか？')) {
      cardItem.remove();
      updateDisplay();
    }
  });
  
  cardItem.querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', updateDisplay);
    input.addEventListener('input', debounceUpdate);
  });
  
  $(SELECTORS.noCardsMsg).style.display = 'none';
  
  if (!skipUpdate) updateDisplay();
}

/* ============================================
   TRANSACTION MANAGEMENT
   ============================================ */

function addTx(data = null, skipUpdate = false) {
  const list = $(SELECTORS.txList);
  
  const txItem = createElement('div', CSS_CLASSES.itemCard);
  const txType = data?.type === 'income' ? 'income' : 'expense';
  const btnText = txType === 'income' ? '入金' : '出金';
  const btnColor = txType === 'income' ? 'var(--ts)' : 'var(--td)';
  
  txItem.innerHTML = `
    <div class="row">
      <input 
        type="date" 
        class="${CSS_CLASSES.txDate}" 
        style="flex:1;font-size:14px;min-width:0;"
      >
      <button 
        class="${CSS_CLASSES.txType} tb" 
        data-t="${txType}" 
        style="color:${btnColor}"
        aria-label="取引タイプを切り替え"
      >
        ${btnText}
      </button>
      <button class="${CSS_CLASSES.deleteBtn}" aria-label="取引を削除">
        <i class="ti ti-trash" style="font-size:13px;"></i>
      </button>
    </div>
    <div class="row">
      <input 
        type="text" 
        class="${CSS_CLASSES.txLabel}" 
        placeholder="説明（例：給料、家賃）"
      >
    </div>
    <div class="row">
      <input 
        type="number" 
        class="${CSS_CLASSES.txAmount}" 
        placeholder="金額"
        min="0"
      >
    </div>
  `;
  
  list.appendChild(txItem);
  
  // Set values if data provided
  if (data) {
    txItem.querySelector(`.${CSS_CLASSES.txDate}`).value = data.dateStr || todayString;
    txItem.querySelector(`.${CSS_CLASSES.txLabel}`).value = data.label || '';
    txItem.querySelector(`.${CSS_CLASSES.txAmount}`).value = data.amount || 0;
  } else {
    txItem.querySelector(`.${CSS_CLASSES.txDate}`).value = todayString;
  }
  
  // Add event listeners
  const typeBtn = txItem.querySelector(`.${CSS_CLASSES.txType}`);
  typeBtn.addEventListener('click', () => {
    const isExpense = typeBtn.dataset.t === 'expense';
    typeBtn.dataset.t = isExpense ? 'income' : 'expense';
    typeBtn.textContent = isExpense ? '入金' : '出金';
    typeBtn.style.color = isExpense ? 'var(--ts)' : 'var(--td)';
    updateDisplay();
  });
  
  txItem.querySelector(`.${CSS_CLASSES.deleteBtn}`).addEventListener('click', () => {
    if (confirm('削除してもよろしいですか？')) {
      txItem.remove();
      updateDisplay();
    }
  });
  
  txItem.querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', updateDisplay);
    input.addEventListener('input', debounceUpdate);
  });
  
  $(SELECTORS.noTxMsg).style.display = 'none';
  
  if (!skipUpdate) updateDisplay();
}

/* ============================================
   DATA RETRIEVAL
   ============================================ */

function getMonthInputValues(container, className) {
  const values = {};
  container.querySelectorAll(`.${className}`).forEach((input) => {
    values[input.dataset.k] = +input.value || 0;
  });
  return values;
}

function getAllJobs() {
  return [...$$(`.${CSS_CLASSES.itemCard}`)]
    .filter((el) => el.closest('#jl'))
    .map((el) => ({
      name: el.querySelector(`.${CSS_CLASSES.jobName}`).value || 'バイト',
      day: Math.max(CONFIG.MIN_DAY, Math.min(CONFIG.MAX_DAY, +el.querySelector(`.${CSS_CLASSES.jobDay}`).value || CONFIG.DEFAULT_JOB_DAY)),
      months: getMonthInputValues(el, CSS_CLASSES.jobMonth),
    }));
}

function getAllCards() {
  return [...$$(`.${CSS_CLASSES.itemCard}`)]
    .filter((el) => el.closest('#cl'))
    .map((el) => ({
      name: el.querySelector(`.${CSS_CLASSES.cardName}`).value || 'カード',
      day: Math.max(CONFIG.MIN_DAY, Math.min(CONFIG.MAX_DAY, +el.querySelector(`.${CSS_CLASSES.cardDay}`).value || CONFIG.DEFAULT_CARD_DAY)),
      months: getMonthInputValues(el, CSS_CLASSES.cardMonth),
    }));
}

function getAllTransactions() {
  return [...$$(`.${CSS_CLASSES.itemCard}`)]
    .filter((el) => el.closest('#tl'))
    .map((el) => ({
      dateStr: el.querySelector(`.${CSS_CLASSES.txDate}`).value,
      type: el.querySelector(`.${CSS_CLASSES.txType}`).dataset.t,
      label: el.querySelector(`.${CSS_CLASSES.txLabel}`).value || 'その他',
      amount: +el.querySelector(`.${CSS_CLASSES.txAmount}`).value || 0,
    }));
}

/* ============================================
   STORAGE
   ============================================ */

function saveData() {
  const data = {
    balance: +$(SELECTORS.balanceInput).value || 0,
    jobs: getAllJobs(),
    cards: getAllCards(),
    transactions: getAllTransactions(),
  };
  
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    flashSavedIndicator();
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

function loadData() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) return false;
    
    const data = JSON.parse(raw);
    
    if (data.balance) $(SELECTORS.balanceInput).value = data.balance;
    (data.jobs || []).forEach((job) => addJob(job, true));
    (data.cards || []).forEach((card) => addCard(card, true));
    (data.transactions || []).forEach((tx) => addTx(tx, true));
    
    return true;
  } catch (e) {
    console.error('Failed to load data:', e);
    return false;
  }
}

function flashSavedIndicator() {
  const el = $(SELECTORS.saved);
  el.classList.add(CSS_CLASSES.show);
  setTimeout(() => el.classList.remove(CSS_CLASSES.show), CONFIG.SAVED_FLASH_DURATION_MS);
}

/* ============================================
   PROJECTION & CALCULATIONS
   ============================================ */

function projectBalance(initialBalance, jobs, cards, transactions) {
  const labels = [];
  const balances = [];
  const events = [];
  let balance = initialBalance;
  
  for (let dayOffset = 0; dayOffset <= CONFIG.DAYS; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    
    const dayOfMonth = date.getDate();
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const dateStr = formatDateString(date);
    
    if (dayOffset > 0) {
      // Process jobs
      for (const job of jobs) {
        if (dayOfMonth === job.day) {
          const amount = job.months[monthKey] || 0;
          if (amount) {
            balance += amount;
            events.push({
              date: new Date(date),
              label: job.name,
              amount,
              type: 'income',
              dayOffset,
            });
          }
        }
      }
      
      // Process cards
      for (const card of cards) {
        if (dayOfMonth === card.day) {
          const amount = card.months[monthKey] || 0;
          if (amount) {
            balance -= amount;
            events.push({
              date: new Date(date),
              label: card.name,
              amount,
              type: 'expense',
              dayOffset,
            });
          }
        }
      }
      
      // Process transactions
      for (const tx of transactions) {
        if (tx.dateStr === dateStr) {
          if (tx.type === 'income') {
            balance += tx.amount;
            events.push({
              date: new Date(date),
              label: tx.label,
              amount: tx.amount,
              type: 'income',
              dayOffset,
            });
          } else {
            balance -= tx.amount;
            events.push({
              date: new Date(date),
              label: tx.label,
              amount: tx.amount,
              type: 'expense',
              dayOffset,
            });
          }
        }
      }
    }
    
    labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
    balances.push(Math.round(balance));
  }
  
  return { labels, balances, events };
}

/* ============================================
   CHART RENDERING
   ============================================ */

function renderChart(labels, balances, events) {
  const eventIndexSet = new Set(events.map((e) => e.dayOffset));
  
  if (state.chart) state.chart.destroy();
  
  state.chart = new Chart($(SELECTORS.chart), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '残高',
          data: balances,
          borderColor: COLOR.income,
          borderWidth: 2,
          backgroundColor: 'rgba(29, 158, 117, 0.07)',
          fill: true,
          tension: 0.25,
          pointRadius: balances.map((_, i) => (eventIndexSet.has(i) ? 5 : 1)),
          pointBackgroundColor: balances.map((_, i) => {
            const event = events.find((e) => e.dayOffset === i);
            return !event ? COLOR.income : event.type === 'income' ? COLOR.income : COLOR.expenseDark;
          }),
          pointBorderWidth: balances.map((_, i) => (eventIndexSet.has(i) ? 2 : 0)),
          pointBorderColor: balances.map((_, i) => {
            const event = events.find((e) => e.dayOffset === i);
            return !event ? 'transparent' : event.type === 'income' ? COLOR.incomeDark : COLOR.expenseLight;
          }),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(20, 20, 20, 0.9)',
          titleColor: '#e8e8e8',
          bodyColor: '#b8b8b8',
          padding: 10,
          callbacks: {
            title: (items) => `${items[0].label}の残高`,
            label: (ctx) => `  残高: ${formatCurrency(ctx.raw)}`,
            afterBody: (items) => {
              const dayIndex = items[0].dataIndex;
              return events
                .filter((e) => e.dayOffset === dayIndex)
                .map((e) => `  ${e.type === 'income' ? '↑' : '↓'} ${e.label}  ${formatCurrency(e.amount)}`);
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 8,
            font: { size: 11 },
            color: '#888',
            autoSkip: true,
            maxRotation: 0,
          },
          grid: { color: 'rgba(128, 128, 128, 0.1)' },
        },
        y: {
          ticks: {
            callback: (v) => {
              const abs = Math.abs(v);
              const sign = v < 0 ? '-' : '';
              return abs >= 10000 ? sign + (abs / 10000).toFixed(1).replace('.0', '') + '万' : sign + abs.toLocaleString();
            },
            font: { size: 11 },
            color: '#888',
          },
          grid: { color: 'rgba(128, 128, 128, 0.1)' },
        },
      },
    },
  });
}

/* ============================================
   DISPLAY UPDATE
   ============================================ */

function updateDisplay() {
  const currentBalance = +$(SELECTORS.balanceInput).value || 0;
  const jobs = getAllJobs();
  const cards = getAllCards();
  const transactions = getAllTransactions();
  
  syncVisibility();
  
  const { labels, balances, events } = projectBalance(currentBalance, jobs, cards, transactions);
  
  // Update summary cards
  $(SELECTORS.s1).textContent = formatCurrency(currentBalance);
  
  const minBalance = Math.min(...balances);
  const s2El = $(SELECTORS.s2);
  s2El.textContent = formatCurrency(minBalance);
  s2El.classList.toggle('negative', minBalance < 0);
  s2El.classList.toggle('positive', minBalance >= 0);
  
  const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
  const monthlyIncome = jobs.reduce((sum, j) => sum + (j.months[currentMonthKey] || 0), 0);
  const monthlyExpense = cards.reduce((sum, c) => sum + (c.months[currentMonthKey] || 0), 0);
  const netThisMonth = monthlyIncome - monthlyExpense;
  
  const s3El = $(SELECTORS.s3);
  s3El.textContent = (netThisMonth >= 0 ? '+' : '') + formatCurrency(netThisMonth);
  s3El.classList.toggle('positive', netThisMonth >= 0);
  s3El.classList.toggle('negative', netThisMonth < 0);
  
  // Render chart
  renderChart(labels, balances, events);
  
  // Update upcoming events
  const upcomingEvents = events.filter((e) => e.date >= today).slice(0, 8);
  const eventsList = $(SELECTORS.eventsList);
  
  if (upcomingEvents.length === 0) {
    eventsList.innerHTML = '<p style="font-size:13px;color:var(--t2);padding:4px 0;">入金・引き落としの入力がありません</p>';
  } else {
    eventsList.innerHTML = upcomingEvents
      .map((e, i) => {
        const bgColor = e.type === 'income' ? 'var(--bg-ok)' : 'var(--bg-ng)';
        const iconClass = e.type === 'income' ? 'ti-arrow-up' : 'ti-arrow-down';
        const iconColor = e.type === 'income' ? 'var(--ts)' : 'var(--td)';
        const amountColor = e.type === 'income' ? 'var(--ts)' : 'var(--td)';
        const amountSign = e.type === 'income' ? '+' : '-';
        const borderStyle = i < upcomingEvents.length - 1 ? 'border-bottom:0.5px solid var(--bd);' : '';
        
        return `
        <div class="er" style="${borderStyle}">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="ei" style="background:${bgColor};">
              <i class="ti ${iconClass}" style="font-size:14px;color:${iconColor};"></i>
            </div>
            <div>
              <p style="font-size:14px;font-weight:500;color:var(--t0);">${e.label}</p>
              <p style="font-size:11px;color:var(--t1);">${e.date.getFullYear()}年${e.date.getMonth() + 1}月${e.date.getDate()}日</p>
            </div>
          </div>
          <span style="font-size:14px;font-weight:500;flex-shrink:0;color:${amountColor};">${amountSign}${formatCurrency(e.amount)}</span>
        </div>
        `;
      })
      .join('');
  }
  
  saveData();
}

function syncVisibility() {
  $(SELECTORS.noJobsMsg).style.display = $$(`#jl .${CSS_CLASSES.itemCard}`).length === 0 ? 'block' : 'none';
  $(SELECTORS.noCardsMsg).style.display = $$(`#cl .${CSS_CLASSES.itemCard}`).length === 0 ? 'block' : 'none';
  $(SELECTORS.noTxMsg).style.display = $$(`#tl .${CSS_CLASSES.itemCard}`).length === 0 ? 'block' : 'none';
}

function debounceUpdate() {
  clearTimeout(state.updateTimeout);
  state.updateTimeout = setTimeout(updateDisplay, CONFIG.UPDATE_DEBOUNCE_MS);
}

/* ============================================
   EVENT LISTENERS SETUP
   ============================================ */

function setupEventListeners() {
  $(SELECTORS.balanceInput).addEventListener('input', debounceUpdate);
  $(SELECTORS.addJobBtn).addEventListener('click', () => addJob());
  $(SELECTORS.addCardBtn).addEventListener('click', () => addCard());
  $(SELECTORS.addTxBtn).addEventListener('click', () => addTx());
}

/* ============================================
   INITIALIZATION
   ============================================ */

function init() {
  setupEventListeners();
  
  // Load saved data, or create defaults
  if (!loadData()) {
    addJob(null, true);
    addCard(null, true);
  }
  
  syncVisibility();
  updateDisplay();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
