// All expense rows come from these arrays. Add/change array items and the document rerenders automatically.
const claim = {
  worker: 'Madeleine Willson',
  claimNo: '20042047',
  appId: '712041',
  submitted: 'March 28, 2024 20:43',
  prescription: [
    {
      drug: 'Naproxen',
      prescriptionDate: 'February 28, 2024',
      purchased: 'February 29, 2024',
      provider: 'Dr. Best',
      amount: 20,
    },
  ],
  otc: [
    {
      drug: 'Advil',
      purchased: 'March 28, 2024',
      amount: 8,
      seller: 'Shoppers Drug Mart',
      reason: 'Pain',
    },
  ],
  supplies: [
    {
      item: 'Tensor',
      purchased: 'February 28, 2024',
      prescribed: 'Yes',
      provider: 'Dr. Best',
      amount: 10,
      seller: 'Shoppers Drug Mart',
    },
  ],
  parking: [
    {
      facility: '333 St Mary Ave, Winnipeg MB R3C 4A5, Canada',
      paid: 'March 28, 2024',
      amount: 10,
      meter: 'Yes',
      meterNumber: '12245',
    },
  ],
  mileage: [
    {
      appointment: 'March 28, 2024',
      facility: 'HSC, 820 Sherbrook St, Winnipeg MB R3A 1R9, Canada',
      workplace: 'WCB, 333 Broadway, Winnipeg MB R3C 4W3, Canada',
      km: '20 km',
    },
  ],
  busTaxi: [
    {
      appointment: 'March 28, 2024',
      start: '',
      facility: 'HSC Winnipeg Women’s Hospital, 665 William Ave, Winnipeg MB R3E 0Z2, Canada',
      method: 'Bus',
      amount: 3,
    },
    {
      appointment: 'March 27, 2024',
      start: '25 Furby St, Winnipeg MB R3C 2A2, Canada',
      facility: '440 Edmonton St, Winnipeg MB R3B 2M4, Canada',
      method: 'Taxi',
      amount: 15,
    },
  ],
};

const schema = {
  prescription: [
    ['drug', 'Drug Name'],
    ['prescriptionDate', 'Prescription Date'],
    ['purchased', 'Date Purchased'],
    ['provider', 'Healthcare Provider Name'],
    ['amount', 'Paid Amount'],
  ],
  otc: [
    ['drug', 'Drug Name'],
    ['purchased', 'Date Purchased'],
    ['amount', 'Paid Amount'],
    ['seller', "Seller's Name"],
    ['reason', 'Reason for Purchasing'],
  ],
  supplies: [
    ['item', 'Item Purchased'],
    ['purchased', 'Date Purchased'],
    ['prescribed', 'Was this Prescribed?'],
    ['provider', 'Healthcare Provider Name'],
    ['amount', 'Paid Amount'],
    ['seller', "Seller's Name"],
  ],
  parking: [
    ['facility', 'Address of Healthcare Provider/Medical Facility'],
    ['paid', 'Date Paid'],
    ['amount', 'Paid Amount'],
    ['meter', 'Meter Used?'],
    ['meterNumber', 'Meter Number'],
  ],
  mileage: [
    ['appointment', 'Appointment Date'],
    ['facility', 'Address of Healthcare Provider/Medical Facility'],
    ['workplace', 'Address of Workplace'],
    ['km', 'Number of km (Round Trip)'],
  ],
  busTaxi: [
    ['appointment', 'Appointment Date'],
    ['start', 'Address of Starting Point'],
    ['facility', 'Address of Healthcare Provider/Medical Facility'],
    ['method', 'Bus or Taxi (indicate one)'],
    ['amount', 'Total Fare Paid'],
  ],
};

const STORAGE_KEY = 'claimPreview';
const titles = {
  prescription: 'Prescription Drugs',
  otc: 'Over-the-Counter Drugs',
  supplies: 'Bandages, Braces or Other Medical Supplies',
  parking: 'Parking for Medical Appointments',
  mileage: 'Mileage to Medical Appointments',
  busTaxi: 'Bus or Taxi Fare for Medical Appointments*',
};

