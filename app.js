// ============ 配置 ============
const RATIOS = [
  { key: 'b', ratio: 0.786, label: '78.6%' },
  { key: 'c', ratio: 0.618, label: '61.8%' },
  { key: 'd', ratio: 0.500, label: '50.0%' },
  { key: 'e', ratio: 0.382, label: '38.2%' },
  { key: 'f', ratio: 0.236, label: '23.6%' },
];

// ============ DOM ============
const inputA = document.getElementById('inputA');
const inputG = document.getElementById('inputG');
const calcBtn = document.getElementById('calcBtn');
const clearBtn = document.getElementById('clearBtn');
const errorEl = document.getElementById('error');
const resultEl = document.getElementById('result');
const resultList = document.getElementById('resultList');
const toast = document.getElementById('toast');

// ============ 工具函数 ============
function parseNumber(str) {
  if (!str) return NaN;
  // 去除空格和千分位逗号
  const cleaned = String(str).trim().replace(/,/g, '');
  return Number(cleaned);
}

function formatNumber(n) {
  if (!isFinite(n)) return '—';
  // 对很小的数用足够精度，避免科学计数法
  if (Math.abs(n) < 1e-6 && n !== 0) {
    // 转为普通小数，保留有效数字
    return n.toFixed(12).replace(/0+$/, '').replace(/\.$/, '');
  }
  // 常规数字保留 8 位有效
  return parseFloat(n.toPrecision(8)).toString();
}

function showError(msg) {
  errorEl.textContent = msg;
}

function clearError() {
  errorEl.textContent = '';
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 1500);
}

// ============ 核心计算 ============
function calculate() {
  clearError();
  resultEl.classList.add('hidden');

  const a = parseNumber(inputA.value);
  const g = parseNumber(inputG.value);

  if (isNaN(a)) { showError('请输入有效的 100% 对应价格 (a)'); return; }
  if (isNaN(g)) { showError('请输入有效的 0% 对应价格 (g)'); return; }
  if (a <= 0 || g <= 0) { showError('价格必须为正数'); return; }
  if (a === g) { showError('a 和 g 不能相等'); return; }

  // 按定义：100% = a (低点)，0% = g (高点)
  // 从高点 g 向低点 a 回撤
  // 总跌幅 = g - a
  const total = g - a;

  const results = [
    { label: '100%', price: a, isEndpoint: true },
    ...RATIOS.map(r => ({
      label: r.label,
      price: g - total * r.ratio,
      isEndpoint: false,
    })),
    { label: '0%', price: g, isEndpoint: true },
  ];

  renderResults(results);
  resultEl.classList.remove('hidden');
}

function renderResults(results) {
  resultList.innerHTML = '';

  results.forEach(item => {
    const li = document.createElement('li');
    if (item.label === '61.8%') li.classList.add('highlight');
    if (item.isEndpoint) li.style.opacity = '0.85';

    const ratioSpan = document.createElement('span');
    ratioSpan.className = 'ratio';
    ratioSpan.textContent = item.label;

    const priceSpan = document.createElement('span');
    priceSpan.className = 'price';
    priceSpan.textContent = formatNumber(item.price);

    li.appendChild(ratioSpan);
    li.appendChild(priceSpan);

    // 点击复制
    li.addEventListener('click', async () => {
      const text = formatNumber(item.price);
      try {
        await navigator.clipboard.writeText(text);
        showToast(`已复制 ${item.label}: ${text}`);
      } catch {
        // 降级方案
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(`已复制 ${item.label}: ${text}`);
      }
    });

    resultList.appendChild(li);
  });
}

// ============ 事件绑定 ============
calcBtn.addEventListener('click', calculate);

clearBtn.addEventListener('click', () => {
  inputA.value = '';
  inputG.value = '';
  clearError();
  resultEl.classList.add('hidden');
  inputA.focus();
});

// 回车触发计算
[inputA, inputG].forEach(el => {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') calculate();
  });
});

// 输入时清除错误
[inputA, inputG].forEach(el => {
  el.addEventListener('input', clearError);
});

// ============ 注册 Service Worker ============
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('SW 注册失败:', err);
    });
  });
}