const esc = (value) =>
  String(value ?? '').replace(/[&<>\"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[char]));

const money = (value) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(Number(value) || 0);

function header() {
  return `
    <header class="form-header">
      <img src="logo.png" alt="WCB Manitoba logo">
      <div class="contact">
        333 Broadway<br>
        Winnipeg, MB R3C 4W3<br>
        Phone: (204) 954-4321<br>
        Toll Free: 1-855-954-4321<br>
        wcb.mb.ca
      </div>
      <div class="title-block">
        <h1>Medical &amp; Travel Expense<br>Request</h1>
        <div class="claim">Claim No. ${claim.claimNo}</div>
      </div>
    </header>
  `;
}

function footer(page) {
  return `
    <footer class="footer">
      <span>Worker App ID: ${claim.appId}</span>
      <span>Submitted: ${claim.submitted}</span>
      <span>Page ${page} of 2</span>
    </footer>
  `;
}

function table(key) {
  const fields = schema[key];
  const rows = claim[key];

  return `
    <section class="section">
      <h2>${titles[key]}</h2>
      ${key === 'mileage' ? '<p class="note">The WCB will generally reimburse only those transportation costs which are in excess of costs that would be incurred by the worker while travelling to and from work.</p>' : ''}
      ${key === 'busTaxi' ? '<p class="note">*Note: Pre-approval is required from your WCB representative to claim taxi fare(s).</p>' : ''}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${fields.map(([, label]) => `<th>${label}</th>`).join('')}
              <th aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row, index) => `
                <tr>
                  ${fields
                    .map(([field]) => `<td>${input(key, index, field, row[field])}</td>`)
                    .join('')}
                  <td>
                    <button class="remove" data-remove="${key}" data-index="${index}" title="Remove row">×</button>
                  </td>
                </tr>
              `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <button class="add-row" data-add="${key}" type="button">+ Add row</button>
      ${hasAmount(key) ? `<div class="subtotal">Subtotal: <strong>${money(rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0))}</strong></div>` : ''}
    </section>
  `;
}

function input(key, index, field, value) {
  if (field === 'meter' || field === 'prescribed' || field === 'method') {
    const options = field === 'method' ? ['Bus', 'Taxi'] : ['Yes', 'No'];

    return `
      <select data-key="${key}" data-index="${index}" data-field="${field}">
        ${options.map((option) => `<option ${option === value ? 'selected' : ''}>${option}</option>`).join('')}
      </select>
    `;
  }

  const type = field === 'amount' ? 'number' : 'text';
  const step = field === 'amount' ? 'step="0.01" min="0"' : '';

  return `<input type="${type}" ${step} value="${esc(value)}" data-key="${key}" data-index="${index}" data-field="${field}">`;
}

const hasAmount = (key) => ['prescription', 'otc', 'supplies', 'parking', 'busTaxi'].includes(key);

function blank(key) {
  return Object.fromEntries(schema[key].map(([field]) => [field, field === 'amount' ? 0 : '']));
}

let previewMode = false;

function loadPreview() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return;
  }

  try {
    const stored = JSON.parse(saved);
    Object.keys(stored).forEach((key) => {
      if (claim[key] !== undefined) {
        claim[key] = stored[key];
      }
    });
  } catch (error) {
    console.warn('Failed to load preview:', error);
  }
}

function savePreview() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(claim));
  console.log('Claim preview data:', claim);
  show('Preview saved to local storage and console');
}

function renderForm() {
  document.querySelector('#report').innerHTML = `
    <article class="page">
      ${header()}
      <p class="lead"><b>${claim.worker}</b> requested reimbursement for the following medical and/or travel expenses:</p>
      ${table('prescription')}
      ${table('otc')}
      ${table('supplies')}
      ${table('parking')}
      ${table('mileage')}
      ${footer(1)}
    </article>
    <article class="page">
      ${header()}
      ${table('busTaxi')}
      <div class="privacy">
        <label>
          <input id="privacy" type="checkbox">
          <span>I understand that the <b>Privacy Notice</b> applies to the personal information collected in this document.</span>
        </label>
      </div>
      <div class="submit-row">
        <button id="submit" type="button">Submit request</button>
        <button id="reset" type="button">Reset sample data</button>
      </div>
      ${footer(2)}
    </article>
  `;
}

function renderPreview() {
  document.querySelector('#report').innerHTML = `
    <article class="page preview">
      ${header()}
      <p class="lead"><b>${claim.worker}</b> requested reimbursement for the following medical and/or travel expenses:</p>
      ${table('prescription')}
      ${table('otc')}
      ${table('supplies')}
      ${table('parking')}
      ${table('mileage')}
      ${table('busTaxi')}
      <div class="privacy">
        <label>
          <input id="privacy" type="checkbox">
          <span>I understand that the <b>Privacy Notice</b> applies to the personal information collected in this document.</span>
        </label>
      </div>
      <div class="submit-row">
        <button id="back" type="button">Back to form</button>
      </div>
      ${footer(1)}
    </article>
  `;
}

function render() {
  if (previewMode) {
    renderPreview();
  } else {
    renderForm();
  }

  updateTotal();
}

function updateTotal() {
  const total = Object.values(claim)
    .filter(Array.isArray)
    .flat()
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  document.querySelector('#total').textContent = `Current total: ${money(total)}`;
}

document.addEventListener('change', (event) => {
  if (!event.target.matches('[data-key]')) {
    return;
  }

  const el = event.target;
  claim[el.dataset.key][el.dataset.index][el.dataset.field] =
    el.type === 'number' ? Number(el.value) : el.value;
  render();
});

document.addEventListener('click', (event) => {
  const add = event.target.closest('[data-add]');
  const remove = event.target.closest('[data-remove]');

  if (add) {
    claim[add.dataset.add].push(blank(add.dataset.add));
    render();
    return;
  }

  if (remove) {
    claim[remove.dataset.remove].splice(Number(remove.dataset.index), 1);
    render();
    return;
  }

  if (event.target.id === 'preview') {
    savePreview();
    previewMode = true;
    render();
    document.querySelector('#report').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (event.target.id === 'back') {
    previewMode = false;
    render();
    document.querySelector('#report').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (event.target.id === 'reset') {
    location.reload();
    return;
  }

  if (event.target.id === 'submit') {
    if (!document.querySelector('#privacy').checked) {
      show('Please confirm the Privacy Notice first.');
      return;
    }

    savePreview();
    show('Expense request submitted successfully.');
  }
});

function show(message) {
  const toast =
    document.querySelector('#toast') ||
    Object.assign(document.createElement('div'), { id: 'toast', className: 'toast' });

  toast.textContent = message;
  document.body.append(toast);
  toast.classList.add('show');

  setTimeout(() => toast.classList.remove('show'), 2800);
}

loadPreview();
render();
